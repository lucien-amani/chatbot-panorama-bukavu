import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, Star, Wifi, Coffee, Wind, Tv, Bath, Search,
  SlidersHorizontal, CheckCircle2, XCircle, ChevronDown,
  Check, Baby, X, Filter, Bed, LayoutGrid, List
} from 'lucide-react';
import { chambresApi } from '../lib/api';
import DateRangePicker from '../components/DateRangePicker';
import hotelsData from '../../hotels.json';

const AMENITY_ICONS = {
  'Wi-Fi': Wifi, 'WiFi': Wifi, 'Wifi gratuit': Wifi,
  'Climatisation': Wind, 'Clim': Wind,
  'Café': Coffee, 'Café/Thé': Coffee,
  'Télévision': Tv, 'TV': Tv, 'TV Satellite': Tv,
  'Baignoire': Bath, 'Jacuzzi': Bath,
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop',
];

const STATUT_STYLE = {
  disponible: { label: 'Disponible', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  occupee:    { label: 'Occupée',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  nettoyage:  { label: 'Nettoyage',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  maintenance:{ label: 'Maintenance',cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

function CustomSelect({ value, onChange, options, label, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative shrink-0 z-20" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2.5 bg-[var(--surface-app)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-main)] px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none transition-all cursor-pointer min-w-[200px] shadow-sm select-none"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-[var(--accent-color)] shrink-0" />}
          <span className="truncate">{selectedOption?.label || label}</span>
        </div>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-full min-w-[220px] bg-[var(--surface-app)] border border-[var(--border-color)] rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-bold'
                  : 'text-[var(--text-main)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check size={14} className="text-[var(--accent-color)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomCard({ chambre, disponibiliteIds, onReserver, viewMode = 'grid' }) {
  const t = chambre.type_chambre;
  if (!t) return null;
  const equipements = Array.isArray(t.equipements)
    ? t.equipements
    : (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })();

  const imgSrc = chambre.image_url || FALLBACK_IMAGES[parseInt(chambre.numero_chambre) % FALLBACK_IMAGES.length] || FALLBACK_IMAGES[0];
  const isAvailable = disponibiliteIds ? disponibiliteIds.includes(chambre.id) : chambre.statut === 'disponible';
  const st = STATUT_STYLE[chambre.statut] || STATUT_STYLE.maintenance;

  if (viewMode === 'list') {
    return (
      <div className="group bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-[var(--accent-color)]/40 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row min-h-[240px]">
        {/* Left Side: Image */}
        <div className="relative w-full md:w-[300px] lg:w-[360px] shrink-0 overflow-hidden h-52 md:h-auto">
          <img
            src={imgSrc}
            alt={`Chambre ${chambre.numero_chambre}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 md:from-black/40 via-transparent to-transparent" />

          {/* Badges on Image */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${st.cls}`}>
              {st.label}
            </span>
          </div>
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold">
            N° {chambre.numero_chambre}{chambre.etage ? ` · Étage ${chambre.etage}` : ''}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-color)] transition-colors">
                  {t.nom}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                  N° {chambre.numero_chambre} — Étage {chambre.etage || 0}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black text-[var(--accent-color)]">${t.prix_base_nuit}</span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">/ NUIT</span>
              </div>
            </div>

            <p className="text-[var(--text-muted)] text-sm line-clamp-2 mb-4 max-w-2xl leading-relaxed">
              {t.description}
            </p>

            {/* Capacities & Equipments */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-[var(--text-main)] font-semibold bg-[var(--surface-hover)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                  <Users size={12} className="text-[var(--accent-color)]" /> {t.capacite_adultes} adulte{t.capacite_adultes > 1 ? 's' : ''}
                </span>
                {t.capacite_enfants > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-main)] font-semibold bg-[var(--surface-hover)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                    <Baby size={12} className="text-[var(--accent-color)]" /> {t.capacite_enfants} enfant{t.capacite_enfants > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {equipements.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {equipements.map((eq, i) => {
                    const Icon = AMENITY_ICONS[eq];
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--surface-hover)] text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border-color)]">
                        {Icon && <Icon size={10} className="text-[var(--accent-color)]" />}{eq}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-[var(--border-color)] pt-4 mt-2">
            <div className="w-full md:w-auto">
              <button
                disabled={!isAvailable}
                onClick={() => onReserver(chambre, t)}
                className={`w-full md:w-[200px] py-2.5 px-6 rounded-xl text-sm font-bold transition-all ${
                  isAvailable
                    ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98]'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
                }`}
              >
                {isAvailable ? 'Réserver cette chambre' : 'Indisponible'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-[var(--accent-color)]/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full justify-between">
      <div>
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={imgSrc}
            alt={`Chambre ${chambre.numero_chambre}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badges top */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${st.cls}`}>
              {st.label}
            </span>
          </div>
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold">
            N° {chambre.numero_chambre}{chambre.etage ? ` · Étage ${chambre.etage}` : ''}
          </div>

          {/* Price bottom-left */}
          <div className="absolute bottom-3 left-3">
            <span className="text-white text-xl font-black">${t.prix_base_nuit}</span>
            <span className="text-white/70 text-xs ml-1">/nuit</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="text-lg font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-color)] transition-colors mb-1 line-clamp-1">
            {t.nom}
          </h3>
          <p className="text-[var(--text-muted)] text-sm line-clamp-2 mb-3 leading-relaxed">
            {t.description}
          </p>

          {/* Capacité */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Users size={12} className="text-[var(--accent-color)]" /> {t.capacite_adultes} adulte{t.capacite_adultes > 1 ? 's' : ''}
            </span>
            {t.capacite_enfants > 0 && (
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Baby size={12} className="text-[var(--accent-color)]" /> {t.capacite_enfants} enfant{t.capacite_enfants > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Équipements */}
          {equipements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {equipements.slice(0, 3).map((eq, i) => {
                const Icon = AMENITY_ICONS[eq];
                return (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--surface-hover)] text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border-color)]">
                    {Icon && <Icon size={10} className="text-[var(--accent-color)]" />}{eq}
                  </span>
                );
              })}
              {equipements.length > 3 && (
                <span className="px-2.5 py-0.5 bg-[var(--surface-hover)] text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border-color)]">
                  +{equipements.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          disabled={!isAvailable}
          onClick={() => onReserver(chambre, t)}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
            isAvailable
              ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98]'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
          }`}
        >
          {isAvailable ? 'Réserver cette chambre' : 'Indisponible'}
        </button>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const { slug } = useParams(); // présent si route /hotel/:slug

  // Hôtel correspondant au slug (si venu depuis le chatbot)
  const hotelActif = slug ? (hotelsData.hotels.find(h => h.slug === slug) || null) : null;

  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [disponibilite, setDisponibilite] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const [filtreType, setFiltreType] = useState('tous');
  const [filtrePrix, setFiltrePrix] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Charger les chambres en filtrant par hotel_slug si présent dans l'URL
    const url = slug
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres?hotel_slug=${slug}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Erreur API')))
      .then(setChambres)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

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
        hotel_slug: ch.hotel_slug || slug || 'hotel-panorama',
        hotel_nom: hotelActif?.name || null,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
      }
    });
  };

  const typesUniques = [...new Map(chambres.map(c => [c.type_chambre?.id, c.type_chambre]).filter(([k]) => k)).values()];
  const disponibiliteIds = disponibilite?.chambres_ids || null;

  let filtrees = chambres;
  if (filtreType !== 'tous') filtrees = filtrees.filter(c => c.type_chambre?.id === filtreType);
  if (filtrePrix === 'budget') filtrees = filtrees.filter(c => c.type_chambre?.prix_base_nuit < 150);
  else if (filtrePrix === 'milieu') filtrees = filtrees.filter(c => c.type_chambre?.prix_base_nuit >= 150 && c.type_chambre?.prix_base_nuit < 300);
  else if (filtrePrix === 'luxe') filtrees = filtrees.filter(c => c.type_chambre?.prix_base_nuit >= 300);
  if (filtreStatut !== 'tous') filtrees = filtrees.filter(c => c.statut === filtreStatut);

  const totalDispo = chambres.filter(c => disponibiliteIds ? disponibiliteIds.includes(c.id) : c.statut === 'disponible').length;

  const resetFiltres = () => { setFiltreType('tous'); setFiltrePrix('tous'); setFiltreStatut('tous'); };

  const FilterContent = () => (
    <div className="flex flex-col gap-5">
      {/* Date picker */}
      <div>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Dates de séjour</p>
        <DateRangePicker
          startDate={dateArrivee}
          endDate={dateDepart}
          onStartChange={v => { setDateArrivee(v); setDisponibilite(null); }}
          onEndChange={v => { setDateDepart(v); setDisponibilite(null); }}
          minDate={today}
        />
        {dateArrivee && dateDepart && (
          <button
            onClick={verifierDisponibilite}
            disabled={checkLoading}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--accent-color)] text-[var(--text-on-accent)] py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50"
          >
            {checkLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Search size={15} />}
            {checkLoading ? 'Recherche...' : 'Vérifier disponibilité'}
          </button>
        )}
        {disponibilite && (
          <div className={`mt-2 text-xs font-semibold text-center py-2 rounded-lg ${
            disponibilite.total_disponibles > 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {disponibilite.total_disponibles > 0
              ? `✓ ${disponibilite.total_disponibles} chambre(s) disponible(s)`
              : '✗ Aucune chambre disponible'}
          </div>
        )}
      </div>

      {/* Type */}
      <div>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Type de chambre</p>
        <div className="flex flex-col gap-1.5">
          {['tous', ...typesUniques.map(t => t.id)].map(val => {
            const label = val === 'tous' ? 'Tous les types' : typesUniques.find(t => t.id === val)?.nom;
            return (
              <button key={val} onClick={() => setFiltreType(val)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtreType === val
                    ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent'
                }`}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Prix */}
      <div>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Gamme de prix</p>
        <div className="flex flex-col gap-1.5">
          {[
            { val: 'tous', label: 'Tous les prix' },
            { val: 'budget', label: 'Économique (< $150)' },
            { val: 'milieu', label: 'Confort ($150–$300)' },
            { val: 'luxe', label: 'Luxe (> $300)' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setFiltrePrix(val)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filtrePrix === val
                  ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Statut */}
      <div>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Disponibilité</p>
        <div className="flex flex-col gap-1.5">
          {[
            { val: 'tous', label: 'Toutes' },
            { val: 'disponible', label: 'Disponible' },
            { val: 'occupee', label: 'Occupée' },
            { val: 'maintenance', label: 'En maintenance' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setFiltreStatut(val)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filtreStatut === val
                  ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <button onClick={resetFiltres}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-colors font-medium underline underline-offset-2 text-center font-bold">
        Réinitialiser tous les filtres
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">

      {/* ── HEADER ── */}
      <div className="pt-8 pb-4 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
          {hotelActif ? hotelActif.name : 'Nos Chambres & Suites'}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
          {hotelActif
            ? `${hotelActif.category} · ${hotelActif.address?.street}, Bukavu · ${hotelActif.description?.summary}`
            : 'Découvrez notre sélection de chambres haut de gamme alliant confort, élégance et modernité à Bukavu.'}
        </p>
        {hotelActif?.contact?.phone && (
          <p className="mt-1 text-xs text-[var(--accent-color)] font-semibold">
            📞 {hotelActif.contact.phone}
          </p>
        )}
      </div>

      {/* ── HORIZONTAL FILTERS BAR (STICKY) ── */}
      <div className="sticky top-[68px] z-20 bg-[var(--surface-app)] border-b border-[var(--border-color)] py-3 px-4 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Desktop Filters */}
          <div className="hidden lg:flex flex-wrap items-center gap-3 flex-1">
            <div className="w-[260px] shrink-0">
              <DateRangePicker
                startDate={dateArrivee}
                endDate={dateDepart}
                onStartChange={v => { setDateArrivee(v); setDisponibilite(null); }}
                onEndChange={v => { setDateDepart(v); setDisponibilite(null); }}
                minDate={today}
              />
            </div>
            {dateArrivee && dateDepart && (
              <button
                onClick={verifierDisponibilite}
                disabled={checkLoading}
                className="bg-[var(--accent-color)] text-[var(--text-on-accent)] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {checkLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Search size={14} />}
                <span>Vérifier</span>
              </button>
            )}

            {/* Dropdowns */}
            <CustomSelect
              value={filtreType}
              onChange={setFiltreType}
              options={[
                { value: 'tous', label: 'Tous les types' },
                ...typesUniques.map(t => ({ value: t.id, label: t.nom }))
              ]}
              label="Type de chambre"
              icon={Bed}
            />

            <CustomSelect
              value={filtrePrix}
              onChange={setFiltrePrix}
              options={[
                { value: 'tous', label: 'Tous les prix' },
                { value: 'budget', label: 'Économique (< $150)' },
                { value: 'milieu', label: 'Confort ($150–$300)' },
                { value: 'luxe', label: 'Luxe (> $300)' }
              ]}
              label="Budget"
              icon={SlidersHorizontal}
            />

            <CustomSelect
              value={filtreStatut}
              onChange={setFiltreStatut}
              options={[
                { value: 'tous', label: 'Toutes les disponibilités' },
                { value: 'disponible', label: 'Disponible' },
                { value: 'occupee', label: 'Occupée' },
                { value: 'nettoyage', label: 'En nettoyage' },
                { value: 'maintenance', label: 'En maintenance' }
              ]}
              label="Disponibilité"
              icon={CheckCircle2}
            />

            {(filtreType !== 'tous' || filtrePrix !== 'tous' || filtreStatut !== 'tous' || dateArrivee || dateDepart) && (
              <button
                onClick={() => { resetFiltres(); setDateArrivee(''); setDateDepart(''); setDisponibilite(null); }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-colors font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>

          {/* Mobile Filters Trigger */}
          <div className="flex lg:hidden items-center gap-2 flex-1">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] text-sm font-semibold bg-[var(--bg-app)] hover:border-[var(--accent-color)] transition-colors cursor-pointer"
            >
              <Filter size={14} />
              <span>Filtres</span>
              {(filtreType !== 'tous' || filtrePrix !== 'tous' || filtreStatut !== 'tous' || dateArrivee || dateDepart) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" />
              )}
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 border border-[var(--border-color)] bg-[var(--bg-app)] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]'
              }`}
              title="Vue Liste"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      {!loading && chambres.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'Chambres au total', value: chambres.length },
              { label: 'Disponibles maintenant', value: totalDispo },
              { label: 'Types de chambres', value: typesUniques.length },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-3 px-3 text-center">
                <span className="text-xl md:text-2xl font-black text-[var(--accent-color)]">{s.value}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className={`mx-auto px-4 py-8 pb-20 transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        
        {error && (
          <div className="text-center py-12">
            <XCircle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="text-red-400 font-semibold">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-[var(--accent-color)] underline">Réessayer</button>
          </div>
        )}

        {!error && (
          <>
            {/* Result Header info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                {loading ? 'Chargement…' : `${filtrees.length} chambre${filtrees.length !== 1 ? 's' : ''} trouvée${filtrees.length !== 1 ? 's' : ''}`}
              </p>
              {(filtreType !== 'tous' || filtrePrix !== 'tous' || filtreStatut !== 'tous' || dateArrivee || dateDepart) && (
                <button
                  onClick={() => { resetFiltres(); setDateArrivee(''); setDateDepart(''); setDisponibilite(null); }}
                  className="text-xs text-[var(--accent-color)] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>

            {loading ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-6"}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl overflow-hidden animate-pulse ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}>
                    <div className={`bg-[var(--surface-hover)] ${viewMode === 'list' ? 'h-52 md:h-auto md:w-[300px] lg:w-[360px] shrink-0' : 'h-52'}`} />
                    <div className="p-4 flex-1 space-y-3">
                      <div className="h-3 bg-[var(--surface-hover)] rounded w-1/3" />
                      <div className="h-5 bg-[var(--surface-hover)] rounded w-2/3" />
                      <div className="h-3 bg-[var(--surface-hover)] rounded w-full" />
                      <div className="h-10 bg-[var(--surface-hover)] rounded-xl mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtrees.length === 0 ? (
              <div className="text-center py-20">
                <Bed size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
                <p className="text-[var(--text-muted)] font-semibold text-lg">Aucune chambre ne correspond</p>
                <button onClick={() => { resetFiltres(); setDateArrivee(''); setDateDepart(''); setDisponibilite(null); }}
                  className="mt-4 text-sm text-[var(--accent-color)] font-bold underline underline-offset-2 cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-6"}>
                {filtrees.map(ch => (
                  <RoomCard
                    key={ch.id}
                    chambre={ch}
                    disponibiliteIds={disponibiliteIds}
                    onReserver={handleReserver}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* MOBILE FILTER DRAWER */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--surface-app)] rounded-t-2xl p-5 lg:hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text-main)]">Filtres</h2>
              <button onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>
            <FilterContent />
            <button onClick={() => setShowMobileFilters(false)}
              className="mt-4 w-full bg-[var(--accent-color)] text-[var(--text-on-accent)] py-3 rounded-xl font-bold cursor-pointer"
            >
              Voir {filtrees.length} chambre{filtrees.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
