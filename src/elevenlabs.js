/**
 * elevenlabs.js — ElevenLabs TTS + Web Speech API STT
 *
 * TTS : ElevenLabs Flash v2.5 (≈75ms latency) + streaming MediaSource
 * STT : Web Speech API (temps réel, résultats intermédiaires instantanés)
 */

// ─── Configuration TTS ────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY =
  import.meta.env.VITE_ELEVENLABS_API_KEY || '';

// ─── Gestion de la voix (persistée dans localStorage) ────────────────────────

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George — multilingue FR/EN
const VOICE_STORAGE_KEY = 'panorama_assist_voice_id';

/** Retourne l'ID de voix actif (localStorage ou défaut). */
export function getVoiceId() {
  return localStorage.getItem(VOICE_STORAGE_KEY) || DEFAULT_VOICE_ID;
}

/** Sauvegarde l'ID de voix choisi. */
export function setVoiceId(id) {
  if (id && id.trim()) {
    localStorage.setItem(VOICE_STORAGE_KEY, id.trim());
  } else {
    localStorage.removeItem(VOICE_STORAGE_KEY);
  }
}

/**
 * Récupère la liste des voix disponibles sur le compte ElevenLabs.
 * @returns {Promise<Array<{voice_id, name, category, labels, preview_url}>>}
 */
export async function fetchVoices() {
  if (!ELEVENLABS_API_KEY) return [];
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
    if (!res.ok) throw new Error(`ElevenLabs voices ${res.status}`);
    const data = await res.json();
    // Trier : premade d'abord, puis cloned/generated
    const voices = (data.voices || []).sort((a, b) => {
      const order = { premade: 0, professional: 1, cloned: 2, generated: 3 };
      return (order[a.category] ?? 9) - (order[b.category] ?? 9);
    });
    return voices;
  } catch (err) {
    console.error('[ElevenLabs] fetchVoices:', err);
    return [];
  }
}

// eleven_flash_v2_5 : latence ~75ms (vs plusieurs secondes pour eleven_v3)
const MODEL_ID = 'eleven_flash_v2_5';

// ─── État global audio ────────────────────────────────────────────────────────

let currentAudio = null;
let currentObjectUrl = null;
let currentPlayingMsgId = null;

// ─── TTS : Text-to-Speech avec streaming ──────────────────────────────────────

/**
 * Convertit du texte en voix ElevenLabs et joue en streaming dès le 1er chunk.
 * Utilise MediaSource API pour démarrer la lecture avant la fin du téléchargement.
 *
 * @param {string} text
 * @param {string} msgId
 * @param {function} onStateChange(msgId, state) — 'loading'|'playing'|'stopped'|'error'
 */
export async function speakText(text, msgId, onStateChange) {
  // Arrêter l'audio en cours
  if (currentAudio) {
    currentAudio.pause();
    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
    currentAudio = null;
    if (currentPlayingMsgId) onStateChange(currentPlayingMsgId, 'stopped');
    // Toggle : re-clic sur le même message = arrêt
    if (currentPlayingMsgId === msgId) { currentPlayingMsgId = null; return; }
  }

  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] Clé API manquante.');
    onStateChange(msgId, 'error');
    return;
  }

  const cleanText = stripMarkdown(text);
  if (!cleanText.trim()) return;

  onStateChange(msgId, 'loading');
  currentPlayingMsgId = msgId;

  try {
    // Endpoint /stream pour démarrer la lecture dès les premiers octets reçus
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${getVoiceId()}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: MODEL_ID,
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.80,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs ${response.status}: ${err}`);
    }

    // Essayer le streaming MediaSource (Chrome/Edge) ; sinon fallback blob
    const canStream = window.MediaSource && MediaSource.isTypeSupported('audio/mpeg');

    if (canStream) {
      await _playWithMediaSource(response, msgId, onStateChange);
    } else {
      await _playWithBlob(response, msgId, onStateChange);
    }

  } catch (err) {
    console.error('[ElevenLabs TTS]', err);
    if (currentPlayingMsgId === msgId) {
      currentAudio = null;
      currentPlayingMsgId = null;
      onStateChange(msgId, 'error');
    }
  }
}

/** Streaming via MediaSource — lecture dès le 1er chunk (Chrome, Edge) */
async function _playWithMediaSource(response, msgId, onStateChange) {
  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  const audio = new Audio(objectUrl);
  currentAudio = audio;
  currentObjectUrl = objectUrl;

  await new Promise((resolve, reject) => {
    mediaSource.addEventListener('sourceopen', async () => {
      let sourceBuffer;
      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      } catch (e) {
        reject(e);
        return;
      }

      const reader = response.body.getReader();
      let firstChunk = true;

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              await _waitForBuffer(sourceBuffer);
              if (mediaSource.readyState === 'open') mediaSource.endOfStream();
              break;
            }

            await _waitForBuffer(sourceBuffer);
            sourceBuffer.appendBuffer(value);

            // Lancer la lecture dès le 1er chunk reçu
            if (firstChunk) {
              firstChunk = false;
              audio.play().catch(() => {});
              onStateChange(msgId, 'playing');
            }
          }
        } catch (e) {
          reject(e);
        }
      };

      pump();

      audio.onended = () => {
        _cleanup(objectUrl);
        if (currentPlayingMsgId === msgId) {
          currentAudio = null;
          currentObjectUrl = null;
          currentPlayingMsgId = null;
          onStateChange(msgId, 'stopped');
        }
        resolve();
      };

      audio.onerror = () => {
        _cleanup(objectUrl);
        reject(new Error('Audio playback error'));
      };
    });

    mediaSource.addEventListener('error', reject);
  });
}

/** Fallback blob — télécharger tout puis jouer (Safari, Firefox) */
async function _playWithBlob(response, msgId, onStateChange) {
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  currentAudio = audio;
  currentObjectUrl = objectUrl;

  audio.oncanplay = () => {
    audio.play().catch(() => {});
    onStateChange(msgId, 'playing');
  };

  await new Promise((resolve, reject) => {
    audio.onended = () => {
      _cleanup(objectUrl);
      if (currentPlayingMsgId === msgId) {
        currentAudio = null;
        currentObjectUrl = null;
        currentPlayingMsgId = null;
        onStateChange(msgId, 'stopped');
      }
      resolve();
    };
    audio.onerror = reject;
  });
}

function _waitForBuffer(sourceBuffer) {
  return new Promise(resolve => {
    if (!sourceBuffer.updating) { resolve(); return; }
    sourceBuffer.addEventListener('updateend', resolve, { once: true });
  });
}

function _cleanup(objectUrl) {
  try { URL.revokeObjectURL(objectUrl); } catch (_) {}
}

/**
 * Arrête la lecture en cours.
 */
export function stopSpeaking(onStateChange) {
  if (currentAudio) {
    currentAudio.pause();
    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
    if (currentPlayingMsgId && onStateChange) onStateChange(currentPlayingMsgId, 'stopped');
    currentAudio = null;
    currentPlayingMsgId = null;
  }
}

export function getCurrentPlayingMsgId() {
  return currentPlayingMsgId;
}

// ─── STT : Web Speech API (temps réel) ────────────────────────────────────────

/**
 * Lance la reconnaissance vocale en temps réel via Web Speech API.
 * Résultats intermédiaires affichés instantanément pendant que l'utilisateur parle.
 *
 * @param {object} options
 * @param {function} options.onInterim(text)   — texte provisoire en cours (temps réel)
 * @param {function} options.onFinal(text)     — texte final validé
 * @param {function} options.onStateChange(state) — 'recording'|'idle'
 * @param {function} options.onError(msg)
 * @returns {{ stop: function }}
 */
export function startRecording({ onInterim, onFinal, onStateChange, onError }) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.('La reconnaissance vocale n\'est pas supportée par ce navigateur. Utilisez Chrome ou Edge.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';           // Français prioritaire
  recognition.continuous = true;         // Ne pas s'arrêter après une pause
  recognition.interimResults = true;     // Résultats en temps réel

  let finalTranscript = '';

  recognition.onstart = () => {
    onStateChange?.('recording');
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
        onFinal?.(finalTranscript.trim());
      } else {
        interim += result[0].transcript;
      }
    }
    // Afficher le texte provisoire en temps réel
    onInterim?.(finalTranscript + interim);
  };

  recognition.onerror = (event) => {
    console.error('[STT]', event.error);
    if (event.error === 'not-allowed') {
      onError?.('Permission microphone refusée. Autorisez l\'accès dans votre navigateur.');
    } else if (event.error !== 'no-speech') {
      onError?.(`Erreur reconnaissance vocale : ${event.error}`);
    }
    onStateChange?.('idle');
  };

  recognition.onend = () => {
    onStateChange?.('idle');
  };

  try {
    recognition.start();
  } catch (err) {
    onError?.('Impossible de démarrer la reconnaissance vocale.');
    return null;
  }

  return {
    stop: () => {
      try { recognition.stop(); } catch (_) {}
    },
  };
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
