import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalIcon, MapPin, ArrowRight, Building2, Check } from 'lucide-react';
import hotelsData from '../../hotels.json';

export default function LandingPage() {
  const navigate = useNavigate();
  const [hotelSlug, setHotelSlug] = useState('');
  
  // Custom simple date inputs (format JJ-MM)
  const [checkinRaw, setCheckinRaw] = useState('');
  const [checkoutRaw, setCheckoutRaw] = useState('');

  const parseSimpleDate = (val) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 2) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = new Date().getFullYear();
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const checkin = parseSimpleDate(checkinRaw);
    const checkout = parseSimpleDate(checkoutRaw);
    
    const params = new URLSearchParams();
    if (checkin) params.append('checkin', checkin);
    if (checkout) params.append('checkout', checkout);
    
    if (hotelSlug) {
      navigate(`/hotel/${hotelSlug}?${params.toString()}`);
    } else {
      navigate(`/chambres?${params.toString()}`);
    }
  };

  return (
    <div className="landing flex flex-col min-h-[calc(100vh-70px)] bg-[var(--bg-app)]">
      <section className="relative flex-1 flex flex-col justify-center min-h-[calc(100vh-70px)] bg-[url('https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 z-0" />
        
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 w-full mb-8 pt-10">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-lg">
            Découvrez Bukavu & Le Kivu
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl leading-tight">
            Votre Séjour de Rêve à <span className="text-[var(--accent-color)]">Bukavu</span>
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto font-medium mb-8">
            Sélectionnez votre établissement privilégié ci-dessous et explorez les chambres disponibles en un clic.
          </p>

          {/* --- HOTEL BREADCRUMB / PILL NAV --- */}
          <div className="w-full max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 px-2 no-scrollbar scroll-smooth backdrop-blur-md bg-black/40 rounded-3xl border border-white/10 shadow-2xl">
              <button
                type="button"
                onClick={() => setHotelSlug('')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  hotelSlug === ''
                    ? 'bg-[var(--accent-color)] text-white shadow-lg scale-105'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Building2 size={16} />
                <span>Tous les Hôtels</span>
                {hotelSlug === '' && <Check size={14} />}
              </button>

              {hotelsData.hotels.map((h) => (
                <button
                  key={h.slug}
                  type="button"
                  onClick={() => setHotelSlug(h.slug)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                    hotelSlug === h.slug
                      ? 'bg-[var(--accent-color)] text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <MapPin size={16} />
                  <span>{h.name}</span>
                  {hotelSlug === h.slug && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Form - simplified with dates only & search button */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 pb-16">
          <form 
            className="bg-[var(--surface-app)] p-3 md:p-4 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[var(--border-color)] flex flex-col md:flex-row gap-3 items-center backdrop-blur-xl w-full"
            onSubmit={handleSearch}
          >
            {/* Dates Row */}
            <div className="flex w-full md:flex-1 gap-3 h-[64px]">
              <div className="flex-1 relative h-full w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalIcon size={20} className="text-[var(--accent-color)]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Arrivée (JJ-MM)"
                  value={checkinRaw}
                  onChange={e => setCheckinRaw(e.target.value)}
                  className="w-full h-full pl-12 pr-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-bold placeholder:font-normal placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition-all"
                />
              </div>
              <div className="flex-1 relative h-full w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalIcon size={20} className="text-[var(--text-muted)]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Départ (JJ-MM)"
                  value={checkoutRaw}
                  onChange={e => setCheckoutRaw(e.target.value)}
                  className="w-full h-full pl-12 pr-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-bold placeholder:font-normal placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full md:w-[180px] h-[64px] bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] hover:-translate-y-1 active:scale-95 cursor-pointer shrink-0"
            >
              <span>Voir les chambres</span>
              <ArrowRight size={22} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
