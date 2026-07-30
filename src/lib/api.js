/**
 * api.js — Service API centralisé pour Panorama Assist
 * Toutes les requêtes vers le backend Express/PostgreSQL passent ici.
 */

import hotelsData from '../../hotels.json';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Helper fetch avec token JWT automatique ────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('panorama_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.json();
}

// ============================================================
//  AUTH
// ============================================================

export const auth = {
  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email, password, nom_affiche) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, nom_affiche }) }),
};

// ============================================================
//  HOTELS
// ============================================================

export const hotelsApi = {
  /** Obtenir la liste de tous les hôtels (API backend avec fallback local) */
  liste: async () => {
    try {
      return await apiFetch('/api/hotels');
    } catch (err) {
      console.warn("Could not fetch hotels from API, falling back to localStorage/static:", err);
      try {
        const local = localStorage.getItem('bukavu_hotels_list');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return hotelsData.hotels || [];
    }
  },

  /** Ajouter ou modifier un hôtel (Super Admin) */
  enregistrer: async (data) => {
    try {
      return await apiFetch('/api/admin/hotels', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      console.warn("Could not save hotel to API, saving to localStorage only:", err);
      let localHotels = [];
      try {
        const local = localStorage.getItem('bukavu_hotels_list');
        localHotels = local ? JSON.parse(local) : [...hotelsData.hotels];
      } catch {
        localHotels = [...hotelsData.hotels];
      }
      const existingIndex = localHotels.findIndex(h => h.slug === data.slug);
      if (existingIndex > -1) {
        localHotels[existingIndex] = data;
      } else {
        localHotels.push(data);
      }
      localStorage.setItem('bukavu_hotels_list', JSON.stringify(localHotels));
      return { message: "Sauvegardé localement", hotel: data };
    }
  },

  /** Supprimer un hôtel (Super Admin) */
  supprimer: async (slug) => {
    try {
      return await apiFetch(`/api/admin/hotels/${slug}`, { method: 'DELETE' });
    } catch (err) {
      console.warn("Could not delete hotel from API, removing from localStorage only:", err);
      try {
        const local = localStorage.getItem('bukavu_hotels_list');
        if (local) {
          const parsed = JSON.parse(local);
          const filtered = parsed.filter(h => h.slug !== slug);
          localStorage.setItem('bukavu_hotels_list', JSON.stringify(filtered));
        }
      } catch {}
      return { message: "Supprimé localement" };
    }
  },

  /** Modifier un hôtel existant (Admin de l'hôtel ou Super Admin) */
  modifier: async (slug, data) => {
    try {
      return await apiFetch(`/api/admin/hotels/${slug}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (err) {
      console.warn("Could not update hotel via API, updating in localStorage only:", err);
      try {
        const local = localStorage.getItem('bukavu_hotels_list');
        if (local) {
          const parsed = JSON.parse(local);
          const index = parsed.findIndex(h => h.slug === slug);
          if (index > -1) {
            parsed[index] = data;
            localStorage.setItem('bukavu_hotels_list', JSON.stringify(parsed));
          }
        }
      } catch {}
      return { message: "Modifié localement", hotel: data };
    }
  }
};

// ============================================================

// ============================================================
//  CHAMBRES
// ============================================================

export const chambresApi = {
  /** Toutes les chambres avec type (admin) */
  liste: (statut = null) =>
    apiFetch(`/api/chambres${statut ? `?statut=${statut}` : ''}`),

  /** Chambres disponibles — retour JSON structuré par type */
  disponibles: ({ date_arrivee, date_depart, type, hotel_slug } = {}) => {
    const params = new URLSearchParams();
    if (date_arrivee) params.set('date_arrivee', date_arrivee);
    if (date_depart)  params.set('date_depart', date_depart);
    if (type)         params.set('type', type);
    if (hotel_slug)    params.set('hotel_slug', hotel_slug);
    return apiFetch(`/api/chambres/disponibles?${params.toString()}`);
  },

  /** Catalogue des types de chambres (page publique) */
  types: (hotel_slug = null) => apiFetch(`/api/types-chambres${hotel_slug ? `?hotel_slug=${hotel_slug}` : ''}`),

  /** Changer statut d'une chambre (admin) */
  changerStatut: (id, statut) =>
    apiFetch(`/api/admin/chambres/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),

  /** Ajouter une chambre (admin) */
  ajouter: (data) =>
    apiFetch('/api/admin/chambres', { method: 'POST', body: JSON.stringify(data) }),

  /** Modifier une chambre complète (admin) */
  modifier: (id, data) =>
    apiFetch(`/api/admin/chambres/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================================
//  RÉSERVATIONS
// ============================================================

export const reservationsApi = {
  /** Toutes les réservations (admin) */
  liste: (statut = null, limit = 50) =>
    apiFetch(`/api/reservations${statut ? `?statut=${statut}&limit=${limit}` : `?limit=${limit}`}`),

  /** Mes réservations (utilisateur connecté) */
  mesReservations: () => apiFetch('/api/mes-reservations'),

  /** Créer une réservation */
  creer: (data) =>
    apiFetch('/api/reservations', { method: 'POST', body: JSON.stringify(data) }),

  /** Changer statut d'une réservation (admin) */
  changerStatut: (id, statut) =>
    apiFetch(`/api/admin/reservations/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
};

// ============================================================
//  PLATS & MENU
// ============================================================

export const platsApi = {
  /** Liste des plats disponibles (optionnel: filtrer par catégorie) */
  liste: (categorie = null) =>
    apiFetch(`/api/plats${categorie ? `?categorie=${categorie}` : ''}`),

  /** Menu complet groupé par catégorie */
  menu: () => apiFetch('/api/plats/menu'),

  /** Modifier un plat (admin) */
  modifier: (id, data) =>
    apiFetch(`/api/admin/plats/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ============================================================
//  COMMANDES
// ============================================================

export const commandesApi = {
  /** Toutes les commandes actives (admin) */
  liste: (statut = null) =>
    apiFetch(`/api/admin/commandes${statut ? `?statut=${statut}` : ''}`),

  /** Mes commandes (utilisateur connecté) */
  mesCommandes: (reservationId = null) =>
    apiFetch(`/api/commandes${reservationId ? `?reservation_id=${reservationId}` : ''}`),

  /** Créer une commande */
  creer: (data) =>
    apiFetch('/api/commandes', { method: 'POST', body: JSON.stringify(data) }),

  /** Avancer le statut d'une commande (admin) */
  changerStatut: (id, statut) =>
    apiFetch(`/api/admin/commandes/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
};

// ============================================================
//  DASHBOARD STATS (Admin)
// ============================================================

export const statsApi = {
  dashboard: () => apiFetch('/api/admin/stats'),
};

// ============================================================
//  UTILISATEURS (Admin)
// ============================================================

export const utilisateursApi = {
  liste: () => apiFetch('/api/admin/utilisateurs'),
};

// ============================================================
//  PROFIL UTILISATEUR
// ============================================================

export const profilApi = {
  /** Récupérer le profil du client connecté */
  get: () => apiFetch('/api/profil'),
  /** Créer ou mettre à jour le profil */
  sauvegarder: (data) => apiFetch('/api/profil', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================
//  NOTIFICATIONS (Admin)
// ============================================================

export const notificationsApi = {
  nonLues: () => apiFetch('/api/admin/notifications'),
  marquerLue: (id) =>
    apiFetch(`/api/admin/notifications/${id}/lue`, { method: 'PATCH' }),
};

// ============================================================
//  CHAT LOG
// ============================================================

export const chatApi = {
  log: (data) =>
    apiFetch('/api/chat/log', { method: 'POST', body: JSON.stringify(data) }),
  session: (sessionId) =>
    apiFetch(`/api/chat/session/${sessionId}`),
};

// ============================================================
//  HEALTH CHECK
// ============================================================

export const healthApi = {
  check: () => apiFetch('/api/health'),
};
