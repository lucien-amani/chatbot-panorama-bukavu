import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Check, ArrowRight, BedDouble, Users, Info, MapPin } from 'lucide-react';
import { chambresApi, hotelsApi } from '../lib/api';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=900&auto=format&fit=crop',
];

// --- Very minimal RoomCard ---
function RoomCard({ chambre, isAvailable, onClick }) {
  const t = chambre.type_chambre;
  if (!t) return null;
  const imgSrc = chambre.image_url || FALLBACK_IMAGES[parseInt(chambre.numero_chambre) % FALLBACK_IMAGES.length] || FALLBACK_IMAGES[0];

  return (
    <div 
      onClick={() => onClick(chambre, t)}
      className="group cursor-pointer bg-[var(--surface-app)] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-[var(--border-color)] transition-all duration-500 relative w-full"
    >
      <div className="relative h-[320px] w-full overflow-hidden">
        <img
          src={imgSrc}
          alt={t.nom}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Room Number Badge */}
        <div className="absolute top-4 left-4 bg-white/95 text-black px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
          N° {chambre.numero_chambre}
        </div>
        
        {/* Minimal info at bottom of image */}
        <div className="absolute bottom-0 left-0 w-full p-6 flex items-end justify-between">
          <div className="pr-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-md leading-tight">{t.nom}</h3>
            {!isAvailable && (
              <span className="inline-block mt-2 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">Non Disponible</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-[var(--accent-color)] drop-shadow-md">${t.prix_base_nuit}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Detail Modal ---
function RoomModal({ chambre, type, hotel, isAvailable, onClose, onReserver, initialCheckin, initialCheckout }) {
  if (!chambre || !type) return null;
  
  const imgSrc = chambre.image_url || FALLBACK_IMAGES[parseInt(chambre.numero_chambre) % FALLBACK_IMAGES.length] || FALLBACK_IMAGES[0];

  const equipements = Array.isArray(type.equipements)
    ? type.equipements
    : (() => { try { return JSON.parse(type.equipements || '[]'); } catch { return []; } })();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[var(--bg-app)] w-full max-w-6xl max-h-[95vh] md:max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Large Image */}
        <div className="relative w-full md:w-1/2 lg:w-[45%] h-64 md:h-auto shrink-0 bg-black">
          <img src={imgSrc} alt={type.nom} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Details & Action */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
          
          <button 
            onClick={onClose}
            className="hidden md:flex absolute top-6 right-6 w-10 h-10 bg-[var(--surface-hover)] hover:bg-[var(--border-color)] rounded-full items-center justify-center text-[var(--text-main)] transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-6 md:p-10 overflow-y-auto flex-1 flex flex-col w-full">
            
            {/* Header section fully utilizing width */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 w-full border-b border-[var(--border-color)] pb-6">
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent-color)]">
                  <MapPin size={14} /> {hotel?.name || 'Hôtel inconnu'}
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-main)] mb-1 leading-tight">
                  {type.nom}
                </h2>
                <div className="text-[var(--text-muted)] font-semibold">
                  Chambre Numéro {chambre.numero_chambre} {chambre.etage ? `· Étage ${chambre.etage}` : ''}
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-0 shrink-0">
                <div className="text-4xl md:text-5xl font-black text-[var(--accent-color)]">${type.prix_base_nuit}</div>
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                  Par nuit
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 text-justify">
              <p className="text-[var(--text-main)] text-lg leading-relaxed opacity-90">
                {type.description}
              </p>
            </div>

            {/* Grid for Capacity / Bedding taking full width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full">
              <div className="flex items-center gap-4 bg-[var(--surface-app)] border border-[var(--border-color)] p-4 rounded-2xl w-full">
                <div className="bg-[var(--accent-color)]/10 p-3 rounded-xl text-[var(--accent-color)] shrink-0">
                  <Users size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[var(--text-muted)] font-bold uppercase">Capacité max.</div>
                  <div className="font-bold text-lg text-[var(--text-main)]">{type.capacite_adultes} Adultes {type.capacite_enfants > 0 ? `+ ${type.capacite_enfants} Enfants` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[var(--surface-app)] border border-[var(--border-color)] p-4 rounded-2xl w-full">
                <div className="bg-[var(--accent-color)]/10 p-3 rounded-xl text-[var(--accent-color)] shrink-0">
                  <BedDouble size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[var(--text-muted)] font-bold uppercase">Confort</div>
                  <div className="font-bold text-lg text-[var(--text-main)]">1 Grand Lit</div>
                </div>
              </div>
            </div>

            {/* Equipments taking full width */}
            {equipements.length > 0 && (
              <div className="mt-auto w-full">
                <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)] mb-4 border-b border-[var(--border-color)] pb-2">Équipements inclus</h4>
                <div className="flex flex-wrap gap-2.5">
                  {equipements.map(eq => (
                    <span key={eq} className="bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium px-4 py-2 rounded-xl">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action taking full width */}
          <div className="p-6 md:p-8 bg-[var(--bg-app)] border-t border-[var(--border-color)] shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
              <div className="text-sm font-semibold text-[var(--text-muted)] flex-1">
                {initialCheckin && initialCheckout 
                  ? <span className="text-[var(--text-main)] block">Séjour prévu du <strong className="text-[var(--accent-color)] text-base">{initialCheckin}</strong> au <strong className="text-[var(--accent-color)] text-base">{initialCheckout}</strong></span>
                  : <span>Veuillez sélectionner vos dates à l'accueil pour vérifier la disponibilité exacte.</span>}
              </div>
              
              <button
                disabled={!isAvailable}
                onClick={() => onReserver(chambre, type)}
                className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shrink-0 ${
                  isAvailable
                    ? 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] shadow-[0_10px_25px_rgba(var(--accent-color-rgb),0.3)] hover:-translate-y-1 active:scale-95'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                {isAvailable ? 'Réserver Maintenant' : 'Indisponible'} <ArrowRight size={22} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  
  const searchParams = new URLSearchParams(window.location.search);
  const hotelSlugParam = searchParams.get('hotel_slug') || slug;
  const initialCheckin = searchParams.get('checkin') || '';
  const initialCheckout = searchParams.get('checkout') || '';

  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    hotelsApi.liste().then(setHotels).catch(() => {});
  }, []);

  const hotelActif = hotelSlugParam ? (hotels.find(h => h.slug === hotelSlugParam) || null) : null;

  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disponibiliteIds, setDisponibiliteIds] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // Modal state
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const url = hotelSlugParam
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres?hotel_slug=${hotelSlugParam}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres`;
    
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(setChambres)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelSlugParam]);

  useEffect(() => {
    if (initialCheckin && initialCheckout) {
      setCheckLoading(true);
      chambresApi.disponibles({ date_arrivee: initialCheckin, date_depart: initialCheckout })
        .then(data => setDisponibiliteIds(data.chambres_ids || []))
        .catch(console.error)
        .finally(() => setCheckLoading(false));
    }
  }, [initialCheckin, initialCheckout]);

  const handleReserver = (ch, t) => {
    navigate('/reservation', {
      state: {
        chambre_id: ch.id,
        numero_chambre: ch.numero_chambre,
        type_id: t.id,
        type_nom: t.nom,
        prix: t.prix_base_nuit,
        hotel_slug: ch.hotel_slug || hotelSlugParam || 'hotel-panorama',
        hotel_nom: hotels.find(h => h.slug === ch.hotel_slug)?.name || hotelActif?.name || null,
        date_arrivee: initialCheckin,
        date_depart: initialCheckout,
      }
    });
  };

  const isRoomAvailable = (c) => {
    if (disponibiliteIds !== null) return disponibiliteIds.includes(c.id);
    return c.statut === 'disponible';
  };

  const openModal = (ch, t) => {
    setSelectedRoom({ chambre: ch, type: t });
  };

  const closeModal = () => setSelectedRoom(null);

  const totalDispo = chambres.filter(isRoomAvailable).length;

  // Group rooms by hotel
  const groupedRooms = chambres.reduce((acc, chambre) => {
    const s = chambre.hotel_slug || 'autre';
    if (!acc[s]) acc[s] = [];
    acc[s].push(chambre);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--bg-app)] pb-24">
      <div className="pt-20 pb-12 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] tracking-tight mb-6">
          {hotelActif ? hotelActif.name : 'Sélection de Chambres'}
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium">
          {hotelActif
            ? `${hotelActif.address?.street}, Bukavu`
            : 'Trouvez le confort absolu parmi notre réseau d\'hôtels exclusifs.'}
        </p>
        
        {initialCheckin && initialCheckout && !checkLoading && (
          <div className="mt-8 inline-flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-2xl font-bold text-sm md:text-base">
            <Check size={20} />
            {totalDispo} chambres disponibles du {initialCheckin} au {initialCheckout}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading || checkLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[var(--surface-app)] rounded-3xl overflow-hidden h-[320px] animate-pulse">
                <div className="w-full h-full bg-[var(--surface-hover)]" />
              </div>
            ))}
          </div>
        ) : chambres.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface-app)] rounded-[2rem] border border-[var(--border-color)] max-w-2xl mx-auto">
            <Info size={64} className="mx-auto mb-6 text-[var(--text-muted)] opacity-30" />
            <p className="text-[var(--text-main)] font-bold text-2xl">Aucune chambre disponible</p>
            <p className="text-[var(--text-muted)] mt-2">Veuillez modifier vos dates de séjour depuis la page d'accueil.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.keys(groupedRooms).map(slug => {
              const hData = hotels.find(h => h.slug === slug);
              const hotelName = hData ? hData.name : 'Autres Hôtels';
              const rooms = groupedRooms[slug];

              return (
                <div key={slug} className="space-y-6">
                  {/* Section Title for Hotel */}
                  {!hotelActif && (
                    <div className="flex items-center gap-3 pb-2 border-b-2 border-[var(--border-color)]">
                      <MapPin size={24} className="text-[var(--accent-color)]" />
                      <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)]">{hotelName}</h2>
                      <span className="ml-auto text-sm font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] px-3 py-1 rounded-full">
                        {rooms.length} chambre(s)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {rooms.map(ch => (
                      <RoomCard
                        key={ch.id}
                        chambre={ch}
                        isAvailable={isRoomAvailable(ch)}
                        onClick={openModal}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal overlay */}
      {selectedRoom && (
        <RoomModal 
          chambre={selectedRoom.chambre}
          type={selectedRoom.type}
          hotel={hotels.find(h => h.slug === selectedRoom.chambre.hotel_slug)}
          isAvailable={isRoomAvailable(selectedRoom.chambre)}
          onClose={closeModal}
          onReserver={handleReserver}
          initialCheckin={initialCheckin}
          initialCheckout={initialCheckout}
        />
      )}
    </div>
  );
}
