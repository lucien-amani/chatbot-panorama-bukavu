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
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [disponibilite, setDisponibilite] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  useEffect(() => {
    chambresApi.types()
      .then(setTypes)
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

  const afficherTypes = disponibilite ? disponibilite.types : types;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-rooms">
      <div className="rooms-hero">
        <h1>Nos Chambres & Suites</h1>
        <p>Découvrez notre collection d'hébergements avec vue sur le lac Kivu</p>
      </div>

      {/* Vérificateur de disponibilité */}
      <div className="availability-checker">
        <h2>Vérifier les disponibilités</h2>
        <div className="avail-form">
          <div className="avail-field">
            <label>Date d'arrivée</label>
            <input type="date" min={today} value={dateArrivee}
              onChange={e => { setDateArrivee(e.target.value); setDisponibilite(null); }} />
          </div>
          <div className="avail-field">
            <label>Date de départ</label>
            <input type="date" min={dateArrivee || today} value={dateDepart}
              onChange={e => { setDateDepart(e.target.value); setDisponibilite(null); }} />
          </div>
          <button className="avail-btn" onClick={verifierDisponibilite}
            disabled={!dateArrivee || !dateDepart || checkLoading}>
            {checkLoading ? 'Recherche…' : '🔍 Vérifier'}
          </button>
        </div>
        {disponibilite && (
          <div className="avail-result">
            <span className={disponibilite.total_disponibles > 0 ? 'avail-ok' : 'avail-none'}>
              {disponibilite.total_disponibles > 0
                ? `✅ ${disponibilite.total_disponibles} chambre(s) disponible(s) pour ces dates`
                : '❌ Aucune chambre disponible pour ces dates'}
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
        <div className="rooms-loading">
          <div className="rooms-spinner" />
          <p>Chargement des chambres…</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {afficherTypes.map(t => {
            const equipements = Array.isArray(t.equipements)
              ? t.equipements
              : (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })();
            const dispo = disponibilite
              ? (t.chambres_disponibles || 0)
              : (t.chambres_disponibles || 0);
            const isAvailable = dispo > 0;

            return (
              <div key={t.id} className={`room-card ${!isAvailable && disponibilite ? 'room-unavailable' : ''}`}>
                <div className="room-card-img-wrap">
                  <div className="room-card-img-placeholder">
                    <span>🏨</span>
                  </div>
                  {disponibilite && (
                    <div className={`room-avail-badge ${isAvailable ? 'avail-yes' : 'avail-no'}`}>
                      {isAvailable ? `${dispo} dispo` : 'Complet'}
                    </div>
                  )}
                </div>
                <div className="room-card-body">
                  <div className="room-card-header">
                    <h3>{t.nom}</h3>
                    <div className="room-price">
                      <span className="price-amount">${t.prix_base_nuit}</span>
                      <span className="price-night">/nuit</span>
                    </div>
                  </div>
                  <p className="room-description">{t.description}</p>
                  <div className="room-capacity">
                    👥 {t.capacite_adultes} adulte{t.capacite_adultes > 1 ? 's' : ''}
                    {t.capacite_enfants > 0 && ` + ${t.capacite_enfants} enfant${t.capacite_enfants > 1 ? 's' : ''}`}
                  </div>
                  <div className="room-amenities">
                    {equipements.slice(0, 4).map((eq, i) => (
                      <span key={i} className="amenity-tag">{eq}</span>
                    ))}
                    {equipements.length > 4 && <span className="amenity-tag">+{equipements.length - 4}</span>}
                  </div>
                  <button
                    className="room-book-btn"
                    disabled={disponibilite && !isAvailable}
                    onClick={() => navigate('/reservation', {
                      state: {
                        type_id: t.id,
                        type_nom: t.nom,
                        prix: t.prix_base_nuit,
                        date_arrivee: dateArrivee,
                        date_depart: dateDepart,
                      }
                    })}
                  >
                    {disponibilite && !isAvailable ? 'Indisponible' : 'Réserver maintenant'}
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
