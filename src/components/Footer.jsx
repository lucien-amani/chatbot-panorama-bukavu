import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/panorama.png" alt="Bukavu Hotels" className="footer-logo" />
          <div>
            <div className="footer-brand-name">Bukavu Hotels</div>
            <div className="footer-brand-sub">Bukavu · Sud-Kivu · RDC</div>
          </div>
        </div>
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/chambres">Tous les Hôtels</Link>
            <Link to="/reservation">Réserver</Link>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <span>Restauration</span>
            <span>Room Service</span>
            <span>Navette</span>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <span>+243 XXX XXX XXX</span>
            <span>info@bukavu-hotels.com</span>
            <span>Av. du Lac Kivu, Bukavu</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Bukavu Hotels. Tous droits réservés.</span>
        <span className="footer-powered">Propulsé par <strong>Bukavu Hotels Assist</strong> Roland Munganga</span>
      </div>
    </footer>
  );
}
