import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/panorama.png" alt="Hôtel Panorama" className="footer-logo" />
          <div>
            <div className="footer-brand-name">Hôtel Panorama</div>
            <div className="footer-brand-sub">Bukavu · Sud-Kivu · RDC</div>
          </div>
        </div>
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/chambres">Nos Chambres</Link>
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
            <span>info@panorama-bukavu.com</span>
            <span>Av. du Lac Kivu, Bukavu</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Hôtel Panorama Bukavu. Tous droits réservés.</span>
        <span className="footer-powered">Propulsé par <strong>Panorama Assist</strong> ✦ Gemini AI</span>
      </div>
    </footer>
  );
}
