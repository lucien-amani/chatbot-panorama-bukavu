import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: 'var(--accent-color)' }}><Waves size={80} strokeWidth={1.5} /></div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Page introuvable</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  );
}
