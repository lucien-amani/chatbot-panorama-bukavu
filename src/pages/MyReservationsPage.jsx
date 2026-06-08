import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationsApi } from '../lib/api';
import { Bed, FileText, AlertTriangle } from 'lucide-react';

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
  return <span className="statut-badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    reservationsApi.mesReservations()
      .then(setReservations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
        {loading && <p style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Chargement de vos réservations…</p>}
        {error && <p style={{ textAlign: 'center', color: '#ef4444', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><AlertTriangle size={16} /> {error}</p>}
        {!loading && !error && reservations.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Bed size={48} strokeWidth={1} style={{ opacity: 0.3 }} /></div>
            <h2>Aucune réservation</h2>
            <p>Vous n'avez pas encore effectué de réservation.</p>
            <button className="btn-primary" onClick={() => navigate('/chambres')}>Découvrir nos chambres</button>
          </div>
        )}
        {!loading && reservations.length > 0 && (
          <div className="reservations-list">
            {reservations.map(res => {
              const chambre = res.lignes_reservation?.[0]?.chambre;
              const nuits = Math.ceil((new Date(res.date_depart) - new Date(res.date_arrivee)) / 86400000);
              return (
                <div key={res.id} className="reservation-card">
                  <div className="res-card-header">
                    <div>
                      <div className="res-id">#{res.id.slice(0, 8).toUpperCase()}</div>
                      <h3 className="res-chambre">{chambre?.type_chambre?.nom || 'Chambre'} — N° {chambre?.numero_chambre || '?'}</h3>
                    </div>
                    <StatutBadge statut={res.statut} />
                  </div>
                  <div className="res-card-details">
                    <div className="res-detail">
                      <span className="rd-label">Arrivée</span>
                      <span className="rd-value">{new Date(res.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="res-detail-arrow">→</div>
                    <div className="res-detail">
                      <span className="rd-label">Départ</span>
                      <span className="rd-value">{new Date(res.date_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="res-detail-sep" />
                    <div className="res-detail">
                      <span className="rd-label">Durée</span>
                      <span className="rd-value">{nuits} nuit{nuits > 1 ? 's' : ''}</span>
                    </div>
                    <div className="res-detail">
                      <span className="rd-label">Total</span>
                      <span className="rd-value rd-total">${res.montant_total || 0}</span>
                    </div>
                  </div>
                  {res.demandes_speciales && (
                    <div style={{ fontSize: '13px', opacity: 0.65, padding: '8px 0 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <FileText size={13} style={{ marginTop: '2px', flexShrink: 0 }} /> {res.demandes_speciales}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
