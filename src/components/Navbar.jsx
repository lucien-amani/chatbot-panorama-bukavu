import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MenuIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);
const XIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const NAV_LINKS = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/chambres', label: 'Chambres' },
  { to: '/mes-reservations', label: 'Mes Réservations', auth: true },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src="/panorama.png" alt="Hôtel Panorama" className="navbar-logo-img" />
            <span className="navbar-logo-text">
              <span className="navbar-logo-name">Hôtel Panorama</span>
              <span className="navbar-logo-sub">Bukavu · RDC</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            {NAV_LINKS.filter(l => !l.auth || user).map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="navbar-right">
            <Link to="/chambres" className="navbar-cta">
              Réserver
            </Link>

            {user ? (
              <div className="navbar-user-wrap">
                <button className="navbar-avatar-btn" onClick={() => setUserMenuOpen(o => !o)}>
                  {user.url_avatar
                    ? <img src={user.url_avatar} alt={user.nom_affiche} className="navbar-avatar" />
                    : <span className="navbar-avatar-initials">{user.nom_affiche?.charAt(0) || 'U'}</span>
                  }
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{user.nom_affiche}</strong>
                      <span>{user.email}</span>
                      {user.est_admin && <span className="badge-admin">Admin</span>}
                    </div>
                    <Link to="/profil" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Mon Profil</Link>
                    <Link to="/mes-reservations" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Mes Réservations</Link>
                    {user.est_admin && (
                      <Link to="/admin" className="user-dropdown-item admin-link" onClick={() => setUserMenuOpen(false)}>
                        Dashboard Admin
                      </Link>
                    )}
                    <button className="user-dropdown-item logout" onClick={() => { logout(); setUserMenuOpen(false); }}>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-btns">
                <Link to="/login" className="navbar-login-btn">Connexion</Link>
              </div>
            )}

            <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="navbar-mobile-menu">
            {NAV_LINKS.filter(l => !l.auth || user).map(link => (
              <NavLink key={link.to} to={link.to} end={link.exact}
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/login" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>Connexion</Link>
            )}
            {user && (
              <button className="navbar-mobile-link logout" onClick={() => { logout(); setMobileOpen(false); }}>Déconnexion</button>
            )}
          </div>
        )}
      </nav>
      <div className="navbar-spacer" />
    </>
  );
}
