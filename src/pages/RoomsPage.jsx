import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chambresApi } from '../lib/api';

const CATEGORIE_LABELS = {
  entree: 'Entrées',
  plat_principal: 'Plats principaux',
  dessert: 'Desserts',
  boisson: 'Boissons',
  vin: 'Vins',
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [disponibilite, setDisponibilite] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  useEffect(() => {
    // Récupérer la liste des 14 chambres individuelles
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

  const today = new Date().toISOString().split('T')[0];

  // Si on a vérifié la disponibilité, on marque les chambres
  const chambresAffichees = chambres.map(c => {
    let isAvailable = true; // par défaut
    if (disponibilite && disponibilite.chambres_ids) {
      isAvailable = disponibilite.chambres_ids.includes(c.id);
    } else {
      isAvailable = c.statut === 'disponible';
    }
    return { ...c, isAvailable };
  });

  return (
    <div className="page-rooms">
      <div className="rooms-hero">
        <h1>Élégance & Confort</h1>
        <p>Découvrez notre collection exclusive d'hébergements avec vue imprenable sur le lac Kivu.</p>
      </div>

      {/* Vérificateur de disponibilité */}
      <div className="availability-checker">
        <div className="avail-form">
          <div className="avail-field">
            <label>Date d'arrivée</label>
            <input 
              type="date" 
              className="modern-date-input" 
              min={today} 
              value={dateArrivee}
              onChange={e => { setDateArrivee(e.target.value); setDisponibilite(null); }} 
            />
          </div>
          <div className="avail-field">
            <label>Date de départ</label>
            <input 
              type="date" 
              className="modern-date-input" 
              min={dateArrivee || today} 
              value={dateDepart}
              onChange={e => { setDateDepart(e.target.value); setDisponibilite(null); }} 
            />
          </div>
          <button className="avail-btn" onClick={verifierDisponibilite}
            disabled={!dateArrivee || !dateDepart || checkLoading}>
            {checkLoading ? 'Recherche…' : 'Vérifier la disponibilité'}
          </button>
        </div>
        {disponibilite && (
          <div className="avail-result">
            <span className={disponibilite.total_disponibles > 0 ? 'avail-ok' : 'avail-none'}>
              {disponibilite.total_disponibles > 0
                ? `✨ ${disponibilite.total_disponibles} chambre(s) disponible(s) pour votre séjour`
                : 'Malheureusement, aucune chambre n\'est disponible pour ces dates.'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: '20px' }}>
          ⚠️ {error} — <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      )}

      {loading ? (
        <div className="rooms-loading" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="rooms-spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Chargement de nos suites…</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {chambresAffichees.map((c, index) => {
            const t = c.type_chambre;
            if (!t) return null;
            const equipements = Array.isArray(t.equipements)
              ? t.equipements
              : (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })();
            
            const isAvailable = c.isAvailable;
            
            // On utilise l'image en ligne personnalisée, sinon on fallback
            const fallbackImages = [
              'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800&auto=format&fit=crop'
            ];
            const imgSrc = c.image_url || fallbackImages[index % fallbackImages.length];

            return (
              <div key={c.id} className="room-card">
                <div className="room-card-img-wrap">
                  <img src={imgSrc} alt={`Chambre ${c.numero_chambre}`} className="room-card-img" />
                  <div className={`room-avail-badge ${isAvailable ? 'avail-yes' : 'avail-no'}`}>
                    {isAvailable ? 'Disponible' : 'Occupée'}
                  </div>
                </div>
                
                <div className="room-card-body">
                  <div className="room-card-header">
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chambre {c.numero_chambre} {c.etage ? `(Étage ${c.etage})` : ''}
                      </span>
                      <h3>{t.nom}</h3>
                    </div>
                    <div className="room-price">
                      <span className="price-amount">${t.prix_base_nuit}</span>
                      <span className="price-night">/nuit</span>
                    </div>
                  </div>
                  
                  <p className="room-description">{t.description}</p>
                  
                  <div className="room-details-row">
                    <div className="room-detail-item">
                      <span className="room-detail-icon">👥</span>
                      {t.capacite_adultes} Adulte{t.capacite_adultes > 1 ? 's' : ''}
                      {t.capacite_enfants > 0 && ` & ${t.capacite_enfants} Enfant${t.capacite_enfants > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  
                  <div className="room-amenities">
                    {equipements.slice(0, 4).map((eq, i) => (
                      <span key={i} className="amenity-tag">{eq}</span>
                    ))}
                    {equipements.length > 4 && <span className="amenity-tag">+{equipements.length - 4}</span>}
                  </div>
                  
                  <button
                    className="room-book-btn"
                    disabled={!isAvailable}
                    onClick={() => navigate('/reservation', {
                      state: {
                        chambre_id: c.id,
                        numero_chambre: c.numero_chambre,
                        type_id: t.id,
                        type_nom: t.nom,
                        prix: t.prix_base_nuit,
                        date_arrivee: dateArrivee,
                        date_depart: dateDepart,
                      }
                    })}
                  >
                    {!isAvailable ? 'Indisponible' : 'Réserver cette chambre'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
