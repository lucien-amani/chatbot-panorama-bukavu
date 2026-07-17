import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationsApi, platsApi, commandesApi } from '../lib/api';
import { Bed, FileText, AlertTriangle, Utensils, Plus, Minus, ShoppingBag } from 'lucide-react';

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

function ServiceRepas({ reservation }) {
  const [plats, setPlats] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [panier, setPanier] = useState({}); // { platId: quantite }
  const [ouvert, setOuvert] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (ouvert) {
      platsApi.menu()
        .then(data => {
          const flatPlats = Object.values(data).flat();
          setPlats(flatPlats);
        })
        .catch(console.error);
    }
  }, [ouvert]);

  const chargerCommandes = useCallback(() => {
    commandesApi.mesCommandes(reservation.id)
      .then(setCommandes)
      .catch(console.error);
  }, [reservation.id]);

  useEffect(() => {
    chargerCommandes();
    const interval = setInterval(chargerCommandes, 8000); // 8s refresh
    return () => clearInterval(interval);
  }, [chargerCommandes]);

  const modifierPanier = (platId, delta) => {
    setPanier(prev => {
      const q = (prev[platId] || 0) + delta;
      if (q <= 0) {
        const { [platId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [platId]: q };
    });
  };

  const validerCommande = async () => {
    const articles = Object.entries(panier).map(([id, q]) => {
      const p = plats.find(item => item.id === id);
      return {
        type_article: 'plat',
        plat_id: id,
        nom_article: p?.nom || 'Plat',
        quantite: q,
        prix_unitaire: p?.prix || 0,
      };
    });

    if (articles.length === 0) return;

    try {
      await commandesApi.creer({
        reservation_id: reservation.id,
        chambre_id: reservation.lignes_reservation?.[0]?.chambre_id,
        type_commande: 'chambre',
        articles,
        notes,
      });
      setMessage({ type: 'success', text: 'Commande envoyée avec succès !' });
      setPanier({});
      setNotes('');
      chargerCommandes();
      setTimeout(() => setMessage(null), 4000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const totalPanier = Object.entries(panier).reduce((sum, [id, q]) => {
    const p = plats.find(item => item.id === id);
    return sum + (p ? p.prix * q : 0);
  }, 0);

  const getStatutLabel = (st) => {
    switch (st) {
      case 'en_attente': return 'En attente';
      case 'en_preparation': return 'En préparation';
      case 'prete': return '🍽️ Prêt / Disponible !';
      case 'terminee': return 'Livré';
      case 'annulee': return 'Annulé';
      default: return st;
    }
  };

  return (
    <div className="room-service-box">
      <button 
        type="button" 
        className="room-service-toggle-btn"
        onClick={() => setOuvert(!ouvert)}
      >
        <Utensils size={16} />
        <span>{ouvert ? 'Fermer le Room Service' : 'Commander un Repas (Room Service)'}</span>
      </button>

      {ouvert && (
        <div className="room-service-panel">
          <h4 className="rs-section-title"><ShoppingBag size={15} /> Notre Menu Restaurant</h4>
          {plats.length === 0 ? (
            <p style={{ fontSize: '13px', opacity: 0.6 }}>Chargement du menu...</p>
          ) : (
            <div className="rs-menu-grid">
              {plats.map(p => {
                const qty = panier[p.id] || 0;
                return (
                  <div key={p.id} className="rs-menu-card">
                    <div>
                      <div className="rs-menu-card-title">{p.nom}</div>
                      {p.description && <div className="rs-menu-card-desc">{p.description}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span className="rs-menu-card-price">${p.prix}</span>
                      <div className="rs-qty-ctrl">
                        {qty > 0 && (
                          <button type="button" className="rs-qty-btn" onClick={() => modifierPanier(p.id, -1)}><Minus size={12} /></button>
                        )}
                        {qty > 0 && <span className="rs-qty-val">{qty}</span>}
                        <button type="button" className="rs-qty-btn" onClick={() => modifierPanier(p.id, 1)}><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPanier > 0 && (
            <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '10px', marginTop: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                <span>Total Panier :</span>
                <span style={{ color: 'var(--accent-color)' }}>${totalPanier}</span>
              </div>
              <input 
                type="text" 
                placeholder="Instructions spéciales (ex: sans sel, livré à 20h...)" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '12px', outline: 'none', marginBottom: '8px' }}
              />
              <button 
                type="button" 
                className="cw-btn cw-btn-primary" 
                style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                onClick={validerCommande}
              >
                Confirmer la Commande
              </button>
            </div>
          )}

          {message && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              textAlign: 'center',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
            }}>
              {message.text}
            </div>
          )}

          {commandes.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Suivi de mes Commandes Repas</h5>
              <div className="rs-orders-list">
                {commandes.map(cmd => (
                  <div key={cmd.id} className="rs-order-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>Commande #{cmd.id.slice(0, 6).toUpperCase()}</div>
                      <div style={{ fontSize: '11px', opacity: 0.65 }}>
                        {cmd.lignes_commande?.map(l => `${l.quantite}x ${l.nom_article}`).join(', ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>${cmd.montant_total}</span>
                      <span className={`rs-order-badge rs-badge-${cmd.statut}`}>
                        {getStatutLabel(cmd.statut)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
                    <div style={{ fontSize: '13px', opacity: 0.65, padding: '8px 0 0', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                      <FileText size={13} style={{ marginTop: '2px', flexShrink: 0 }} /> {res.demandes_speciales}
                    </div>
                  )}
                  {res.statut === 'en_sejour' && (
                    <ServiceRepas reservation={res} />
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
