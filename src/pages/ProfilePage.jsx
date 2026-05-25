import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    telephone: '', typeDoc: 'passeport', numeroDoc: '',
    nationalite: 'Congolaise', paysResidence: 'République Démocratique du Congo',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-content">
      <div className="page-hero-sm mini">
        <div className="page-hero-sm-overlay" />
        <div className="page-hero-sm-content">
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles</p>
        </div>
      </div>
      <div className="profile-layout">
        {/* Left: Identity card */}
        <div className="profile-card-col">
          <div className="profile-identity-card">
            <div className="profile-avatar">
              {user?.url_avatar
                ? <img src={user.url_avatar} alt={user.nom_affiche} />
                : <div className="profile-avatar-initials">{user?.nom_affiche?.charAt(0) || 'U'}</div>
              }
            </div>
            <h2 className="profile-name">{user?.nom_affiche}</h2>
            <p className="profile-email">{user?.email}</p>
            {user?.est_admin && <span className="badge-admin">Administrateur</span>}
            <div className="profile-stats">
              <div className="ps-item"><div className="ps-num">3</div><div className="ps-label">Séjours</div></div>
              <div className="ps-item"><div className="ps-num">2</div><div className="ps-label">Commandes</div></div>
              <div className="ps-item"><div className="ps-num">2024</div><div className="ps-label">Membre depuis</div></div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="profile-form-col">
          <form className="profile-form-card" onSubmit={handleSubmit}>
            <h2>Informations d'Identité</h2>
            <p className="form-note">Ces informations sont obligatoires pour toute réservation à l'Hôtel Panorama.</p>

            {saved && (
              <div className="success-banner">✓ Profil enregistré avec succès !</div>
            )}

            <div className="form-row">
              <div className="form-field">
                <label>Téléphone *</label>
                <input type="tel" required placeholder="+243 XXX XXX XXX"
                  value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Nationalité *</label>
                <input type="text" required placeholder="ex: Congolaise"
                  value={form.nationalite} onChange={e => setForm({...form, nationalite: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Type de document *</label>
                <select value={form.typeDoc} onChange={e => setForm({...form, typeDoc: e.target.value})}>
                  <option value="passeport">Passeport</option>
                  <option value="cni">Carte Nationale d'Identité</option>
                </select>
              </div>
              <div className="form-field">
                <label>Numéro du document *</label>
                <input type="text" required placeholder="ex: CD12345678"
                  value={form.numeroDoc} onChange={e => setForm({...form, numeroDoc: e.target.value})} />
              </div>
            </div>

            <div className="form-field full">
              <label>Pays de résidence *</label>
              <input type="text" required
                value={form.paysResidence} onChange={e => setForm({...form, paysResidence: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary">Enregistrer le profil</button>
          </form>
        </div>
      </div>
    </div>
  );
}
