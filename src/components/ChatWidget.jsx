import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../useChat';
import { getApiKey, saveApiKey, clearApiKey } from '../gemini';
import { speakText, stopSpeaking, startRecording, fetchVoices, getVoiceId, setVoiceId } from '../elevenlabs';

// ─── Avatars ──────────────────────────────────────────────────────────────────

const BotAvatar = () => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="cw-avatar bot overflow-hidden flex items-center justify-center bg-[var(--surface-hover)]">
      {!imgError ? (
        <img src="/panorama.png" alt="Bukavu Hotels Assist"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <span className="text-[10px] font-extrabold text-[var(--accent-color)] select-none">P</span>
      )}
    </div>
  );
};

const UserAvatar = () => (
  <div className="cw-avatar user">
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  </div>
);

// ─── Icônes ───────────────────────────────────────────────────────────────────

const IconSpeaker = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const IconStop = () => (
  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" rx="3" />
  </svg>
);

const IconMic = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

// ─── Rendu Markdown ───────────────────────────────────────────────────────────

function renderMd(text) {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: var(--accent-color); text-decoration: underline; font-weight: 700;">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

// ─── Suggestions rapides ──────────────────────────────────────────────────────

import { ConciergeBell, Utensils, Waves, Van } from 'lucide-react';

const SUGGESTIONS = [
  { icon: ConciergeBell, label: 'Hôtels avec vue sur le lac' },
  { icon: Utensils, label: 'Hôtels avec restaurant' },
  { icon: Waves, label: 'Hôtel économique à Bukavu' },
  { icon: Van, label: 'Hôtel luxe à Bukavu' },
];

// ─── Barre audio flottante (visible seulement quand lecture en cours) ──────────

function AudioBar({ playingMsg, onStop }) {
  if (!playingMsg) return null;

  // Tronquer le texte pour affichage
  const preview = playingMsg.text?.slice(0, 60).replace(/\*\*/g, '') + (playingMsg.text?.length > 60 ? '…' : '');

  return (
    <div className="cw-audio-bar">
      <div className="cw-audio-bar-waves">
        <span /><span /><span /><span /><span />
      </div>
      <div className="cw-audio-bar-text">{preview}</div>
      <button className="cw-audio-bar-stop" onClick={onStop} title="Arrêter la lecture">
        <IconStop />
      </button>
    </div>
  );
}

// ─── Bouton TTS sur message bot ───────────────────────────────────────────────

function SpeakButton({ msg, ttsState, onSpeak }) {
  const state = ttsState[msg.id] || 'idle';
  if (msg.streaming || !msg.text || msg.error) return null;

  // N'afficher le bouton que quand idle ou en état quelconque (toujours visible)
  return (
    <button
      className={`cw-speak-btn ${state === 'playing' ? 'playing' : ''} ${state === 'loading' ? 'loading' : ''}`}
      onClick={() => onSpeak(msg)}
      title={state === 'playing' ? 'Arrêter' : state === 'loading' ? 'Chargement…' : 'Lire à voix haute'}
    >
      {state === 'loading' ? (
        <span className="cw-speak-dots"><span/><span/><span/></span>
      ) : state === 'playing' ? (
        <><IconStop /><span>Arrêter</span></>
      ) : (
        <><IconSpeaker /><span>Écouter</span></>
      )}
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearChat, resetSession } = useChat();
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Voix ElevenLabs
  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => getVoiceId());
  const [previewAudio, setPreviewAudio] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);

  // TTS : { [msgId]: 'idle'|'loading'|'playing'|'stopped'|'error' }
  const [ttsState, setTtsState] = useState({});

  // STT
  const [recState, setRecState] = useState('idle'); // idle | recording
  const [interimText, setInterimText] = useState(''); // texte temps réel
  const recorderRef = useRef(null);

  // Message actuellement lu (pour la barre audio)
  const playingMsg = messages.find(m => ttsState[m.id] === 'playing' || ttsState[m.id] === 'loading') || null;

  // ── Effets ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('panorama_assist_api_key') || localStorage.getItem('hackerbot_api_key') || '';
      setApiKeyInput(stored);
    }
  }, [open, showSettings]);

  // Charger les voix quand on ouvre les paramètres
  useEffect(() => {
    if (showSettings && voices.length === 0) {
      setVoicesLoading(true);
      fetchVoices().then(v => { setVoices(v); setVoicesLoading(false); });
    }
  }, [showSettings]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (open && !showSettings) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, showSettings]);

  // Arrêter audio immédiatement quand le widget est fermé
  useEffect(() => {
    if (!open) {
      // Arrêter la lecture TTS
      stopSpeaking((id, state) => setTtsState(prev => ({ ...prev, [id]: state })));
      // Arrêter la prévisualisation de voix
      if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); setPreviewingId(null); }
      // Arrêter l'enregistrement micro
      if (recorderRef.current) { recorderRef.current.stop(); recorderRef.current = null; setRecState('idle'); setInterimText(''); }
    }
  }, [open]);

  // ── Envoi message ─────────────────────────────────────────────────────────

  const submit = useCallback((e) => {
    e?.preventDefault();
    const text = input.trim() || interimText.trim();
    if (!text || isLoading) return;
    // Arrêter l'enregistrement avant d'envoyer
    if (recState === 'recording') {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setRecState('idle');
      setInterimText('');
    }
    sendMessage(text);
    setInput('');
    setInterimText('');
  }, [input, interimText, isLoading, recState, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  // ── Settings ──────────────────────────────────────────────────────────────

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveApiKey(apiKeyInput);
    resetSession();
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    clearApiKey();
    setApiKeyInput('');
    resetSession();
    setShowSettings(false);
  };

  // ── TTS ───────────────────────────────────────────────────────────────────

  const handleSpeak = useCallback((msg) => {
    speakText(msg.text, msg.id, (id, state) => {
      setTtsState(prev => ({ ...prev, [id]: state }));
    });
  }, []);

  const handleStopAudio = useCallback(() => {
    stopSpeaking((id, state) => setTtsState(prev => ({ ...prev, [id]: state })));
  }, []);

  // ── STT (Web Speech API — temps réel) ────────────────────────────────────

  const handleMicToggle = useCallback(() => {
    if (recState === 'recording') {
      recorderRef.current?.stop();
      recorderRef.current = null;
      // Valider le texte intermédiaire dans le champ
      if (interimText.trim()) {
        setInput(prev => (prev ? prev + ' ' + interimText.trim() : interimText.trim()));
        setInterimText('');
      }
      setRecState('idle');
    } else {
      setInterimText('');
      const recorder = startRecording({
        onInterim: (text) => setInterimText(text),
        onFinal: (text) => {
          setInterimText('');
          setInput(text);
        },
        onStateChange: (state) => setRecState(state),
        onError: (err) => {
          console.error('[STT]', err);
          setRecState('idle');
          setInterimText('');
        },
      });
      recorderRef.current = recorder;
    }
  }, [recState, interimText]);

  // Valeur affichée dans le textarea : texte saisi ou transcription en cours
  const displayValue = recState === 'recording' ? (interimText || input) : input;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button */}
      <button
        className={`cw-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir Bukavu Hotels Assist"
        title="Bukavu Hotels Assist"
      >
        {open
          ? <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          : <img src="/panorama.png" alt="Bukavu Hotels Assist" className="cw-fab-img" />
        }
        <span className="cw-fab-badge" />
      </button>

      {/* Chat panel */}
      <div className={`cw-panel ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-info">
            <img src="/panorama.png" alt="Bukavu Hotels Assist" className="cw-header-logo" />
            <div>
              <div className="cw-header-title">Bukavu Hotels Assist</div>
              <div className="cw-header-status">
                <span className="cw-dot" /> En ligne
                <span style={{ color: 'var(--accent-color)', fontSize: '0.65rem', marginLeft: '0.3rem' }}>· 🎙 AI Voice</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className={`cw-clear-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(s => !s)} title="Paramètres">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="cw-clear-btn" onClick={clearChat} title="Effacer l'historique">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
            </button>
          </div>
        </div>

        {showSettings ? (
          /* ── Settings Panel ── */
          <div className="cw-settings">
            <h3 className="cw-settings-title">Paramètres</h3>
            <p className="cw-settings-desc">
              L'assistant utilise <strong>Gemini</strong> pour les réponses et <strong>ElevenLabs Flash</strong> pour la voix ultra-rapide.
            </p>
            <form onSubmit={handleSaveSettings} className="cw-field-group">
              <label className="cw-label" htmlFor="apiKeyInput">Clé API Gemini</label>
              <input id="apiKeyInput" type="password" className="cw-settings-input"
                placeholder="Entrez votre clé API Gemini…"
                value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} />
              {localStorage.getItem('panorama_assist_api_key') || localStorage.getItem('hackerbot_api_key') ? (
                <span className="cw-key-badge">Clé API personnalisée active</span>
              ) : (
                <span className="cw-key-badge custom">Clé API par défaut active</span>
              )}
              <div className="cw-settings-buttons">
                <button type="submit" className="cw-btn cw-btn-primary" disabled={!apiKeyInput.trim()}>Sauvegarder</button>
                <button type="button" className="cw-btn cw-btn-secondary" onClick={handleResetSettings}>Réinitialiser</button>
              </div>
            </form>
            {/* ── Sélecteur de voix ElevenLabs ── */}
            <div className="cw-voice-section">
              <div className="cw-voice-header">
                <span style={{ fontSize: '1rem' }}>🎙</span>
                <div>
                  <div className="cw-voice-title">Voix ElevenLabs</div>
                  <div className="cw-voice-subtitle">Flash v2.5 — latence ~75ms</div>
                </div>
              </div>

              {voicesLoading ? (
                <div className="cw-voice-loading">
                  <span className="cw-speak-dots"><span/><span/><span/></span>
                  <span>Chargement des voix…</span>
                </div>
              ) : voices.length === 0 ? (
                <div className="cw-voice-empty">Impossible de charger les voix. Vérifiez votre clé API.</div>
              ) : (
                <div className="cw-voice-list">
                  {voices.map(v => {
                    const isSelected = selectedVoiceId === v.voice_id;
                    const isPreviewing = previewingId === v.voice_id;
                    const lang = v.labels?.language || v.labels?.accent || '';
                    const gender = v.labels?.gender || '';

                    const handlePreview = (e) => {
                      e.stopPropagation();
                      if (isPreviewing) {
                        previewAudio?.pause();
                        setPreviewAudio(null);
                        setPreviewingId(null);
                        return;
                      }
                      if (previewAudio) { previewAudio.pause(); }
                      if (!v.preview_url) return;
                      const audio = new Audio(v.preview_url);
                      audio.onended = () => { setPreviewAudio(null); setPreviewingId(null); };
                      audio.play();
                      setPreviewAudio(audio);
                      setPreviewingId(v.voice_id);
                    };

                    const handleSelect = () => {
                      setSelectedVoiceId(v.voice_id);
                      setVoiceId(v.voice_id);
                    };

                    return (
                      <div
                        key={v.voice_id}
                        className={`cw-voice-item ${isSelected ? 'selected' : ''}`}
                        onClick={handleSelect}
                      >
                        <div className="cw-voice-item-info">
                          <div className="cw-voice-name">{v.name}</div>
                          {(lang || gender) && (
                            <div className="cw-voice-tags">
                              {lang && <span className="cw-voice-tag">{lang}</span>}
                              {gender && <span className="cw-voice-tag">{gender}</span>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isSelected && <span className="cw-voice-check">✓</span>}
                          {v.preview_url && (
                            <button
                              className={`cw-voice-preview-btn ${isPreviewing ? 'playing' : ''}`}
                              onClick={handlePreview}
                              title={isPreviewing ? 'Arrêter' : 'Écouter un aperçu'}
                            >
                              {isPreviewing ? '■' : '▶'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Clé Gemini gratuite sur <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>Google AI Studio</a>.
            </div>
          </div>
        ) : (
          <>
            {/* ── Messages ── */}
            <div className="cw-messages">
              {messages.length === 0 && (
                <div className="cw-welcome flex flex-col items-center">
                  <BotAvatar />
                  <p className="cw-welcome-text mt-3">Bonjour ! Je suis <strong>Bukavu Hotels Assist</strong>.<br />Je vous aide à trouver et réserver dans les meilleurs hôtels de <strong>Bukavu</strong>.</p>
                  <div className="cw-chips">
                    {SUGGESTIONS.map(s => {
                      const I = s.icon;
                      return (
                        <button key={s.label} className="cw-chip" onClick={() => sendMessage(s.label)}>
                          <I size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`cw-msg-wrap ${msg.role === 'user' ? 'user' : ''}`}>
                  {msg.role === 'user' ? <UserAvatar /> : <BotAvatar />}
                  <div className={`cw-bubble-wrap ${msg.role}`}>
                    <div className={`cw-bubble ${msg.role}${msg.error ? ' error' : ''}`}>
                      {msg.role === 'bot'
                        ? (msg.text === '' && msg.streaming
                            ? <div className="cw-typing"><span /><span /><span /></div>
                            : <div dangerouslySetInnerHTML={{ __html: `<p>${renderMd(msg.text || '')}</p>` }} />
                          )
                        : <span>{msg.text}</span>
                      }
                    </div>
                    {/* Bouton Écouter — affiché sous chaque réponse bot terminée */}
                    {msg.role === 'bot' && !msg.error && (
                      <SpeakButton msg={msg} ttsState={ttsState} onSpeak={handleSpeak} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* ── Barre audio flottante (visible uniquement pendant la lecture) ── */}
            <AudioBar playingMsg={playingMsg} onStop={handleStopAudio} />

            {/* ── Input ── */}
            <div className="cw-input-wrap">
              <form className="cw-form" onSubmit={submit}>
                {/* Bouton microphone */}
                <button
                  type="button"
                  className={`cw-mic-btn ${recState === 'recording' ? 'recording' : ''}`}
                  onClick={handleMicToggle}
                  disabled={isLoading}
                  title={recState === 'recording' ? 'Arrêter l\'enregistrement' : 'Dicter (reconnaissance vocale)'}
                >
                  {recState === 'recording'
                    ? <><IconMic size={15} /><span className="cw-mic-dot" /></>
                    : <IconMic size={15} />
                  }
                </button>

                <textarea
                  ref={inputRef}
                  className={`cw-input ${recState === 'recording' ? 'interim' : ''}`}
                  rows={1}
                  value={displayValue}
                  onChange={e => {
                    if (recState !== 'recording') setInput(e.target.value);
                  }}
                  onKeyDown={handleKey}
                  placeholder={recState === 'recording' ? '🎙 Parlez…' : 'Posez votre question…'}
                  disabled={isLoading}
                  readOnly={recState === 'recording'}
                />

                <button type="submit" className="cw-send"
                  disabled={(!displayValue.trim()) || isLoading}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
