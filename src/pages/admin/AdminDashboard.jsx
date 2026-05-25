import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Bed, ClipboardList, Utensils, DollarSign, LayoutDashboard, Check, Sparkles, Wrench } from 'lucide-react';

/* ── Mock Data ── */
const MOCK_RESERVATIONS = [
  { id: 'RES-001', client: 'Jean-Paul Muteba', email: 'jp@gmail.com', chambre: 'VIP Vue Lac', arrivee: '2026-06-10', depart: '2026-06-14', total: 600, statut: 'confirmee' },
  { id: 'RES-002', client: 'Marie-Claire Kabila', email: 'mc@gmail.com', chambre: 'Standard', arrivee: '2026-06-12', depart: '2026-06-13', total: 85, statut: 'en_attente' },
  { id: 'RES-003', client: 'Ahmed Benali', email: 'ahmed@gmail.com', chambre: 'Suite Présidentielle', arrivee: '2026-06-15', depart: '2026-06-18', total: 1050, statut: 'payee' },
  { id: 'RES-004', client: 'Sarah Mwamba', email: 'sarah@gmail.com', chambre: 'VIP Vue Lac', arrivee: '2026-05-20', depart: '2026-05-22', total: 300, statut: 'terminee' },
];

const MOCK_CHAMBRES = [
  { id: 'C101', numero: '101', type: 'Standard', etage: 1, statut: 'disponible' },
  { id: 'C201', numero: '201', type: 'VIP Vue Lac', etage: 2, statut: 'occupee' },
  { id: 'C202', numero: '202', type: 'VIP Vue Lac', etage: 2, statut: 'disponible' },
  { id: 'C301', numero: '301', type: 'Suite Junior', etage: 3, statut: 'nettoyage' },
  { id: 'C401', numero: '401', type: 'Suite Présidentielle', etage: 4, statut: 'maintenance' },
  { id: 'C102', numero: '102', type: 'Standard', etage: 1, statut: 'disponible' },
];

const MOCK_COMMANDES = [
  { id: 'CMD-001', client: 'Jean-Paul Muteba', chambre: '201', type: 'room_service', articles: 'Poulet Moambé, Vin rouge', total: 45, statut: 'en_preparation', heure: '19:32' },
  { id: 'CMD-002', client: 'Ahmed Benali', chambre: '301', type: 'restaurant', articles: 'Menu dégustation', total: 85, statut: 'en_attente', heure: '20:01' },
  { id: 'CMD-003', client: 'Marie-Claire', chambre: '102', type: 'blanchisserie', articles: 'Forfait Express', total: 25, statut: 'prete', heure: '14:15' },
];

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

/* ── KPI Cards ── */
function KpiCard({ icon: IconComponent, label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-icon">
        <IconComponent size={24} strokeWidth={1.5} />
      </div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Vue Tableau de Bord ── */
function VueDashboard() {
  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Tableau de Bord</h1>
        <div className="admin-date">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div className="kpi-grid">
        <KpiCard icon={Bed} label="Chambres disponibles" value="34" sub="sur 48 au total" color="#10b981" />
        <KpiCard icon={ClipboardList} label="Réservations actives" value="12" sub="dont 3 arrivées aujourd'hui" color="#3b82f6" />
        <KpiCard icon={Utensils} label="Commandes en cours" value="5" sub="2 en préparation" color="#f59e0b" />
        <KpiCard icon={DollarSign} label="CA du mois" value="$14,320" sub="+18% vs mois précédent" color="#9d8058" />
      </div>

      <div className="dashboard-grid">
        {/* Recent Reservations */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Réservations Récentes</h2>
            <NavLink to="/admin/reservations" className="widget-link">Voir tout →</NavLink>
          </div>
          <div className="widget-table">
            {MOCK_RESERVATIONS.slice(0, 3).map(res => (
              <div key={res.id} className="widget-row">
                <div>
                  <div className="wr-primary">{res.client}</div>
                  <div className="wr-secondary">{res.chambre} · {new Date(res.arrivee).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="wr-right">
                  <StatutBadge statut={res.statut} />
                  <div className="wr-amount">${res.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Orders */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Commandes en Cours</h2>
            <NavLink to="/admin/commandes" className="widget-link">Voir tout →</NavLink>
          </div>
          <div className="widget-table">
            {MOCK_COMMANDES.map(cmd => (
              <div key={cmd.id} className="widget-row">
                <div>
                  <div className="wr-primary">Ch. {cmd.chambre} — {cmd.client}</div>
                  <div className="wr-secondary">{cmd.articles}</div>
                </div>
                <div className="wr-right">
                  <StatutBadge statut={cmd.statut} />
                  <div className="wr-time">{cmd.heure}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Status Grid */}
      <div className="dashboard-widget full">
        <div className="widget-header">
          <h2>État des Chambres</h2>
          <NavLink to="/admin/chambres" className="widget-link">Gérer →</NavLink>
        </div>
        <div className="rooms-status-grid">
          {MOCK_CHAMBRES.map(ch => (
            <div key={ch.id} className={`room-status-card status-${ch.statut}`}>
              <div className="rsc-numero">{ch.numero}</div>
              <div className="rsc-type">{ch.type}</div>
              <StatutBadge statut={ch.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Vue Réservations ── */
function VueReservations() {
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);

  const changerStatut = (id, statut) => {
    setReservations(prev => prev.map(r => r.id === id ? {...r, statut} : r));
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Gestion des Réservations</h1>
        <div className="admin-count">{reservations.length} réservations</div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Client</th><th>Chambre</th><th>Arrivée</th><th>Départ</th><th>Total</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id}>
                <td><code>{res.id}</code></td>
                <td>
                  <div className="td-primary">{res.client}</div>
                  <div className="td-secondary">{res.email}</div>
                </td>
                <td>{res.chambre}</td>
                <td>{new Date(res.arrivee).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(res.depart).toLocaleDateString('fr-FR')}</td>
                <td><strong>${res.total}</strong></td>
                <td><StatutBadge statut={res.statut} /></td>
                <td>
                  <div className="action-btns">
                    {res.statut === 'en_attente' && <button className="action-btn confirm" onClick={() => changerStatut(res.id, 'confirmee')}>Confirmer</button>}
                    {res.statut === 'payee' && <button className="action-btn checkin" onClick={() => changerStatut(res.id, 'en_sejour')}>Check-in</button>}
                    {res.statut === 'en_sejour' && <button className="action-btn checkout" onClick={() => changerStatut(res.id, 'terminee')}>Check-out</button>}
                    {['en_attente','confirmee'].includes(res.statut) && <button className="action-btn cancel" onClick={() => changerStatut(res.id, 'annulee')}>Annuler</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Vue Chambres ── */
function VueChambres() {
  const [chambres, setChambres] = useState(MOCK_CHAMBRES);
  const changerStatut = (id, statut) => setChambres(prev => prev.map(c => c.id === id ? {...c, statut} : c));

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Gestion des Chambres</h1>
        <div className="rooms-status-summary">
          {['disponible','occupee','nettoyage','maintenance'].map(s => (
            <span key={s} className="rss-item" style={{ color: STATUT_CONFIG[s]?.color }}>
              {chambres.filter(c => c.statut === s).length} {STATUT_CONFIG[s]?.label}
            </span>
          ))}
        </div>
      </div>
      <div className="rooms-admin-grid">
        {chambres.map(ch => (
          <div key={ch.id} className={`room-admin-card status-${ch.statut}`}>
            <div className="rac-top">
              <div className="rac-numero">#{ch.numero}</div>
              <StatutBadge statut={ch.statut} />
            </div>
            <div className="rac-type">{ch.type}</div>
            <div className="rac-etage">Étage {ch.etage}</div>
            <div className="rac-actions">
              {ch.statut !== 'disponible' && (
                <button className="rac-btn" onClick={() => changerStatut(ch.id, 'disponible')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} />
                  <span>Disponible</span>
                </button>
              )}
              {ch.statut !== 'nettoyage' && (
                <button className="rac-btn" onClick={() => changerStatut(ch.id, 'nettoyage')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} />
                  <span>Nettoyage</span>
                </button>
              )}
              {ch.statut !== 'maintenance' && (
                <button className="rac-btn" onClick={() => changerStatut(ch.id, 'maintenance')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Wrench size={14} />
                  <span>Maintenance</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vue Commandes ── */
function VueCommandes() {
  const [commandes, setCommandes] = useState(MOCK_COMMANDES);
  const avancer = (id) => {
    const ordre = ['en_attente','en_preparation','prete','livree','terminee'];
    setCommandes(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = ordre.indexOf(c.statut);
      return idx < ordre.length - 1 ? {...c, statut: ordre[idx + 1]} : c;
    }));
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Commandes en Cours</h1>
        <div className="admin-date">Mise à jour automatique toutes les 30s</div>
      </div>
      <div className="commandes-grid">
        {commandes.map(cmd => (
          <div key={cmd.id} className={`commande-card statut-${cmd.statut}`}>
            <div className="cmd-header">
              <div>
                <div className="cmd-id">{cmd.id}</div>
                <div className="cmd-client">Ch. <strong>{cmd.chambre}</strong> · {cmd.client}</div>
              </div>
              <div className="cmd-right">
                <StatutBadge statut={cmd.statut} />
                <div className="cmd-time">{cmd.heure}</div>
              </div>
            </div>
            <div className="cmd-type-badge">{cmd.type.replace('_', ' ')}</div>
            <div className="cmd-articles">{cmd.articles}</div>
            <div className="cmd-footer">
              <strong className="cmd-total">${cmd.total}</strong>
              {!['terminee','annulee'].includes(cmd.statut) && (
                <button className="cmd-avancer-btn" onClick={() => avancer(cmd.id)}>
                  Passer à l'étape suivante →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar Items ── */
const SIDEBAR_ITEMS = [
  { to: '/admin', label: 'Tableau de Bord', icon: LayoutDashboard, end: true },
  { to: '/admin/reservations', label: 'Réservations', icon: ClipboardList },
  { to: '/admin/chambres', label: 'Chambres', icon: Bed },
  { to: '/admin/commandes', label: 'Commandes', icon: Utensils },
];

/* ── Main Admin Dashboard ── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
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
          {SIDEBAR_ITEMS.map(item => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="admin-nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <IconComponent size={18} strokeWidth={1.5} />
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? '◀ Réduire' : '▶'}
          </button>
          <button className="admin-logout-btn" onClick={() => navigate('/')}>
            {sidebarOpen ? '← Site public' : '←'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="admin-content">
        <Routes>
          <Route index element={<VueDashboard />} />
          <Route path="reservations" element={<VueReservations />} />
          <Route path="chambres" element={<VueChambres />} />
          <Route path="commandes" element={<VueCommandes />} />
        </Routes>
      </div>
    </div>
  );
}
