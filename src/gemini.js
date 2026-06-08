import { GoogleGenAI } from '@google/genai';

const DEFAULT_API_KEY = '';
const MODEL_NAME = 'gemini-2.5-flash';

export function getApiKey() {
  return (
    localStorage.getItem('panorama_assist_api_key') ||
    localStorage.getItem('hackerbot_api_key') ||
    (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
    DEFAULT_API_KEY
  );
}

export function saveApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('panorama_assist_api_key', key.trim());
  } else {
    localStorage.removeItem('panorama_assist_api_key');
  }
}

export function clearApiKey() {
  localStorage.removeItem('panorama_assist_api_key');
  localStorage.removeItem('hackerbot_api_key');
}

// Construit le system prompt avec les données réelles des chambres
function buildSystemInstruction(chambresData) {
  let roomContext = '';

  if (chambresData && chambresData.length > 0) {
    const parType = {};
    for (const ch of chambresData) {
      const t = ch.type_chambre;
      if (!t) continue;
      if (!parType[t.id]) {
        parType[t.id] = {
          nom: t.nom,
          prix: t.prix_base_nuit,
          description: t.description,
          capacite: `${t.capacite_adultes} adulte(s)${t.capacite_enfants > 0 ? ` + ${t.capacite_enfants} enfant(s)` : ''}`,
          equipements: (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })(),
          chambres: [],
        };
      }
      parType[t.id].chambres.push({
        numero: ch.numero_chambre,
        etage: ch.etage,
        statut: ch.statut,
      });
    }

    const STATUT_FR = {
      disponible: 'disponible',
      occupee: 'occupée',
      nettoyage: 'en cours de nettoyage',
      maintenance: 'en maintenance',
    };

    roomContext = `\n\n## DONNÉES EN TEMPS RÉEL — CHAMBRES DE L'HÔTEL PANORAMA\n\nVoici l'état exact et à jour de toutes les chambres :\n\n`;

    for (const g of Object.values(parType)) {
      const dispo = g.chambres.filter(c => c.statut === 'disponible');
      const nonDispo = g.chambres.filter(c => c.statut !== 'disponible');
      const equipStr = g.equipements.length > 0 ? g.equipements.join(', ') : '';

      roomContext += `### ${g.nom}\n`;
      roomContext += `- **Prix** : $${g.prix}/nuit\n`;
      roomContext += `- **Capacité** : ${g.capacite}\n`;
      roomContext += `- **Description** : ${g.description || 'Suite de luxe avec vue sur le lac Kivu'}\n`;
      if (equipStr) roomContext += `- **Équipements** : ${equipStr}\n`;
      roomContext += `- **Disponibles maintenant** : ${dispo.length} sur ${g.chambres.length}\n`;
      if (dispo.length > 0) {
        roomContext += `  - Numéros libres : ${dispo.map(c => `N°${c.numero}${c.etage ? ` (étage ${c.etage})` : ''}`).join(', ')}\n`;
      }
      if (nonDispo.length > 0) {
        roomContext += `  - Indisponibles : ${nonDispo.map(c => `N°${c.numero} (${STATUT_FR[c.statut] || c.statut})`).join(', ')}\n`;
      }
      roomContext += '\n';
    }

    const totalDispo = chambresData.filter(c => c.statut === 'disponible').length;
    roomContext += `**Total disponible en ce moment : ${totalDispo} chambre(s) sur ${chambresData.length}**\n`;
    roomContext += `\n_Utilise uniquement ces données pour répondre aux questions sur la disponibilité, les prix et les numéros de chambres._\n`;
  } else {
    roomContext = `\n\n## DONNÉES CHAMBRES\nLes données ne sont pas disponibles. Invite l'utilisateur à consulter la page /chambres ou à appeler la réception.\n`;
  }

  return `Tu es Panorama Assist, un assistant virtuel de haut standing pour l'Hôtel Panorama à Bukavu, RDC.

Tu fournis des informations précises sur :
- La disponibilité des chambres (données en temps réel ci-dessous)
- Les tarifs et types de chambres
- La réservation en ligne (page /chambres du site)
- Les repas et services de l'hôtel

Directives :
1. **Langue** : Réponds dans la langue de l'utilisateur (français, anglais, swahili, lingala). Défaut : français.
2. **Ton** : Professionnel, formel, courtois. Jamais familier.
3. **Précision** : Pour les chambres, utilise UNIQUEMENT les données réelles ci-dessous. Ne fabrique jamais de données.
4. **Réservation** : Guide le client vers /chambres pour réserver en ligne.
5. **Suggestion** : Termine chaque réponse par une question de suivi pertinente.
${roomContext}`;
}

/**
 * Crée une session Gemini avec les données chambres en temps réel et préserve l'historique.
 */
export function createChatSession(chambresData = [], history = []) {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Clé API manquante. Configurez votre clé API Gemini dans les paramètres (icône engrenage).");
  }
  const ai = new GoogleGenAI({ apiKey });

  return ai.chats.create({
    model: MODEL_NAME,
    history: history,
    config: {
      systemInstruction: buildSystemInstruction(chambresData),
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
}

/**
 * Envoie un message en streaming.
 */
export async function sendMessageStream(chat, message, onChunk) {
  const stream = await chat.sendMessageStream({ message });
  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}
