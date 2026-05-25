import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, 
  Van, 
  Shirt, 
  Waves, 
  Wifi, 
  Lock, 
  Users, 
  Sunrise, 
  Ship, 
  Fish, 
  Leaf, 
  Mountain, 
  Sun, 
  MessageSquare, 
  Star 
} from 'lucide-react';

const ROOMS = [
  {
    id: 1,
    nom: 'Chambre Standard',
    description: 'Confort moderne avec vue sur les jardins de l\'hôtel et accès à toutes les commodités de base.',
    prix: 85,
    capacite: '2 adultes',
    equipements: ['Wi-Fi', 'Climatisation', 'TV Satellite', 'Mini-bar'],
    badge: null,
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
  },
  {
    id: 2,
    nom: 'VIP Vue Lac Kivu',
    description: 'Vue panoramique imprenable sur le lac Kivu. Décoration raffinée, balcon privatif et service personnalisé.',
    prix: 150,
    capacite: '2 adultes · 1 enfant',
    equipements: ['Wi-Fi Fibre', 'Balcon Lac', 'Jacuzzi', 'Room Service 24h'],
    badge: 'Populaire',
    gradient: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
  },
  {
    id: 3,
    nom: 'Suite Présidentielle',
    description: 'Le summum du luxe à Bukavu. Salon séparé, cuisine équipée, terrasse panoramique et service de majordome.',
    prix: 350,
    capacite: '4 adultes · 2 enfants',
    equipements: ['Wi-Fi Dédié', 'Terrasse 360°', 'Butler Service', 'Spa Privé'],
    badge: 'Premium',
    gradient: 'linear-gradient(135deg, #7c4c0a 0%, #9d6318 100%)',
  },
];

const SERVICES = [
  { icon: Utensils, titre: 'Restaurant Gastronomique', desc: 'Cuisine congolaise et internationale préparée par nos chefs.' },
  { icon: Van, titre: 'Navette Aéroport', desc: 'Transferts confortables vers et depuis l\'aéroport de Kavumu.' },
  { icon: Shirt, titre: 'Blanchisserie', desc: 'Service de lavage et repassage en 24h avec collecte en chambre.' },
  { icon: Waves, titre: 'Piscine & Spa', desc: 'Piscine à débordement avec vue sur le Lac Kivu, massages et soins.' },
  { icon: Wifi, titre: 'Wi-Fi Haut Débit', desc: 'Connexion fibre optique dans toutes les chambres et espaces communs.' },
  { icon: Lock, titre: 'Sécurité 24h/24', desc: 'Personnel de sécurité et surveillance continue pour votre tranquillité.' },
];

const TESTIMONIALS = [
  { nom: 'Marie-Claire K.', pays: 'Belgique', note: 5, texte: 'Une expérience inoubliable. La vue sur le lac Kivu depuis notre suite était absolument magique.' },
  { nom: 'Ahmed B.', pays: 'Maroc', note: 5, texte: 'Accueil chaleureux, personnel professionnel. Le restaurant est exceptionnel. Je recommande vivement.' },
  { nom: 'Sarah M.', pays: 'RDC', note: 5, texte: 'Le meilleur hôtel de Bukavu sans hésitation. Panorama Assist m\'a aidée à tout organiser avant même mon arrivée.' },
];

export default function LandingPage() {
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [voyageurs, setVoyageurs] = useState(2);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ checkin, checkout, voyageurs });
    navigate(`/chambres?${params}`);
  };

  const handleReserver = (room) => {
    if (!user) { loginAsGuest(); return; }
    navigate(`/reservation?type=${room.id}&nom=${encodeURIComponent(room.nom)}`);
  };

  return (
    <div className="landing">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-overlay" />
          <div className="hero-bg-pattern" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">✦ Hôtel 5 Étoiles · Bukavu, RDC</div>
          <h1 className="hero-title">
            L'Excellence au Bord<br />
            <span className="hero-title-accent">du Lac Kivu</span>
          </h1>
          <p className="hero-subtitle">
            Découvrez un séjour d'exception où le raffinement africain rencontre<br />
            le confort international, face aux eaux cristallines du Lac Kivu.
          </p>
          <div className="hero-actions">
            <Link to="/chambres" className="btn-primary hero-btn">Découvrir nos chambres</Link>
            <a href="#services" className="btn-ghost">Nos services</a>
          </div>
        </div>

        {/* Search Form */}
        <div className="hero-search-card">
          <div className="search-card-title">Vérifier les disponibilités</div>
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-field">
              <label>Arrivée</label>
              <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
                min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <label>Départ</label>
              <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
                min={checkin || new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <label>Voyageurs</label>
              <select value={voyageurs} onChange={e => setVoyageurs(e.target.value)}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <button type="submit" className="search-btn">Rechercher</button>
          </form>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="hero-stat"><strong>15+</strong><span>Années d'excellence</span></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><strong>48</strong><span>Chambres & Suites</span></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><strong>4.9★</strong><span>Note moyenne</span></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><strong>5000+</strong><span>Clients satisfaits</span></div>
        </div>
      </section>

      {/* ── FEATURED ROOMS ── */}
      <section className="section rooms-section" id="chambres">
        <div className="section-header">
          <div className="section-label">Nos Hébergements</div>
          <h2 className="section-title">Chambres & Suites d'Exception</h2>
          <p className="section-desc">Chaque espace est pensé pour vous offrir confort, élégance et une vue imprenable sur le joyau de l'Afrique centrale.</p>
        </div>
        <div className="rooms-grid">
          {ROOMS.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-img" style={{ background: room.gradient }}>
                <div className="room-card-overlay" />
                {room.badge && <div className="room-badge">{room.badge}</div>}
                <div className="room-card-price">
                  <span className="price-from">À partir de</span>
                  <span className="price-amount">${room.prix}</span>
                  <span className="price-night">/nuit</span>
                </div>
              </div>
              <div className="room-card-body">
                <h3 className="room-card-name">{room.nom}</h3>
                <p className="room-card-desc">{room.description}</p>
                <div className="room-card-capacity" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} />
                  <span>{room.capacite}</span>
                </div>
                <div className="room-amenities">
                  {room.equipements.map(e => (
                    <span key={e} className="amenity-tag">{e}</span>
                  ))}
                </div>
                <button className="room-cta" onClick={() => handleReserver(room)}>
                  Réserver cette chambre
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/chambres" className="btn-outline">Voir toutes les chambres →</Link>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section services-section" id="services">
        <div className="services-bg" />
        <div className="section-header light">
          <div className="section-label light">Ce Que Nous Offrons</div>
          <h2 className="section-title light">Services de Prestige</h2>
        </div>
        <div className="services-grid">
          {SERVICES.map(s => {
            const IconComp = s.icon;
            return (
              <div key={s.titre} className="service-card">
                <div className="service-icon"><IconComp size={28} strokeWidth={1.5} /></div>
                <h3>{s.titre}</h3>
                <p>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LAC KIVU FEATURE ── */}
      <section className="section lake-section">
        <div className="lake-content">
          <div className="section-label">Cadre Unique</div>
          <h2 className="section-title">Au Cœur du Lac Kivu</h2>
          <p className="lake-text">
            Niché sur les rives du Lac Kivu, l'Hôtel Panorama vous offre un spectacle naturel sans pareil. 
            Ce lac d'altitude, partagé entre la RDC et le Rwanda, est l'un des plus beaux d'Afrique. 
            Chaque matin, réveillez-vous au son des vagues et admirez le lever du soleil sur ses eaux bleues.
          </p>
          <div className="lake-features">
            <div className="lake-feat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sunrise size={16} style={{ color: 'var(--accent-color)' }} />
              <span>Lever de soleil panoramique</span>
            </div>
            <div className="lake-feat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ship size={16} style={{ color: 'var(--accent-color)' }} />
              <span>Excursions en bateau disponibles</span>
            </div>
            <div className="lake-feat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fish size={16} style={{ color: 'var(--accent-color)' }} />
              <span>Poissons du lac au restaurant</span>
            </div>
            <div className="lake-feat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={16} style={{ color: 'var(--accent-color)' }} />
              <span>Jardins tropicaux en bord de lac</span>
            </div>
          </div>
          <Link to="/chambres" className="btn-primary">Réserver avec vue lac</Link>
        </div>
        <div className="lake-visual">
          <div className="lake-card">
            <div className="lake-card-inner">
              <div className="lake-stat-grid">
                <div className="lake-stat"><div className="ls-num">1460m</div><div className="ls-label">Altitude</div></div>
                <div className="lake-stat"><div className="ls-num">2700km²</div><div className="ls-label">Surface</div></div>
                <div className="lake-stat"><div className="ls-num">480m</div><div className="ls-label">Profondeur max</div></div>
                <div className="lake-stat"><div className="ls-num">Top 3</div><div className="ls-label">Grands lacs africains</div></div>
              </div>
              <div className="lake-emoji-scene" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', color: 'var(--accent-color)', padding: '10px 0' }}>
                <Waves size={20} />
                <Mountain size={20} />
                <Leaf size={20} />
                <Sun size={20} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section testimonials-section">
        <div className="section-header">
          <div className="section-label">Avis Clients</div>
          <h2 className="section-title">Ce Que Disent Nos Hôtes</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.nom} className="testimonial-card">
              <div className="testimonial-stars" style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '0.8rem' }}>
                {Array.from({ length: t.note }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="testimonial-text">"{t.texte}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.nom.charAt(0)}</div>
                <div>
                  <div className="testimonial-name">{t.nom}</div>
                  <div className="testimonial-pays">{t.pays}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="section cta-section">
        <div className="cta-inner">
          <h2>Prêt pour une Expérience Inoubliable ?</h2>
          <p>Réservez votre séjour dès aujourd'hui et bénéficiez de nos meilleurs tarifs.</p>
          <div className="cta-actions">
            <Link to="/chambres" className="btn-primary">Réserver maintenant</Link>
            <span className="cta-or">ou</span>
            <span 
              className="cta-chat" 
              onClick={() => {}} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <span>Discuter avec Panorama Assist</span>
              <MessageSquare size={16} />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
