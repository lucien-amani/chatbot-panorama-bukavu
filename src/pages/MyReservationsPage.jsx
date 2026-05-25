import { useState } from 'react';

const MOCK_RESERVATIONS = [
  { id: 'RES-001', chambre: 'VIP Vue Lac Kivu', arrivee: '2026-06-10', depart: '2026-06-14', nuits: 4, total: 600, statut: 'confirmee' },
  { id: 'RES-002', chambre: 'Chambre Standard', arrivee: '2026-07-01', depart: '2026-07-03', nuits: 2, total: 170, statut: 'en_attente' },
  { id: 'RES-003', chambre: 'Suite Présidentielle', arrivee: '2026-01-15', depart: '2026-01-18', nuits: 3, total: 1050, statut: 'terminee' },
];

const STATUT_CONFIG = {
  en_attente:  { label: 'En attente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  confirmee:   { label: 'Confirmée',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  payee:       { label: 'Payée',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  en_sejour:   { label: 'En séjour',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  terminee:    { label: 'Terminée',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  annulee:     { label: 'Annulée',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente;
  return (
    <span className="statut-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

export default function MyReservationsPage() {
  const [reservations] = useState(MOCK_RESERVATIONS);

  return (
    <div className="page-content">
      <div className="page-hero-sm mini">
        <div className="page-hero-sm-overlay" />
        <div className="page-hero-sm-content">
          <h1>Mes Réservations</h1>
          <p>Historique et suivi de vos séjours</p>
        </div>
      </div>
      <div className="my-reservations-inner">
        {reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛏️</div>
            <h2>Aucune réservation</h2>
            <p>Vous n'avez pas encore effectué de réservation.</p>
            <a href="/chambres" className="btn-primary">Découvrir nos chambres</a>
          </div>
        ) : (
          <div className="reservations-list">
            {reservations.map(res => (
              <div key={res.id} className="reservation-card">
                <div className="res-card-header">
                  <div>
                    <div className="res-id">Réservation #{res.id}</div>
                    <h3 className="res-chambre">{res.chambre}</h3>
                  </div>
                  <StatutBadge statut={res.statut} />
                </div>
                <div className="res-card-details">
                  <div className="res-detail">
                    <span className="rd-label">Arrivée</span>
                    <span className="rd-value">{new Date(res.arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="res-detail-arrow">→</div>
                  <div className="res-detail">
                    <span className="rd-label">Départ</span>
                    <span className="rd-value">{new Date(res.depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="res-detail-sep" />
                  <div className="res-detail">
                    <span className="rd-label">Durée</span>
                    <span className="rd-value">{res.nuits} nuit{res.nuits > 1 ? 's' : ''}</span>
                  </div>
                  <div className="res-detail">
                    <span className="rd-label">Total</span>
                    <span className="rd-value rd-total">${res.total}</span>
                  </div>
                </div>
                {res.statut === 'en_attente' && (
                  <div className="res-card-actions">
                    <button className="btn-danger-sm">Annuler</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
