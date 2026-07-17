import { GoogleGenAI } from '@google/genai';

const DEFAULT_API_KEY = '';

// gemini-2.5-flash : modèle le plus récent et performant de Google
// (connu aussi sous "Gemini 3.5 Flash" dans les interfaces Google)
const MODEL_NAME = 'gemini-2.5-flash';

// ─── Gestion de la clé API ────────────────────────────────────────────────────

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

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemInstruction(chambresData) {
  // Données temps réel des chambres
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
      const equipStr = g.equipements.length > 0 ? g.equipements.join(', ') : 'WiFi, climatisation, TV';

      roomContext += `### ${g.nom}\n`;
      roomContext += `- **Prix** : $${g.prix}/nuit\n`;
      roomContext += `- **Capacité** : ${g.capacite}\n`;
      roomContext += `- **Description** : ${g.description || 'Suite de luxe avec vue sur le lac Kivu'}\n`;
      roomContext += `- **Équipements** : ${equipStr}\n`;
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
    roomContext += `\n_Utilise UNIQUEMENT ces données pour répondre aux questions sur la disponibilité, les prix et les numéros de chambres. Ne fabrique jamais de données inventées._\n`;
  } else {
    roomContext = `\n\n## DONNÉES CHAMBRES\nLes données temps réel ne sont pas disponibles pour le moment. Dans ce cas :\n- Indique à l'utilisateur que les informations de disponibilité sont accessibles sur la page /chambres du site\n- Propose-lui d'appeler la réception : +243 XXX XXX XXX\n- Donne les informations générales sur les types de chambres disponibles à l'hôtel\n`;
  }

  return `Tu es **Panorama Assist**, l'assistant virtuel officiel de l'**Hôtel Panorama** à Bukavu, en République Démocratique du Congo (RDC).

---

## IDENTITÉ & MISSION
Tu es un concierge virtuel de haut standing. Ta mission est d'accueillir chaleureusement les clients, de répondre à toutes leurs questions sur l'hôtel, de les orienter dans leurs démarches de réservation et de séjour, et de promouvoir les services de l'hôtel de manière professionnelle.

---

## INFORMATIONS ESSENTIELLES SUR L'HÔTEL

### 📍 Localisation
- **Ville** : Bukavu, province du Sud-Kivu, République Démocratique du Congo (RDC)
- **Cadre** : L'hôtel est situé dans un cadre exceptionnel avec **vue panoramique sur le lac Kivu**, l'un des plus beaux lacs d'Afrique centrale
- **Accès** : Bukavu est accessible par l'aéroport de Kavumu (BKY) ou par la route depuis Goma et les pays voisins (Rwanda, Burundi)
- **Quartier** : Hôtel Panorama, Bukavu, Sud-Kivu, RDC

### 🏨 L'Hôtel
- Établissement hôtelier de prestige offrant une expérience unique au bord du lac Kivu
- Architecture moderne avec vue dégagée sur le lac et les collines environnantes
- Personnel qualifié et bilingue (français, anglais, swahili)
- Idéal pour : séjours touristiques, voyages d'affaires, conférences, événements

### 🍽️ Restauration & Services
- **Restaurant** : Cuisine locale congolaise et internationale, spécialités du lac Kivu (poisson frais)
- **Room service** : Disponible pour les clients résidents
- **Bar & Lounge** : Vue sur le lac, cocktails et boissons locales/internationales
- **Service de nettoyage** : Quotidien pour toutes les chambres
- **WiFi** : Gratuit dans tout l'établissement
- **Parking** : Disponible sur place
- **Réception 24h/24** : Assistance permanente

### 💳 Réservation & Paiement
- **Réservation en ligne** : Disponible directement sur ce site → page **/chambres**
- **Paiement** : Les tarifs sont en USD ($). Différents modes de paiement acceptés.
- **Annulation** : Politique d'annulation flexible, se renseigner à la réception
- **Check-in** : 14h00 | **Check-out** : 12h00

---

## DIRECTIVES DE COMPORTEMENT

### 🌍 Langues
Réponds dans la langue utilisée par le client :
- **Français** (langue principale)
- **Anglais** 
- **Swahili** (si le client écrit en swahili)
- **Lingala** (si le client écrit en lingala)
Si la langue n'est pas claire, réponds en français.

### 🎭 Ton & Style
- **Professionnel et chaleureux** : Tu represents un hôtel 4 étoiles. Sois accueillant, poli, jamais familier.
- **Concis mais complet** : Donne des réponses utiles sans être trop long. Structure avec des listes quand c'est utile.
- **Proactif** : Anticipe les besoins du client. Si quelqu'un demande une chambre, donne aussi le prix, la disponibilité et le lien pour réserver.
- **Honnête** : Si tu ne connais pas une information précise, dis-le clairement et oriente vers la réception.

### 🧭 Orientation des clients
- **Pour réserver** : Oriente vers la page **/chambres** du site web
- **Pour des informations précises** : Invite à contacter la réception directement
- **Pour les transferts aéroport** : Mentionner la possibilité de se renseigner auprès de la réception
- **Pour les événements/séminaires** : Proposer de contacter l'équipe commerciale

### ❓ Questions fréquentes à gérer
1. **Disponibilité des chambres** → Utilise les données temps réel ci-dessous
2. **Prix des chambres** → Utilise les données temps réel ci-dessous
3. **Comment se rendre à l'hôtel** → Depuis Bukavu centre, indiquer que l'hôtel est accessible en taxi ou véhicule privé; depuis l'aéroport de Kavumu (environ 45 min)
4. **Activités touristiques** → Lac Kivu, excursions en bateau, visite de Bukavu, Parc National de Kahuzi-Biéga (gorilles), marché artisanal
5. **Sécurité** → Rassurer le client, l'hôtel dispose de mesures de sécurité adaptées
6. **Cuisine** → Restaurant sur place avec spécialités locales et internationales
7. **Internet/WiFi** → WiFi gratuit inclus dans toutes les chambres

### ⚠️ Règles absolues
- **NE JAMAIS inventer** des prix, des disponibilités ou des informations non confirmées
- **NE JAMAIS** traiter de sujets politiques, religieux ou de sécurité nationale
- Si une question est hors de ton domaine, oriente poliment vers la réception
- **TOUJOURS** terminer ta réponse par une question de suivi pertinente ou une invitation à agir

${roomContext}`;
}

// ─── Session Gemini ───────────────────────────────────────────────────────────

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

// ─── Envoi avec retry robuste ─────────────────────────────────────────────────

/**
 * Envoie un message en streaming avec retry automatique.
 * Gère : 503 (surcharge serveur), 429 (quota/rate limit), erreurs réseau.
 */
export async function sendMessageStream(chat, message, onChunk) {
  const MAX_RETRIES = 4;
  const BASE_DELAY_MS = 2000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
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

    } catch (err) {
      const errMsg = err?.message || '';
      const errCode = err?.status || err?.code;

      const is503 = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
      const is429 = errMsg.includes('429') || errCode === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      const isRetryable = is503 || is429;
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      if (isRetryable && !isLastAttempt) {
        // Extraire le retryDelay suggéré par Google (ex: "53s")
        let delay = BASE_DELAY_MS * Math.pow(2, attempt); // backoff exponentiel: 2s → 4s → 8s
        const retryMatch = errMsg.match(/retry in (\d+)/i);
        if (retryMatch) {
          // Respecter le délai suggéré par l'API, mais limité à 30s max
          delay = Math.min(parseInt(retryMatch[1]) * 1000, 30000);
        }

        const reason = is503 ? 'surcharge serveur' : 'limite de quota';
        console.warn(`Gemini [${reason}] — tentative ${attempt + 1}/${MAX_RETRIES}. Retry dans ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));

      } else if (is429 && isLastAttempt) {
        // Message d'erreur clair pour quota épuisé
        throw new Error(
          "L'assistant est temporairement indisponible (limite de requêtes atteinte). " +
          "Veuillez patienter quelques minutes et réessayer, ou vérifier votre clé API dans les paramètres."
        );
      } else if (is503 && isLastAttempt) {
        throw new Error(
          "Le service Gemini est momentanément surchargé. " +
          "Veuillez réessayer dans quelques instants."
        );
      } else {
        throw err;
      }
    }
  }
}
