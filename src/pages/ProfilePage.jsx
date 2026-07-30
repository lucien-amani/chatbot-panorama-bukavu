import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profilApi } from '../lib/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedAccount, setSavedAccount] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [accountForm, setAccountForm] = useState({
    nom_affiche: '',
    email: '',
    url_avatar: '',
    password: '',
  });

  const [identityForm, setIdentityForm] = useState({
    telephone: '',
    typeDoc: 'passeport',
    numeroDoc: '',
    nationalite: 'Congolaise',
    paysResidence: 'République Démocratique du Congo',
  });

  useEffect(() => {
    if (user) {
      setAccountForm({
        nom_affiche: user.nom_affiche || '',
        email: user.email || '',
        url_avatar: user.url_avatar || '',
        password: '',
      });
    }

    // Load identity profile
    profilApi.get()
      .then(data => {
        if (data) {
          setIdentityForm({
            telephone: data.telephone || '',
            typeDoc: data.type_document_identite || 'passeport',
            numeroDoc: data.numero_document_identite || '',
            nationalite: data.nationalite || 'Congolaise',
            paysResidence: data.pays_residence || 'République Démocratique du Congo',
          });
        }
      })
      .catch(err => console.error('Erreur chargement profil:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("L'image est trop volumineuse (max 2 Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountForm(prev => ({ ...prev, url_avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedAccount(false);
    try {
      const token = localStorage.getItem('panorama_token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom_affiche: accountForm.nom_affiche,
          email: accountForm.email,
          url_avatar: accountForm.url_avatar,
          password: accountForm.password || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification du compte');

      updateUser(data.user);
      setAccountForm(prev => ({ ...prev, password: '' }));
      setSavedAccount(true);
      setTimeout(() => setSavedAccount(false), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedIdentity(false);
    try {
      await profilApi.sauvegarder({
        telephone: identityForm.telephone,
        type_document_identite: identityForm.typeDoc,
        numero_document_identite: identityForm.numeroDoc,
        nationalite: identityForm.nationalite,
        pays_residence: identityForm.paysResidence
      });
      setSavedIdentity(true);
      setTimeout(() => setSavedIdentity(false), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-color)]" />
      </div>
    );
  }

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <div className="page-hero-sm mini mb-8">
        <div className="page-hero-sm-overlay" />
        <div className="page-hero-sm-content">
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles et les paramètres de votre compte</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="profile-layout flex flex-col lg:flex-row gap-8">
        {/* Left: Identity card */}
        <div className="profile-card-col lg:w-1/3">
          <div className="profile-identity-card bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl p-6 text-center sticky top-24">
            <div className="profile-avatar w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[var(--accent-color)] flex items-center justify-center bg-[var(--surface-hover)]">
              {user?.url_avatar ? (
                <img src={user.url_avatar} alt={user.nom_affiche} className="w-full h-full object-cover" />
              ) : (
                <div className="text-3xl font-bold text-[var(--accent-color)]">{user?.nom_affiche?.charAt(0) || 'U'}</div>
              )}
            </div>
            <h2 className="profile-name text-xl font-bold text-[var(--text-main)] mb-1">{user?.nom_affiche}</h2>
            <p className="profile-email text-sm text-[var(--text-muted)] mb-3">{user?.email}</p>
            
            {user?.est_admin ? (
              <span className="inline-block bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                Administrateur
              </span>
            ) : (
              <span className="inline-block bg-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold px-3 py-1 rounded-full mb-6">
                Client
              </span>
            )}

            {!user?.est_admin && (
              <div className="profile-stats grid grid-cols-3 gap-2 border-t border-[var(--border-color)] pt-6">
                <div className="ps-item"><div className="ps-num text-lg font-bold text-[var(--text-main)]">3</div><div className="ps-label text-xs text-[var(--text-muted)]">Séjours</div></div>
                <div className="ps-item"><div className="ps-num text-lg font-bold text-[var(--text-main)]">2</div><div className="ps-label text-xs text-[var(--text-muted)]">Commandes</div></div>
                <div className="ps-item"><div className="ps-num text-lg font-bold text-[var(--text-main)]">2024</div><div className="ps-label text-xs text-[var(--text-muted)]">Membre</div></div>
              </div>
            )}
            {user?.est_admin && (
              <div className="profile-stats border-t border-[var(--border-color)] pt-6 text-sm text-[var(--text-muted)]">
                Accès complet à la gestion hôtelière et à la configuration du chatbot.
              </div>
            )}
          </div>
        </div>

        {/* Right: Forms */}
        <div className="profile-form-col lg:w-2/3 flex flex-col gap-8">
          {/* Card 1: Account Settings */}
          <form className="profile-form-card bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-6" onSubmit={handleAccountSubmit}>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">Informations de Compte</h2>
              <p className="text-sm text-[var(--text-muted)]">Modifiez vos identifiants d'accès et votre photo de profil</p>
            </div>

            {savedAccount && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
                ✓ Paramètres du compte mis à jour avec succès !
              </div>
            )}

            <div className="form-row flex flex-col md:flex-row gap-4">
              <div className="form-field flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-main)]">Nom complet *</label>
                <input type="text" required placeholder="ex: Lucien Amani"
                  className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  value={accountForm.nom_affiche} onChange={e => setAccountForm({...accountForm, nom_affiche: e.target.value})} />
              </div>
              <div className="form-field flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-main)]">Adresse e-mail *</label>
                <input type="email" required placeholder="ex: lucien@hotelpanorama.com"
                  className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  value={accountForm.email} onChange={e => setAccountForm({...accountForm, email: e.target.value})} />
              </div>
            </div>

            <div className="form-field flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Nouveau mot de passe (laisser vide pour ne pas modifier)</label>
              <input type="password" placeholder="Saisir un nouveau mot de passe"
                className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} />
            </div>

            {/* Avatar section */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[var(--text-main)]">Photo de profil / Avatar</label>
              
              {/* Preset selectors */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">Choisissez un avatar par défaut :</span>
                <div className="flex gap-3 items-center">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, url_avatar: url })}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        accountForm.url_avatar === url ? 'border-[var(--accent-color)] scale-110 shadow-md' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload file or paste URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--text-muted)] font-medium">Importer un fichier image :</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent-color)]/10 file:text-[var(--accent-color)] hover:file:bg-[var(--accent-color)]/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--text-muted)] font-medium">Ou coller l'URL d'une image :</span>
                  <input
                    type="text"
                    placeholder="https://exemple.com/image.png"
                    value={accountForm.url_avatar.startsWith('data:') ? '' : accountForm.url_avatar}
                    onChange={e => setAccountForm({ ...accountForm, url_avatar: e.target.value })}
                    className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)] font-semibold px-6 py-3 rounded-xl transition-all self-start shadow-md text-sm">
              Enregistrer le compte
            </button>
          </form>

          {/* Card 2: Identity Settings (Only for Clients, or optional for admin if they want to edit it) */}
          {(!user?.est_admin) ? (
            <form className="profile-form-card bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-6" onSubmit={handleIdentitySubmit}>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">Informations d'Identité</h2>
                <p className="text-sm text-[var(--text-muted)]">Ces informations sont obligatoires pour effectuer des séjours dans les Hôtels de Bukavu.</p>
              </div>

              {savedIdentity && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
                  ✓ Informations d'identité enregistrées avec succès !
                </div>
              )}

              <div className="form-row flex flex-col md:flex-row gap-4">
                <div className="form-field flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-main)]">Téléphone *</label>
                  <input type="tel" required placeholder="+243 XXX XXX XXX"
                    className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    value={identityForm.telephone} onChange={e => setIdentityForm({...identityForm, telephone: e.target.value})} />
                </div>
                <div className="form-field flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-main)]">Nationalité *</label>
                  <input type="text" required placeholder="ex: Congolaise"
                    className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    value={identityForm.nationalite} onChange={e => setIdentityForm({...identityForm, nationalite: e.target.value})} />
                </div>
              </div>

              <div className="form-row flex flex-col md:flex-row gap-4">
                <div className="form-field flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-main)]">Type de document *</label>
                  <select
                    className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors cursor-pointer"
                    value={identityForm.typeDoc} onChange={e => setIdentityForm({...identityForm, typeDoc: e.target.value})}
                  >
                    <option value="passeport">Passeport</option>
                    <option value="cni">Carte Nationale d'Identité</option>
                  </select>
                </div>
                <div className="form-field flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-main)]">Numéro du document *</label>
                  <input type="text" required placeholder="ex: CD12345678"
                    className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    value={identityForm.numeroDoc} onChange={e => setIdentityForm({...identityForm, numeroDoc: e.target.value})} />
                </div>
              </div>

              <div className="form-field flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-main)]">Pays de résidence *</label>
                <input type="text" required
                  className="bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  value={identityForm.paysResidence} onChange={e => setIdentityForm({...identityForm, paysResidence: e.target.value})} />
              </div>

              <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)] font-semibold px-6 py-3 rounded-xl transition-all self-start shadow-md text-sm">
                Enregistrer l'identité
              </button>
            </form>
          ) : (
            <div className="bg-[var(--surface-app)] border border-[var(--border-color)] rounded-2xl p-6 text-sm text-[var(--text-muted)]">
              💡 Les administrateurs n'ont pas besoin d'enregistrer de documents d'identité pour utiliser le système.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
