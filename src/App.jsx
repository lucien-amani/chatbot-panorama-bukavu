import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import MobileBottomNav from './components/MobileBottomNav';
import LandingPage from './pages/LandingPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import MyReservationsPage from './pages/MyReservationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !user.est_admin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = window.location.pathname; // or useLocation
  return (
    <div className="site-root">
      <Routes>
        {/* === ROUTES PUBLIQUES (avec Layout Public) === */}
        <Route element={
          <>
            <Navbar />
            <main className="site-main"><Outlet /></main>
            <Footer />
            <ChatWidget />
            <MobileBottomNav />
          </>
        }>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chambres" element={<RoomsPage />} />
          <Route path="/reservation" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/mes-reservations" element={<ProtectedRoute><MyReservationsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* === ROUTE ADMIN (sans Layout Public) === */}
        <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
