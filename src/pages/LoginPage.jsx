import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');

  // Password suggestion
  const generateSecurePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let newPassword = "";
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!email || !password) return setError("Veuillez remplir tous les champs.");
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    } else {
      if (!email || !password || !nom) return setError("Veuillez remplir tous les champs.");
      if (password !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
      if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
      
      const res = await register(email, password, nom);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#0f172a' }}>
          {isLogin ? 'Connexion à Panorama' : 'Créer un compte'}
        </h1>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
              <input
                type="text"
                placeholder="Nom complet"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>

          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <CheckCircle2 size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>

              <button 
                type="button" 
                onClick={generateSecurePassword}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <RefreshCw size={14} /> Suggérer un mot de passe très sécurisé
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ marginTop: '0.5rem', background: '#0f172a', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '500', cursor: isLoading ? 'wait' : 'pointer', border: 'none' }}
          >
            {isLoading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
          {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '500', cursor: 'pointer', marginLeft: '0.25rem' }}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
