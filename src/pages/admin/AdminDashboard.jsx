import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bed, ClipboardList, Utensils, DollarSign, LayoutDashboard, Users, User, UserCog, RefreshCw, Bell, LogOut, Menu, X, Camera, ExternalLink, Globe, Loader2, Pencil, FileText } from 'lucide-react';
import { statsApi, chambresApi, reservationsApi, commandesApi, notificationsApi, utilisateursApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/* =========================================================
   CONFIG & UTILS
   ========================================================= */
const STATUT_CONFIG = {
  en_attente:    { label: 'En attente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  confirmee:     { label: 'Confirmée',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  payee:         { label: 'Payée',          color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  en_sejour:     { label: 'En séjour',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  terminee:      { label: 'Terminée',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  annulee:       { label: 'Annulée',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  disponible:    { label: 'Disponible',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  occupee:       { label: 'Occupée',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  nettoyage:     { label: 'Nettoyage',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  maintenance:   { label: 'Maintenance',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  en_preparation:{ label: 'En préparation', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  prete:         { label: 'Prête',          color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  livree:        { label: 'Livrée',         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || { label: statut, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return <span className="statut-badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

const fmt = (n) => `$${Number(n || 0).toLocaleString('fr-FR')}`;

/* =========================================================
   COMPOSANTS PARTAGÉS
   ========================================================= */
function KpiCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-icon"><Icon size={24} strokeWidth={1.5} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{loading ? '…' : value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* =========================================================
   VUES (COMPONENTS)
   ========================================================= */

/* ── 1. Vue Tableau de Bord ── */
function VueDashboard() {
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const [s, r, c, ch] = await Promise.all([
        statsApi.dashboard(),
        reservationsApi.liste(null, 5),
        commandesApi.liste(),
        chambresApi.liste(),
      ]);
      setStats(s); setReservations(r); setCommandes(c.slice(0, 5)); setChambres(ch);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    charger();
    const intervalId = setInterval(charger, 10000); // Ajax Auto-sync 10s
    return () => clearInterval(intervalId);
  }, [charger]);

  return (
    <div className="admin-view">
      <div className="kpi-grid">
        <KpiCard icon={Bed} label="Chambres disponibles" color="#10b981" loading={loading}
          value={stats ? `${stats.chambres.disponibles}` : '—'}
          sub={stats ? `sur ${stats.chambres.total} au total` : ''} />
        <KpiCard icon={ClipboardList} label="Réservations actives" color="#3b82f6" loading={loading}
          value={stats ? stats.reservations.actives : '—'}
          sub={stats ? `${stats.reservations.arrivees_aujourd_hui} arrivée(s) aujourd'hui` : ''} />
        <KpiCard icon={Utensils} label="Commandes en cours" color="#f59e0b" loading={loading}
          value={stats ? stats.commandes.en_cours : '—'}
          sub={stats ? `${stats.commandes.en_preparation} en préparation` : ''} />
        <KpiCard icon={DollarSign} label="CA du mois" color="#9d8058" loading={loading}
          value={stats ? fmt(stats.ca.mois) : '—'}
          sub={stats ? `${stats.ca.evolution >= 0 ? '+' : ''}${stats.ca.evolution}% vs mois précédent` : ''} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Réservations Récentes</h2>
            <NavLink to="/admin/reservations" className="widget-link">Voir tout →</NavLink>
          </div>
          <div className="widget-table">
            {loading && reservations.length===0 ? <p style={{ padding: '16px', opacity: 0.5 }}>Chargement…</p> :
              reservations.length === 0 ? <p style={{ padding: '16px', opacity: 0.5 }}>Aucune réservation</p> :
              reservations.slice(0, 5).map(r => (
                <div key={r.id} className="widget-row">
                  <div>
                    <div className="wr-primary">{r.utilisateur?.nom_affiche}</div>
                    <div className="wr-secondary">
                      {r.lignes_reservation?.[0]?.chambre?.type_chambre?.nom || '—'} · {new Date(r.date_arrivee).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="wr-right">
                    <StatutBadge statut={r.statut} />
                    <div className="wr-amount">{fmt(r.montant_total)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Commandes en Cours</h2>
            <NavLink to="/admin/commandes" className="widget-link">Voir tout →</NavLink>
          </div>
          <div className="widget-table">
            {loading && commandes.length===0 ? <p style={{ padding: '16px', opacity: 0.5 }}>Chargement…</p> :
              commandes.length === 0 ? <p style={{ padding: '16px', opacity: 0.5 }}>Aucune commande active</p> :
              commandes.map(c => (
                <div key={c.id} className="widget-row">
                  <div>
                    <div className="wr-primary">Ch. {c.chambre?.numero_chambre || '?'} — {c.utilisateur?.nom_affiche}</div>
                    <div className="wr-secondary">{c.lignes_commande?.map(l => l.nom_article).join(', ')}</div>
                  </div>
                  <div className="wr-right">
                    <StatutBadge statut={c.statut} />
                    <div className="wr-time">{new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="dashboard-widget full" style={{ marginTop: '20px' }}>
        <div className="widget-header">
          <h2>État des Chambres (Temps Réel)</h2>
          <NavLink to="/admin/chambres" className="widget-link">Gérer →</NavLink>
        </div>
        <div className="rooms-status-grid">
          {loading && chambres.length===0 ? <p style={{ opacity: 0.5 }}>Chargement…</p> :
            chambres.map(ch => (
              <div key={ch.id} className={`room-status-card status-${ch.statut}`}>
                <div className="rsc-numero">{ch.numero_chambre}</div>
                <div className="rsc-type">{ch.type_chambre?.nom}</div>
                <StatutBadge statut={ch.statut} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ── 2. Vue Réservations ── */
function VueReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const charger = useCallback(async () => {
    try {
      const data = await reservationsApi.liste(null, 100);
      setReservations(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    charger();
    const intervalId = setInterval(charger, 15000); // 15s sync
    return () => clearInterval(intervalId);
  }, [charger]);

  const changerStatut = async (id, statut) => {
    setUpdating(id);
    try {
      await reservationsApi.changerStatut(id, statut);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, statut } : r));
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  return (
    <div className="admin-view">
      <div className="dashboard-widget full">
        <div className="widget-header">
          <h2>Gestion des Réservations</h2>
          <span className="admin-count">{reservations.length} réservations</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && reservations.length===0 ? <tr><td colSpan="7">Chargement...</td></tr> : 
                reservations.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', opacity: 0.5 }}>Aucune réservation trouvée</td></tr> :
                reservations.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.utilisateur?.nom_affiche || r.utilisateur?.email || 'Inconnu'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.lignes_reservation?.[0]?.chambre?.numero_chambre || '—'} ({r.lignes_reservation?.[0]?.chambre?.type_chambre?.nom || '—'})</td>
                    <td>{new Date(r.date_arrivee).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(r.date_depart).toLocaleDateString('fr-FR')}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{fmt(r.montant_total)}</td>
                    <td><StatutBadge statut={r.statut} /></td>
                    <td>
                      <select 
                        value={r.statut} 
                        onChange={(e) => changerStatut(r.id, e.target.value)}
                        disabled={updating === r.id}
                        className="admin-select-statut"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="payee">Payée</option>
                        <option value="en_sejour">En séjour</option>
                        <option value="terminee">Terminée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                      {updating === r.id && <span style={{ marginLeft: '8px', fontSize: '12px' }}>⏳</span>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Vue Chambres ── */
function VueChambres() {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [chambreModale, setChambreModale] = useState(null); // null = fermée, {} = nouvelle, ou objet chambre
  const [typesChambres, setTypesChambres] = useState([]);

  // Form states
  const [numChambre, setNumChambre] = useState('');
  const [etageChambre, setEtageChambre] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('disponible');
  const [notesChambre, setNotesChambre] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  const chargerTypes = useCallback(async () => {
    try { const t = await chambresApi.types(); setTypesChambres(t); } catch(e){}
  }, []);

  const charger = useCallback(async () => {
    try {
      const data = await chambresApi.liste();
      setChambres(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    charger();
    chargerTypes();
    const intervalId = setInterval(charger, 15000); // 15s sync
    return () => clearInterval(intervalId);
  }, [charger, chargerTypes]);

  useEffect(() => {
    if (chambreModale) {
      setNumChambre(chambreModale.numero_chambre || '');
      setEtageChambre(chambreModale.etage !== undefined && chambreModale.etage !== null ? String(chambreModale.etage) : '');
      setSelectedType(chambreModale.type_chambre_id || '');
      setSelectedStatut(chambreModale.statut || 'disponible');
      setNotesChambre(chambreModale.notes || '');
      setImgUrl(chambreModale.image_url || '');
    }
  }, [chambreModale]);

  const changerStatut = async (id, statut) => {
    setUpdating(id);
    try {
      await chambresApi.changerStatut(id, statut);
      setChambres(prev => prev.map(ch => ch.id === id ? { ...ch, statut } : ch));
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  const sauvegarderChambre = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      alert("Veuillez sélectionner un type de chambre.");
      return;
    }
    const data = {
      numero_chambre: numChambre,
      type_chambre_id: selectedType,
      etage: Number(etageChambre) || 1,
      statut: selectedStatut,
      notes: notesChambre,
      image_url: imgUrl
    };

    try {
      if (chambreModale.id) {
        await chambresApi.modifier(chambreModale.id, data);
      } else {
        await chambresApi.ajouter(data);
      }
      setChambreModale(null);
      charger(); // Recharger la liste complète
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + err.message);
    }
  };

  // Grouper par étage
  const etages = chambres.reduce((acc, ch) => {
    const etage = ch.etage || 1;
    if (!acc[etage]) acc[etage] = [];
    acc[etage].push(ch);
    return acc;
  }, {});
  
  // Trier les étages
  const etagesTries = Object.keys(etages).sort((a,b) => Number(a) - Number(b));

  return (
    <div className="admin-view">
      <div className="admin-view-header" style={{ marginBottom: '24px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Gestion des Chambres</h1>
          <span className="admin-count">{chambres.length} chambres au total</span>
        </div>
        <button className="rsb-btn" onClick={() => setChambreModale({})}>
          + Ajouter une Chambre
        </button>
      </div>

      {loading && chambres.length === 0 ? <p style={{ opacity: 0.5 }}>Chargement de la cartographie...</p> : 
        etagesTries.map(etage => (
          <div key={etage} className="dashboard-widget full" style={{ marginBottom: '24px' }}>
            <div className="widget-header">
              <h2>Étage {etage}</h2>
            </div>
            <div className="admin-rooms-grid">
              {etages[etage].map(ch => {
                const isOccupiedByReservation = ch.lignes_reservation?.length > 0;
                const occupant = isOccupiedByReservation ? ch.lignes_reservation[0].reservation.utilisateur : null;
                
                return (
                  <div key={ch.id} className={`admin-room-card status-${ch.statut}`}>
                    <div className="arc-header">
                      <span className="arc-numero">{ch.numero_chambre}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => setChambreModale(ch)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.6, padding: '4px', color: 'var(--text-main)' }}
                          title="Modifier la chambre"
                        >
                          <Pencil size={14} />
                        </button>
                        <StatutBadge statut={ch.statut} />
                      </div>
                    </div>
                    <div className="arc-body">
                      <div className="arc-type">{ch.type_chambre?.nom}</div>
                      {isOccupiedByReservation && occupant && (
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> Occupée par {occupant.nom_affiche || occupant.email}
                        </div>
                      )}
                      {ch.notes && <div className="arc-notes"><FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />{ch.notes}</div>}
                    </div>
                    <div className="arc-actions">
                      {isOccupiedByReservation ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px', textAlign: 'center' }}>
                          Statut géré par la réservation
                        </div>
                      ) : (
                        <select 
                          value={ch.statut} 
                          onChange={(e) => changerStatut(ch.id, e.target.value)}
                          disabled={updating === ch.id}
                          className="admin-select-statut"
                          style={{ width: '100%', marginTop: '8px' }}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="occupee">Occupée</option>
                          <option value="nettoyage">En nettoyage</option>
                          <option value="maintenance">En maintenance</option>
                        </select>
                      )}
                    </div>
                    {updating === ch.id && <div className="arc-loader">Mise à jour...</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      }

      {/* MODALE AJOUT/MODIFICATION CHAMBRE */}
      {chambreModale !== null && (
        <div className="admin-modal-overlay" onClick={() => setChambreModale(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h2>{chambreModale.id ? `Modifier Chambre ${chambreModale.numero_chambre}` : 'Nouvelle Chambre'}</h2>
              <button onClick={() => setChambreModale(null)}><X size={20} /></button>
            </div>
            <form onSubmit={sauvegarderChambre}>
              <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="rsb-field">
                    <label>Numéro de chambre</label>
                    <input type="text" value={numChambre} onChange={e => setNumChambre(e.target.value)} required />
                  </div>
                  <div className="rsb-field">
                    <label>Étage (numéro)</label>
                    <input type="number" value={etageChambre} onChange={e => setEtageChambre(e.target.value)} />
                  </div>
                </div>
                
                <div className="rsb-field">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Type de Chambre</label>
                  <div className="modern-selection-grid">
                    {typesChambres.map(t => {
                      const isSelected = selectedType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedType(t.id)}
                          className={`modern-type-chip ${isSelected ? 'active' : ''}`}
                        >
                          <span className="type-name">{t.nom}</span>
                          <span className="type-price">${t.prix_base_nuit}/nuit</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rsb-field">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Statut de la Chambre</label>
                  <div className="modern-status-grid">
                    {['disponible', 'occupee', 'nettoyage', 'maintenance'].map(st => {
                      const isSelected = selectedStatut === st;
                      const cfg = STATUT_CONFIG[st] || { label: st, color: '#666', bg: '#eee' };
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatut(st)}
                          className={`modern-status-chip status-${st} ${isSelected ? 'active' : ''}`}
                          style={{
                            '--status-color': cfg.color,
                            '--status-bg-alpha': cfg.bg,
                          }}
                        >
                          <span className="status-dot" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rsb-field">
                  <label>URL de l'image (optionnel, affichée publiquement)</label>
                  <input type="url" value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://..." />
                </div>

                <div className="rsb-field">
                  <label>Notes (privé, ex: Réparation Clim)</label>
                  <textarea value={notesChambre} onChange={e => setNotesChambre(e.target.value)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '10px', color: 'var(--text-main)', minHeight: '80px', outline: 'none' }}></textarea>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="room-book-btn" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => setChambreModale(null)}>Annuler</button>
                <button type="submit" className="room-book-btn" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 4. Vue Utilisateurs ── */
function VueUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const data = await utilisateursApi.liste();
      setUtilisateurs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    charger();
    const intervalId = setInterval(charger, 15000); // 15s sync
    return () => clearInterval(intervalId);
  }, [charger]);

  return (
    <div className="admin-view">
      <div className="dashboard-widget full">
        <div className="widget-header">
          <h2>Base de Données Utilisateurs</h2>
          <span className="admin-count">{utilisateurs.length} inscrits</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscription</th></tr>
            </thead>
            <tbody>
              {loading && utilisateurs.length===0 ? <tr><td colSpan="4">Chargement...</td></tr> : 
                utilisateurs.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.nom_affiche}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      {u.est_admin ? 
                        <span className="statut-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Administrateur</span> : 
                        <span className="statut-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Client</span>
                      }
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── 5. Vue Commandes ── */
function VueCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const charger = useCallback(async () => {
    try {
      const data = await commandesApi.liste();
      setCommandes(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    charger();
    const intervalId = setInterval(charger, 10000); // 10s sync pour les commandes, car c'est critique (restaurant/room service)
    return () => clearInterval(intervalId);
  }, [charger]);

  const changerStatut = async (id, statut) => {
    setUpdating(id);
    try {
      await commandesApi.changerStatut(id, statut);
      setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  return (
    <div className="admin-view">
      <div className="dashboard-widget full">
        <div className="widget-header">
          <h2>Room Service & Restaurant</h2>
          <span className="admin-count">{commandes.length} commandes en cours</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Chambre & Client</th>
                <th>Commande</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && commandes.length===0 ? <tr><td colSpan="6">Chargement...</td></tr> : 
                commandes.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', opacity: 0.5 }}>Aucune commande en cours</td></tr> :
                commandes.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <div style={{ fontWeight: 800 }}>Chambre {c.chambre?.numero_chambre || '?'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.utilisateur?.nom_affiche || 'Inconnu'}</div>
                    </td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {c.lignes_commande?.map((l, i) => (
                          <li key={i}>{l.quantite}x {l.nom_article}</li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{fmt(c.montant_total)}</td>
                    <td><StatutBadge statut={c.statut} /></td>
                    <td>
                      <select 
                        value={c.statut} 
                        onChange={(e) => changerStatut(c.id, e.target.value)}
                        disabled={updating === c.id}
                        className="admin-select-statut"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_preparation">En préparation</option>
                        <option value="prete">Prête</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                      {updating === c.id && <Loader2 size={14} className="animate-spin" style={{ marginLeft: '8px', display: 'inline-block' }} />}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── HEADER DYNAMIQUE ── */
function AdminHeader({ user, logout, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const pages = {
    '/admin': 'Tableau de Bord',
    '/admin/reservations': 'Réservations',
    '/admin/chambres': 'Chambres',
    '/admin/commandes': 'Commandes',
    '/admin/utilisateurs': 'Utilisateurs'
  };
  const title = pages[location.pathname] || 'Administration';

  useEffect(() => {
    notificationsApi.nonLues().then(n => setNotifications(n.length)).catch(() => {});
    const t = setInterval(() => notificationsApi.nonLues().then(n => setNotifications(n.length)).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="admin-header-nav">
      <div className="admin-header-left">
        <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1>{title}</h1>
      </div>

      <div className="admin-header-right">
        <div className="admin-notif-bell">
          <Bell size={20} strokeWidth={1.5} />
          {notifications > 0 && <span className="admin-notif-badge">{notifications}</span>}
        </div>

        <div className="admin-profile-dropdown-wrap">
          <div className="admin-profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="admin-profile-avatar">{user?.nom_affiche?.charAt(0) || 'A'}</div>
            <div className="admin-profile-info">
              <span className="admin-profile-name">{user?.nom_affiche || 'Admin'}</span>
              <span className="admin-profile-role">Super Admin</span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-header">
                <strong>{user?.email}</strong>
              </div>
              <div className="admin-dropdown-links">
                <button onClick={() => { setShowProfileMenu(false); document.getElementById('profile-modal').style.display='flex'; }}><UserCog size={16}/> Modifier mon profil</button>
                <button onClick={logout} className="text-danger"><LogOut size={16}/> Déconnexion</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── SIDEBAR PROFESSIONNEL ── */
const SIDEBAR_ITEMS = [
  { to: '/admin', label: 'Tableau de Bord', icon: LayoutDashboard, end: true },
  { to: '/admin/reservations', label: 'Réservations', icon: ClipboardList },
  { to: '/admin/chambres', label: 'Chambres', icon: Bed },
  { to: '/admin/commandes', label: 'Commandes', icon: Utensils },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modale de profil (très simplifiée pour l'UI, le state n'est pas envoyé au backend dans cette démo rapide)
  const [editNom, setEditNom] = useState(user?.nom_affiche || '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = () => {
    // Dans un cas réel, appeler API pour update user
    alert("Profil mis à jour (Simulé).");
    document.getElementById('profile-modal').style.display='none';
  };

  return (
    <div className="admin-layout">
      {/* ── MODALE PROFIL ── */}
      <div id="profile-modal" className="admin-modal-overlay" style={{ display: 'none' }}>
        <div className="admin-modal-content">
          <div className="admin-modal-header">
            <h2>Modifier mon Profil</h2>
            <button onClick={() => document.getElementById('profile-modal').style.display='none'}><X size={20}/></button>
          </div>
          <div className="admin-modal-body">
            <div className="admin-profile-pic-edit">
              <div className="admin-avatar-lg">{editNom.charAt(0)}</div>
              <button className="admin-pic-btn"><Camera size={14}/> Changer la photo</button>
            </div>
            <div className="form-field full" style={{ marginTop: '20px' }}>
              <label>Nom affiché</label>
              <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} />
            </div>
            <div className="form-field full">
              <label>Email (Lecture seule)</label>
              <input type="email" value={user?.email || ''} readOnly style={{ opacity: 0.7 }} />
            </div>
          </div>
          <div className="admin-modal-footer">
            <button className="btn-ghost" onClick={() => document.getElementById('profile-modal').style.display='none'}>Annuler</button>
            <button className="btn-primary" onClick={handleSaveProfile}>Enregistrer</button>
          </div>
        </div>
      </div>

      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="admin-sidebar-brand">
          <img src="/panorama.png" alt="Panorama" className="admin-brand-img" />
          {sidebarOpen && (
            <div>
              <div className="admin-brand-name">Panorama</div>
              <div className="admin-brand-role">Administration</div>
            </div>
          )}
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">{sidebarOpen ? 'GESTION HOTEL' : '•••'}</div>
          {SIDEBAR_ITEMS.slice(0,4).map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} title={!sidebarOpen ? item.label : ''}>
                <span className="admin-nav-icon"><Icon size={18} strokeWidth={1.5} /></span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}

          <div className="admin-nav-label" style={{ marginTop: '20px' }}>{sidebarOpen ? 'SYSTÈME' : '•••'}</div>
          {SIDEBAR_ITEMS.slice(4).map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} title={!sidebarOpen ? item.label : ''}>
                <span className="admin-nav-icon"><Icon size={18} strokeWidth={1.5} /></span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item" title={!sidebarOpen ? "Voir le site" : ""} style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>
            <span className="admin-nav-icon"><Globe size={18} strokeWidth={1.5} /></span>
            {sidebarOpen && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Voir le site <ExternalLink size={12} /></span>}
          </a>
          <button className="admin-nav-item text-danger" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }} title={!sidebarOpen ? "Déconnexion" : ""}>
            <span className="admin-nav-icon"><LogOut size={18} strokeWidth={1.5} /></span>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <AdminHeader user={user} logout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="admin-content">
          <Routes>
            <Route index element={<VueDashboard />} />
            <Route path="utilisateurs" element={<VueUtilisateurs />} />
            <Route path="reservations" element={<VueReservations />} />
            {/* Vues existantes reconstruites très rapidement : */}
            <Route path="chambres" element={<VueChambres />} />
            <Route path="commandes" element={<VueCommandes />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
