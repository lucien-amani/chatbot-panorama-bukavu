import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, RefreshCw, AlertCircle, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom]                   = useState('');
  const [error, setError]               = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [success, setSuccess]           = useState('');

  const generateSecurePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let p = '';
    for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
    setConfirmPassword(p);
    setShowPwd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      if (!email || !password) return setError('Veuillez remplir tous les champs.');
      const res = await login(email, password);
      if (res.success) {
        // Redirection selon le rôle
        const from = location.state?.from;
        if (res.user?.est_admin || (res.user === undefined)) {
          // Récupérer l'user depuis localStorage après login
          const stored = JSON.parse(localStorage.getItem('panorama_user') || '{}');
          navigate(stored?.est_admin ? '/admin' : from || '/', { replace: true });
        } else {
          navigate(from || '/', { replace: true });
        }
      } else {
        setError(res.error);
      }
    } else {
      if (!email || !password || !nom) return setError('Veuillez remplir tous les champs.');
      if (password !== confirmPassword)   return setError('Les mots de passe ne correspondent pas.');
      if (password.length < 8)            return setError('Le mot de passe doit contenir au moins 8 caractères.');
      const res = await register(email, password, nom);
      if (res.success) {
        setSuccess('Compte créé avec succès ! Bienvenue.');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setError(res.error);
      }
    }
  };

  const switchMode = () => { setIsLogin(v => !v); setError(''); setSuccess(''); };

  return (
    <div className="login-page">
      {/* ── Fond décoratif ── */}
      <div className="login-bg">
        <div className="login-bg-orb orb1" />
        <div className="login-bg-orb orb2" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-wrapper">
        {/* ── Panneau gauche — branding ── */}
        <div className="login-brand">
          <img src="/panorama.png" alt="Panorama" className="login-brand-logo" />
          <h1 className="login-brand-name">Hôtel Panorama</h1>
          <p className="login-brand-tagline">Bukavu, République Démocratique du Congo</p>
          <div className="login-brand-features">
            {['Réservations en ligne', 'Service room 24h/24', 'Vue panoramique Lac Kivu', 'Espace administration'].map(f => (
              <div key={f} className="login-feature-item">
                <span className="login-feature-dot" />
                {f}
              </div>
            ))}
          </div>
          <div className="login-brand-footer">
            © {new Date().getFullYear()} Panorama Bukavu — Tous droits réservés
          </div>
        </div>

        {/* ── Panneau droit — formulaire ── */}
        <div className="login-card">
          {/* Badge admin hint */}
          <div className="login-role-hint">
            <Shield size={13} />
            <span>Admins : connectez-vous avec votre email administrateur</span>
          </div>

          {/* Onglets */}
          <div className="login-tabs">
            <button className={`login-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
              Connexion
            </button>
            <button className={`login-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
              Créer un compte
            </button>
          </div>

          <div className="login-form-header">
            <h2>{isLogin ? 'Bon retour 👋' : 'Rejoindre Panorama'}</h2>
            <p>{isLogin ? 'Connectez-vous pour accéder à votre espace' : 'Créez votre compte client en quelques secondes'}</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="login-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="login-alert success">
              <Sparkles size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {!isLogin && (
              <div className="login-field">
                <label>Nom complet</label>
                <div className="login-input-wrap">
                  <User size={17} className="login-input-icon" />
                  <input
                    id="login-nom"
                    type="text"
                    placeholder="Jean-Paul Muteba"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="login-field">
              <label>Adresse email</label>
              <div className="login-input-wrap">
                <Mail size={17} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete={isLogin ? 'username' : 'email'}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-row">
                <label>Mot de passe</label>
                {isLogin && (
                  <button type="button" className="login-forgot">Mot de passe oublié ?</button>
                )}
              </div>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder={isLogin ? '••••••••' : 'Min. 8 caractères'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button type="button" className="login-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="login-field">
                  <label>Confirmer le mot de passe</label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" />
                    <input
                      id="login-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="login-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="button" className="login-suggest-pwd" onClick={generateSecurePassword}>
                  <RefreshCw size={13} />
                  Générer un mot de passe sécurisé
                </button>
              </>
            )}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading
                ? <><span className="login-spinner" /> Chargement…</>
                : isLogin ? 'Se connecter →' : 'Créer mon compte →'
              }
            </button>
          </form>

          <p className="login-switch">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button type="button" onClick={switchMode}>
              {isLogin ? "S'inscrire gratuitement" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
