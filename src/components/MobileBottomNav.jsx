import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BedDouble, LogIn, CalendarCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Accueil', exact: true },
  { to: '/chambres', icon: BedDouble, label: 'Chambres' },
  { to: '/reservation', icon: CalendarCheck, label: 'Réserver', authRequired: true },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map(({ to, icon: Icon, label, exact, authRequired }) => {
        if (authRequired && !user) return null;
        return (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `mobile-bottom-nav__item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        );
      })}

      {/* Connexion ou Profil selon l'état auth */}
      {user ? (
        <NavLink
          to="/profil"
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${isActive ? 'active' : ''}`
          }
        >
          <User size={22} strokeWidth={1.8} />
          <span>Profil</span>
        </NavLink>
      ) : (
        <button
          className="mobile-bottom-nav__item"
          onClick={() => navigate('/login')}
        >
          <LogIn size={22} strokeWidth={1.8} />
          <span>Connexion</span>
        </button>
      )}
    </nav>
  );
}
