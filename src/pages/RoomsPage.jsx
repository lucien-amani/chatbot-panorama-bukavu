import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, Crown, Users } from 'lucide-react';

const ROOMS_DATA = [
  {
    id: 'standard',
    nom: 'Chambre Standard',
    description: 'Chambre confortable avec vue sur les jardins. Idéale pour séjours professionnels ou courts.',
    prix: 85,
    capaciteAdultes: 2,
    capaciteEnfants: 0,
    equipements: ['Wi-Fi', 'Climatisation', 'TV Satellite', 'Mini-bar', 'Salle de bain privée'],
    statut: 'disponible',
    nombre: 12,
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
  },
  {
    id: 'vip-lac',
    nom: 'VIP Vue Lac Kivu',
    description: 'Chambre VIP avec balcon privatif offrant une vue panoramique sur le lac Kivu. Service personnalisé inclus.',
    prix: 150,
    capaciteAdultes: 2,
    capaciteEnfants: 1,
    equipements: ['Wi-Fi Fibre', 'Balcon Vue Lac', 'Jacuzzi', 'Room Service 24h', 'Minibar Premium'],
    statut: 'disponible',
    nombre: 8,
    gradient: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
    badge: 'Populaire',
  },
  {
    id: 'suite-junior',
    nom: 'Suite Junior',
    description: 'Suite spacieuse avec salon séparé et terrasse. Parfaite pour les familles ou séjours prolongés.',
    prix: 220,
    capaciteAdultes: 3,
    capaciteEnfants: 2,
    equipements: ['Wi-Fi Dédié', 'Salon Séparé', 'Terrasse Privée', 'Baignoire Balnéo', 'Butler à la demande'],
    statut: 'disponible',
    nombre: 4,
    gradient: 'linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%)',
  },
  {
    id: 'suite-presidentielle',
    nom: 'Suite Présidentielle',
    description: 'L\'apogée du luxe à Bukavu. Salon de réception, cuisine privée, terrasse 360° et service de majordome.',
    prix: 350,
    capaciteAdultes: 4,
    capaciteEnfants: 2,
    equipements: ['Wi-Fi Ultra', 'Terrasse 360°', 'Butler 24h', 'Spa Privé', 'Cuisine Équipée'],
    statut: 'disponible',
    nombre: 2,
    gradient: 'linear-gradient(135deg, #7c4c0a 0%, #9d6318 100%)',
    badge: 'Premium',
  },
];

export default function RoomsPage() {
  const [searchParams] = useSearchParams();
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');
  const [voyageurs, setVoyageurs] = useState(Number(searchParams.get('voyageurs')) || 2);
  const [filtre, setFiltre] = useState('tous');

  const filteredRooms = ROOMS_DATA.filter(r => {
    if (filtre === 'budget') return r.prix <= 100;
    if (filtre === 'milieu') return r.prix > 100 && r.prix <= 200;
    if (filtre === 'premium') return r.prix > 200;
    return true;
  });

  const handleReserver = (room) => {
    if (!user) { loginAsGuest(); return; }
    const params = new URLSearchParams({
      typeId: room.id,
      nom: room.nom,
      prix: room.prix,
      ...(checkin && { checkin }),
      ...(checkout && { checkout }),
      voyageurs,
    });
    navigate(`/reservation?${params}`);
  };

  return (
    <div className="page-rooms">
      {/* Page Header */}
      <div className="page-hero-sm">
        <div className="page-hero-sm-overlay" />
        <div className="page-hero-sm-content">
          <div className="page-label">Nos Hébergements</div>
          <h1>Chambres & Suites</h1>
          <p>48 chambres d'exception face au Lac Kivu</p>
        </div>
      </div>

      <div className="rooms-page-inner">
        {/* Search Bar */}
        <div className="rooms-search-bar">
          <div className="rsb-field">
            <label>Arrivée</label>
            <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="rsb-sep" />
          <div className="rsb-field">
            <label>Départ</label>
            <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} min={checkin || new Date().toISOString().split('T')[0]} />
          </div>
          <div className="rsb-sep" />
          <div className="rsb-field">
            <label>Voyageurs</label>
            <select value={voyageurs} onChange={e => setVoyageurs(e.target.value)}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} personne{n>1?'s':''}</option>)}
            </select>
          </div>
          <button className="rsb-btn" onClick={() => {}}>Vérifier dispo</button>
        </div>

        {/* Filters */}
        <div className="rooms-filters">
          <span className="filters-label">Filtrer par budget :</span>
          {[
            { key: 'tous', label: 'Toutes' },
            { key: 'budget', label: '≤ $100/nuit' },
            { key: 'milieu', label: '$100–200/nuit' },
            { key: 'premium', label: '> $200/nuit' },
          ].map(f => (
            <button key={f.key} className={`filter-chip ${filtre === f.key ? 'active' : ''}`}
              onClick={() => setFiltre(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Room Cards */}
        <div className="rooms-list">
          {filteredRooms.map(room => (
            <div key={room.id} className="room-list-card">
              <div className="rlc-img" style={{ background: room.gradient }}>
                 {room.badge && (
                  <div className="rlc-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {room.id === 'vip-lac' && <Star size={12} />}
                    {room.id === 'suite-presidentielle' && <Crown size={12} />}
                    <span>{room.badge}</span>
                  </div>
                )}
                <div className="rlc-dispo">{room.nombre} chambre{room.nombre > 1 ? 's' : ''} disponible{room.nombre > 1 ? 's' : ''}</div>
              </div>
              <div className="rlc-body">
                <div className="rlc-header">
                  <div>
                    <h2 className="rlc-name">{room.nom}</h2>
                    <p className="rlc-desc">{room.description}</p>
                  </div>
                  <div className="rlc-pricing">
                    <div className="rlc-price">${room.prix}</div>
                    <div className="rlc-price-sub">par nuit</div>
                  </div>
                </div>
                <div className="rlc-capacite" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} />
                  <span>
                    {room.capaciteAdultes} adulte{room.capaciteAdultes > 1 ? 's' : ''}
                    {room.capaciteEnfants > 0 && ` · ${room.capaciteEnfants} enfant${room.capaciteEnfants > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="rlc-amenities">
                  {room.equipements.map(e => (
                    <span key={e} className="amenity-tag">{e}</span>
                  ))}
                </div>
                <button className="rlc-cta" onClick={() => handleReserver(room)}>
                  Réserver — ${room.prix}/nuit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
