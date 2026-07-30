import { GoogleGenAI } from '@google/genai';

const DEFAULT_API_KEY = '';
const MODEL_NAME = 'gemini-2.5-flash';

// ─── Clé API ─────────────────────────────────────────────────────────────────
export function getApiKey() {
  return (
    localStorage.getItem('panorama_assist_api_key') ||
    localStorage.getItem('hackerbot_api_key') ||
    (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
    DEFAULT_API_KEY
  );
}
export function saveApiKey(key) {
  if (key && key.trim()) localStorage.setItem('panorama_assist_api_key', key.trim());
  else localStorage.removeItem('panorama_assist_api_key');
}
export function clearApiKey() {
  localStorage.removeItem('panorama_assist_api_key');
  localStorage.removeItem('hackerbot_api_key');
}

// ─── Données statiques des hôtels (hotels.json importé) ──────────────────────
import hotelsData from '../hotels.json';

// ─── Construire le catalogue des hôtels pour le prompt ────────────────────────
function buildHotelsCatalogue() {
  const hotels = hotelsData.hotels || [];
  let catalogue = '';
  for (const h of hotels) {
    const roomTypes = h.features?.rooms?.types || [];
    const amenities = (h.features?.amenities || []).map(a => `${a.category}: ${a.items.join(', ')}`).join(' | ');
    const prices = roomTypes.map(r => `${r.name} ($${r.price_range_usd}/nuit)`).join(', ');
    const extras = [
      h.features?.wifi && 'WiFi gratuit',
      h.features?.pools && 'Piscine',
      h.features?.gym && 'Salle de sport',
      h.features?.spa && 'Spa',
    ].filter(Boolean).join(', ');

    catalogue += `
### 🏨 ${h.name}
- **Catégorie** : ${h.category}
- **Adresse** : ${h.address?.street}, ${h.address?.area}, Bukavu
- **Téléphone** : ${h.contact?.phone || 'Non disponible'}
${h.contact?.website ? `- **Site web** : ${h.contact.website}` : ''}
- **Description** : ${h.description?.summary}
- **Détails** : ${h.description?.detailed}
- **Chambres** : ${h.features?.rooms?.total || '?'} chambres — Types : ${prices}
- **Équipements** : ${extras || 'Standard'}
- **Services** : ${amenities}
- **Tags** : ${h.keywords_tags?.join(', ')}
- **À proximité** : ${h.nearby?.join(', ')}
- **Lien réservation sur ce site** : [Réserver ici](${h.booking_link})
`;
  }
  return catalogue;
}

// ─── System Prompt principal ──────────────────────────────────────────────────
function buildSystemInstruction(chambresData) {
  // Données temps réel chambres (pour l'hôtel actif)
  let roomContext = '';
  if (chambresData && chambresData.length > 0) {
    const parType = {};
    for (const ch of chambresData) {
      const t = ch.type_chambre;
      if (!t) continue;
      if (!parType[t.id]) {
        parType[t.id] = {
          nom: t.nom,
          hotel_slug: ch.hotel_slug,
          prix: t.prix_base_nuit,
          description: t.description,
          capacite: `${t.capacite_adultes} adulte(s)${t.capacite_enfants > 0 ? ` + ${t.capacite_enfants} enfant(s)` : ''}`,
          equipements: (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })(),
          chambres: [],
        };
      }
      parType[t.id].chambres.push({ numero: ch.numero_chambre, etage: ch.etage, statut: ch.statut });
    }
    const STATUT_FR = { disponible: 'disponible', occupee: 'occupée', nettoyage: 'en nettoyage', maintenance: 'en maintenance' };
    roomContext = '\n\n## 📊 DISPONIBILITÉ EN TEMPS RÉEL (Base de données)\n\n';
    for (const g of Object.values(parType)) {
      const dispo = g.chambres.filter(c => c.statut === 'disponible');
      const nonDispo = g.chambres.filter(c => c.statut !== 'disponible');
      const equipStr = g.equipements.length > 0 ? g.equipements.join(', ') : 'WiFi, TV, Climatisation';
      roomContext += `**${g.nom}** (${g.hotel_slug}) — $${g.prix}/nuit — Capacité: ${g.capacite}\n`;
      roomContext += `  Équipements: ${equipStr}\n`;
      roomContext += `  Disponibles: ${dispo.length}/${g.chambres.length}`;
      if (dispo.length > 0) roomContext += ` — Numéros: ${dispo.map(c => `N°${c.numero}${c.etage ? ` (étage ${c.etage})` : ''}`).join(', ')}`;
      if (nonDispo.length > 0) roomContext += ` | Indisponibles: ${nonDispo.map(c => `N°${c.numero} (${STATUT_FR[c.statut] || c.statut})`).join(', ')}`;
      roomContext += '\n';
    }
    const totalDispo = chambresData.filter(c => c.statut === 'disponible').length;
    roomContext += `\n**Total disponible : ${totalDispo} chambre(s) sur ${chambresData.length}**\n`;
    roomContext += `\n_Utilise UNIQUEMENT ces données pour les disponibilités et prix réels. Ne jamais inventer._\n`;
  } else {
    roomContext = '\n\n## DISPONIBILITÉ EN TEMPS RÉEL\nDonnées indisponibles pour le moment. Oriente le client vers la page **/chambres** du site ou les appelle à contacter directement l\'hôtel.\n';
  }

  const hotelsCatalogue = buildHotelsCatalogue();

  return `Tu es **Panorama Assist**, l'assistant virtuel officiel de la **plateforme de réservation hôtelière de Bukavu** (République Démocratique du Congo).

---

## 🎯 MISSION PRINCIPALE
Tu aides les clients à :
1. **Découvrir** les hôtels de Bukavu selon leurs besoins (budget, standing, emplacement, activités)
2. **Répondre** à leurs questions précises sur chaque hôtel (prix, services, localisation, contact)
3. **Orienter** vers la réservation en ligne sur ce site en générant le bon lien pour chaque hôtel
4. **Rassurer** et accompagner les clients tout au long de leur processus de choix

---

## 🏙️ CONTEXTE — BUKAVU & SES HÔTELS
Bukavu est la capitale du Sud-Kivu, en RDC, au bord du magnifique **lac Kivu**. La ville dispose d'une offre hôtelière variée, du lodge de luxe au centre d'accueil économique.

- **Devise** : USD (dollar américain), Francs Congolais acceptés
- **Fuseau horaire** : UTC+2 (Africa/Lubumbashi)
- **Check-in standard** : 14h00 | **Check-out standard** : 11h00
- **Aéroport** : Kavumu (BKY) à ~45 min de Bukavu

---

## 🏨 CATALOGUE COMPLET DES HÔTELS DE BUKAVU

${hotelsCatalogue}

---

## 💡 RÈGLES DE RÉSERVATION (TRÈS IMPORTANT)
- **La réservation se fait UNIQUEMENT sur ce site web**. Ne jamais dire "contactez l'hôtel directement" pour réserver.
- Pour réserver, génère TOUJOURS un lien cliquable en utilisant le booking_link de l'hôtel concerné.
- Exemple de lien : [Réserver à l'Orchids' Safari Club](/hotel/orchids-safari-club)
- Si le client est prêt à réserver, dis-lui de cliquer sur le lien et de choisir ses dates sur le site.
- **Ne jamais simuler une réservation** dans le chat. Le site web gère tout le processus.

---

## 🌍 LANGUES SUPPORTÉES
Réponds dans la langue du client : **Français** (principale), **Anglais**, **Swahili**, **Lingala**.
Par défaut : français.

---

## 🎭 TON & STYLE
- Professionnel, chaleureux et concis — représente une plateforme hôtelière premium
- Structure tes réponses avec des listes et des titres quand c'est utile
- Sois proactif : si quelqu'un cherche un hôtel, demande son budget, ses préférences, ses dates
- Honnête : si une info n'est pas dans ta base, dis-le clairement

---

## ⚠️ RÈGLES ABSOLUES
- **NE JAMAIS inventer** des prix, disponibilités ou informations non présentes dans ce fichier
- **NE JAMAIS** aborder des sujets politiques, religieux ou de sécurité nationale
- **TOUJOURS** orienter la réservation vers ce site web avec le bon lien
- **TOUJOURS** terminer par une question de suivi ou une invitation à agir

${roomContext}`;
}

// ─── Session Gemini ───────────────────────────────────────────────────────────
export function createChatSession(chambresData = [], history = []) {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Clé API manquante. Configurez votre clé API Gemini dans les paramètres (icône engrenage).");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: MODEL_NAME,
    history,
    config: {
      systemInstruction: buildSystemInstruction(chambresData),
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
}

// ─── Envoi avec retry robuste ─────────────────────────────────────────────────
export async function sendMessageStream(chat, message, onChunk) {
  const MAX_RETRIES = 4;
  const BASE_DELAY_MS = 2000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const stream = await chat.sendMessageStream({ message });
      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) { fullText += text; onChunk(text); }
      }
      return fullText;
    } catch (err) {
      const errMsg = err?.message || '';
      const errCode = err?.status || err?.code;
      const is503 = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
      const is429 = errMsg.includes('429') || errCode === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      const isRetryable = is503 || is429;
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      if (isRetryable && !isLastAttempt) {
        let delay = BASE_DELAY_MS * Math.pow(2, attempt);
        const retryMatch = errMsg.match(/retry in (\d+)/i);
        if (retryMatch) delay = Math.min(parseInt(retryMatch[1]) * 1000, 30000);
        const reason = is503 ? 'surcharge serveur' : 'limite de quota';
        console.warn(`Gemini [${reason}] — tentative ${attempt + 1}/${MAX_RETRIES}. Retry dans ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (is429 && isLastAttempt) {
        throw new Error("L'assistant est temporairement indisponible (limite de requêtes atteinte). Veuillez patienter quelques minutes et réessayer.");
      } else if (is503 && isLastAttempt) {
        throw new Error("Le service Gemini est momentanément surchargé. Veuillez réessayer dans quelques instants.");
      } else {
        throw err;
      }
    }
  }
}
