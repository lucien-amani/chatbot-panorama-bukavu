/**
 * api.js — Service API centralisé pour Panorama Assist
 * Toutes les requêtes vers le backend Express/PostgreSQL passent ici.
 */

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
//  CHAMBRES
// ============================================================

export const chambresApi = {
  /** Toutes les chambres avec type (admin) */
  liste: (statut = null) =>
    apiFetch(`/api/chambres${statut ? `?statut=${statut}` : ''}`),

  /** Chambres disponibles — retour JSON structuré par type */
  disponibles: ({ date_arrivee, date_depart, type } = {}) => {
    const params = new URLSearchParams();
    if (date_arrivee) params.set('date_arrivee', date_arrivee);
    if (date_depart)  params.set('date_depart', date_depart);
    if (type)         params.set('type', type);
    return apiFetch(`/api/chambres/disponibles?${params.toString()}`);
  },

  /** Catalogue des types de chambres (page publique) */
  types: () => apiFetch('/api/types-chambres'),

  /** Changer statut d'une chambre (admin) */
  changerStatut: (id, statut) =>
    apiFetch(`/api/admin/chambres/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
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
