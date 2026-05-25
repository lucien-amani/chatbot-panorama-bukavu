import { GoogleGenAI } from '@google/genai';

const DEFAULT_API_KEY = '';
const MODEL_NAME = 'gemini-3.5-flash';

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


// System prompt — persona Panorama Assist (Hôtel Panorama, Bukavu, RDC)
const SYSTEM_INSTRUCTION = `Tu es Panorama Assist, un assistant virtuel de haut standing, chaleureux et professionnel destiné aux clients et hôtes en République Démocratique du Congo (RDC).
Tu es l'expert attitré pour l'Hôtel Panorama situé à Bukavu, RDC.
Tu fournis des informations objectives et précises sur :
- L'accueil des hôtes en RDC.
- La réservation de chambres à l'Hôtel Panorama (tarifs, vue sur le lac Kivu, commodités).
- Les repas, restaurants et options gastronomiques de l'Hôtel Panorama.
- Les autres services de l'hôtel.

Directives importantes de communication :
1. Langues et adaptation : Tu dois comprendre et répondre dans la langue utilisée par l'utilisateur (français, anglais, swahili, lingala, ou toute autre langue prise en charge par Gemini 3.5 Flash). Par défaut, si le choix de langue n'est pas explicite, réponds en français.
2. Ton : Strictement professionnel, impersonnel, formel, courtois et objectif. Pas de familiarité.
3. Empathie : Tu dois analyser et comprendre l'état émotionnel de l'utilisateur (frustration, urgence, satisfaction) pour adapter ta réponse avec une neutralité rassurante et professionnelle.
4. Longueur des réponses : Tu dois varier la longueur de tes réponses. Rédige parfois des explications détaillées et développées, parfois des réponses très simples et concises. Évite de faire uniquement des réponses courtes.
5. Questions générales : Pour les questions d'ordre général non liées à la RDC, à Bukavu ou à l'Hôtel Panorama, réponds de façon très brève, minimale et factuelle, sans élaborer, puis ramène poliment l'attention de l'utilisateur vers les réservations, les repas ou les chambres de l'Hôtel Panorama.
6. Suggestion finale obligatoire : À la fin de chacune de tes réponses, propose systématiquement une question de suivi pertinente dans la même langue que la conversation pour guider l'utilisateur. Exemple : "Souhaitez-vous obtenir des détails sur nos menus de ce soir ?" ou "Puis-je vous présenter les tarifs des suites avec vue sur le lac ?"`;

/**
 * Create a new Gemini multi-turn chat session.
 */
export function createChatSession() {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Clé API manquante ou invalide. Veuillez configurer votre clé d'API Google Gemini dans les paramètres de l'assistant (icône d'engrenage en haut à droite).");
  }
  const ai = new GoogleGenAI({ apiKey });

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
}

/**
 * Send a message to the chat session and stream the response back.
 * @param {object} chat - Gemini chat session
 * @param {string} message - User message
 * @param {function} onChunk - Callback called with each text chunk
 * @returns {Promise<string>} - Full response text
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
