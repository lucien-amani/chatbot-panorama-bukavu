import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Users, Star, Wifi, Coffee, Wind,
  Tv, Dumbbell, Bath, Search, SlidersHorizontal, Calendar, CheckCircle2,
  XCircle, ArrowRight, ChevronDown, Check, Baby
} from 'lucide-react';
import { chambresApi } from '../lib/api';

// Map icon name -> composant Lucide
const AMENITY_ICONS = {
  'Wi-Fi': Wifi, 'WiFi': Wifi, 'Wifi gratuit': Wifi,
  'Climatisation': Wind, 'Clim': Wind,
  'Café': Coffee, 'Café/Thé': Coffee,
  'Télévision': Tv, 'TV': Tv, 'TV Satellite': Tv,
  'Salle de sport': Dumbbell, 'Gym': Dumbbell,
  'Baignoire': Bath, 'Jacuzzi': Bath, 'Baignoire balnéo': Bath,
};

function AmenityIcon({ name, size = 12 }) {
  const Icon = AMENITY_ICONS[name];
  if (Icon) return <Icon size={size} className="room-detail-icon" style={{ strokeWidth: 2 }} />;
  return null;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop',
];

/* ─── CARROUSEL PAR TYPE (AESTHETIC & SEMANTIC ROOM CARD) ─── */
function RoomTypeCarousel({ typeNom, chambres, disponibiliteIds, dateArrivee, dateDepart, onReserver }) {
  const [idx, setIdx] = useState(0);
  const ch = chambres[idx];
  const t = ch?.type_chambre;

  if (!ch || !t) return null;

  const equipements = Array.isArray(t.equipements)
    ? t.equipements
    : (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })();

  const imgSrc = ch.image_url || FALLBACK_IMAGES[chambres.indexOf(ch) % FALLBACK_IMAGES.length];
  const isAvailable = disponibiliteIds ? disponibiliteIds.includes(ch.id) : ch.statut === 'disponible';

  return (
    <div className="room-card group">
      {/* Image Wrap */}
      <div className="room-card-img-wrap">
        <img
          src={imgSrc}
          alt={`Chambre ${ch.numero_chambre} — ${t.nom}`}
          className="room-card-img"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-1" />

        {/* Badge disponibilité */}
        <div className={`room-avail-badge ${isAvailable ? 'avail-yes' : 'avail-no'}`}>
          {isAvailable ? 'Disponible' : 'Occupée'}
        </div>

        {/* Badge numéro chambre */}
        <div className="absolute top-4 right-4 bg-black/50 text-white backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold z-2">
          N° {ch.numero_chambre} {ch.etage ? `• Étage ${ch.etage}` : ''}
        </div>

        {/* Navigation carrousel (si plusieurs chambres du même type) */}
        {chambres.length > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + chambres.length) % chambres.length)}
              className="absolute left-3 bottom-4 p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all z-3"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-3">
              {chambres.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIdx((idx + 1) % chambres.length)}
              className="absolute right-3 bottom-4 p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all z-3"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="room-card-body">
        {/* Header : nom + prix */}
        <div className="room-card-header">
          <div>
            <p className="text-[var(--accent-color)] text-xs font-bold uppercase tracking-widest mb-1">
              {chambres.length} chambre{chambres.length > 1 ? 's' : ''} · {typeNom}
            </p>
            <h3>{t.nom}</h3>
          </div>
          <div className="room-price">
            <span className="price-amount">${t.prix_base_nuit}</span>
            <span className="price-night">/ nuit</span>
          </div>
        </div>

        {/* Description */}
        <p className="room-description">{t.description}</p>

        {/* Capacité & Détails */}
        <div className="room-details-row">
          <div className="room-detail-item">
            <Users size={14} className="room-detail-icon" />
            <span>{t.capacite_adultes} adulte{t.capacite_adultes > 1 ? 's' : ''}</span>
          </div>
          {t.capacite_enfants > 0 && (
            <div className="room-detail-item">
              <Baby size={14} className="room-detail-icon" />
              <span>{t.capacite_enfants} enfant{t.capacite_enfants > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Équipements */}
        {equipements.length > 0 && (
          <div className="room-amenities">
            {equipements.slice(0, 4).map((eq, i) => (
              <span key={i} className="amenity-tag flex items-center gap-1">
                <AmenityIcon name={eq} />
                {eq}
              </span>
            ))}
            {equipements.length > 4 && (
              <span className="amenity-tag">
                +{equipements.length - 4} de plus
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          disabled={!isAvailable}
          onClick={() => onReserver(ch, t)}
          className="room-book-btn"
        >
          {isAvailable ? 'Réserver cette chambre' : 'Indisponible'}
        </button>
      </div>
    </div>
  );
}

/* ─── PAGE PRINCIPALE ─── */
export default function RoomsPage() {
  const navigate = useNavigate();
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dates
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [disponibilite, setDisponibilite] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // Filtres
  const [filtrePrix, setFiltrePrix] = useState('tous');
  const [filtreType, setFiltreType] = useState('tous');
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    chambresApi.liste()
      .then(setChambres)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const verifierDisponibilite = async () => {
    if (!dateArrivee || !dateDepart) return;
    setCheckLoading(true);
    try {
      const data = await chambresApi.disponibles({ date_arrivee: dateArrivee, date_depart: dateDepart });
      setDisponibilite(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleReserver = (ch, t) => {
    navigate('/reservation', {
      state: {
        chambre_id: ch.id,
        numero_chambre: ch.numero_chambre,
        type_id: t.id,
        type_nom: t.nom,
        prix: t.prix_base_nuit,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
      }
    });
  };

  // Grouper les chambres par type
  const parType = chambres.reduce((acc, ch) => {
    const t = ch.type_chambre;
    if (!t) return acc;
    if (!acc[t.id]) acc[t.id] = { type: t, chambres: [] };
    acc[t.id].chambres.push(ch);
    return acc;
  }, {});

  // Liste des types uniques (pour filtres)
  const typesUniques = Object.values(parType).map(g => g.type);

  // Filtrage
  let groupesFiltres = Object.values(parType);

  if (filtreType !== 'tous') {
    groupesFiltres = groupesFiltres.filter(g => g.type.id === filtreType);
  }
  if (filtrePrix === 'budget') {
    groupesFiltres = groupesFiltres.filter(g => g.type.prix_base_nuit < 150);
  } else if (filtrePrix === 'milieu') {
    groupesFiltres = groupesFiltres.filter(g => g.type.prix_base_nuit >= 150 && g.type.prix_base_nuit < 300);
  } else if (filtrePrix === 'luxe') {
    groupesFiltres = groupesFiltres.filter(g => g.type.prix_base_nuit >= 300);
  }

  const disponibiliteIds = disponibilite?.chambres_ids || null;

  const totalDisponibles = chambres.filter(c =>
    disponibiliteIds ? disponibiliteIds.includes(c.id) : c.statut === 'disponible'
  ).length;

  return (
    <div className="page-rooms min-h-screen bg-[var(--bg-app)]">

      {/* ── HERO ── */}
      <div className="rooms-hero">
        <div className="relative z-10 px-6 max-w-3xl mx-auto flex flex-col items-center">
          {/* Badge haut de gamme */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[var(--accent-color)] text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
            <Star size={12} fill="currentColor" /> L'adresse d'exception à Bukavu
          </span>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight tracking-tight text-center">
            Élégance & Confort<br />
            <span className="text-[var(--accent-color)]">au bord du Lac Kivu</span>
          </h1>

          <p className="text-lg text-white/80 font-medium max-w-xl mx-auto text-center mb-8">
            Découvrez notre collection de {chambres.length || 14} chambres et suites de luxe, offrant calme, raffinement et une vue spectaculaire.
          </p>

          {/* Highlights de l'Hôtel */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/90 font-semibold mb-2">
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Check size={14} className="text-[var(--accent-color)]" /> Vue Panoramique sur le Lac
            </span>
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Check size={14} className="text-[var(--accent-color)]" /> WiFi Haute Vitesse & Clim
            </span>
            <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Check size={14} className="text-[var(--accent-color)]" /> Restaurant Gastronomique
            </span>
          </div>
        </div>

        {/* Flèche bas */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce z-10">
          <ChevronDown size={28} />
        </div>
      </div>

      {/* ── AVAILABILITY CHECKER FLOTTANT ── */}
      <div className="availability-checker">
        <div className="avail-form">
          {/* Date arrivée */}
          <div className="avail-field">
            <label>
              Date d'arrivée
            </label>
            <input
              type="date"
              min={today}
              value={dateArrivee}
              onChange={e => { setDateArrivee(e.target.value); setDisponibilite(null); }}
              className="modern-date-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Date départ */}
          <div className="avail-field">
            <label>
              Date de départ
            </label>
            <input
              type="date"
              min={dateArrivee || today}
              value={dateDepart}
              onChange={e => { setDateDepart(e.target.value); setDisponibilite(null); }}
              className="modern-date-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Bouton */}
          <button
            onClick={verifierDisponibilite}
            disabled={!dateArrivee || !dateDepart || checkLoading}
            className="avail-btn flex items-center justify-center gap-2"
          >
            {checkLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {checkLoading ? 'Recherche...' : 'Vérifier'}
          </button>
        </div>

        {/* Résultat */}
        {disponibilite && (
          <div className="avail-result">
            {disponibilite.total_disponibles > 0 ? (
              <span className="avail-ok">✓ {disponibilite.total_disponibles} chambre(s) disponible(s) pour votre séjour</span>
            ) : (
              <span className="avail-none">✗ Aucune chambre disponible pour ces dates</span>
            )}
          </div>
        )}
      </div>

      {/* ── STATS RAPIDES ── */}
      {!loading && chambres.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-10">
          <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
            {[
              { label: 'Chambres au total', value: chambres.length },
              { label: 'Disponibles maintenant', value: totalDisponibles },
              { label: 'Types de chambres', value: typesUniques.length },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-5 px-4 text-center">
                <span className="text-3xl font-black text-[var(--accent-color)]">{stat.value}</span>
                <span className="text-xs text-[var(--text-muted)] font-semibold mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTRES ── */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] text-sm font-semibold hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-all"
          >
            <SlidersHorizontal size={16} /> Filtres
          </button>

          {/* Filtre type */}
          {['tous', ...typesUniques.map(t => t.id)].map((val) => {
            const label = val === 'tous' ? 'Tous les types' : typesUniques.find(t => t.id === val)?.nom;
            return (
              <button
                key={val}
                onClick={() => setFiltreType(val)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  filtreType === val
                    ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] shadow-md'
                    : 'bg-[var(--surface-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-color)] hover:text-[var(--text-main)]'
                }`}
              >
                {label}
              </button>
            );
          })}

          {/* Filtre prix (si showFilters) */}
          {showFilters && (
            <div className="flex gap-2 flex-wrap w-full justify-center mt-2">
              {[
                { val: 'tous', label: 'Tous prix' },
                { val: 'budget', label: '< $150' },
                { val: 'milieu', label: '$150–$300' },
                { val: 'luxe', label: '> $300' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFiltrePrix(val)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    filtrePrix === val
                      ? 'bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/40'
                      : 'bg-[var(--surface-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-color)]/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── GRILLE DES CHAMBRES ── */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {error && (
          <div className="text-center py-12">
            <XCircle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="text-red-400 font-semibold">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-[var(--accent-color)] underline">Réessayer</button>
          </div>
        )}

        {loading ? (
          <div className="rooms-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="room-card animate-pulse">
                <div className="room-card-img-wrap bg-[var(--surface-hover)]" style={{ height: '260px' }} />
                <div className="room-card-body space-y-3">
                  <div className="h-4 bg-[var(--surface-hover)] rounded w-2/3" />
                  <div className="h-6 bg-[var(--surface-hover)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--surface-hover)] rounded w-full" />
                  <div className="h-10 bg-[var(--surface-hover)] rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : groupesFiltres.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
            <p className="text-[var(--text-muted)] font-semibold text-lg">Aucune chambre ne correspond à vos filtres</p>
            <button
              onClick={() => { setFiltreType('tous'); setFiltrePrix('tous'); }}
              className="mt-4 text-sm text-[var(--accent-color)] font-bold underline underline-offset-2"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="rooms-grid">
            {groupesFiltres.map(({ type, chambres: grp }) => (
              <RoomTypeCarousel
                key={type.id}
                typeNom={type.nom}
                chambres={grp}
                disponibiliteIds={disponibiliteIds}
                dateArrivee={dateArrivee}
                dateDepart={dateDepart}
                onReserver={handleReserver}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
