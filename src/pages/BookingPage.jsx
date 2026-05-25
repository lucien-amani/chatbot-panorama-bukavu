import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Bed, User, CreditCard, Smartphone, Lock } from 'lucide-react';

const STEPS = ['Sélection', 'Profil', 'Paiement', 'Confirmation'];

const ROOM_PRICES = { 'standard': 85, 'vip-lac': 150, 'suite-junior': 220, 'suite-presidentielle': 350 };

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, i) => (
        <div key={step} className={`step-item ${i < current ? 'done' : i === current ? 'active' : ''}`}>
          <div className="step-circle">
            {i < current ? '✓' : i + 1}
          </div>
          <div className="step-label">{step}</div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [litSup, setLitSup] = useState(false);
  const [profilOk, setProfilOk] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const typeId = searchParams.get('typeId') || 'standard';
  const nomChambre = searchParams.get('nom') || 'Chambre Standard';
  const prixBase = ROOM_PRICES[typeId] || 85;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || today);
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || tomorrow);
  const [voyageurs, setVoyageurs] = useState(Number(searchParams.get('voyageurs')) || 2);
  const [demandesSpeciales, setDemandesSpeciales] = useState('');

  // Profile fields
  const [profil, setProfil] = useState({ telephone: '', typeDoc: 'passeport', numeroDoc: '', nationalite: '', paysResidence: 'RDC' });

  const nuits = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000));
  const prixNuit = prixBase + (litSup ? 15 : 0);
  const total = prixNuit * nuits;

  const handleProfil = (e) => {
    e.preventDefault();
    setProfilOk(true);
    setStep(2);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    setConfirmed(true);
    setStep(3);
  };

  if (step === 3) {
    return (
      <div className="booking-page">
        <div className="booking-confirmation">
          <div className="conf-icon" style={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={80} strokeWidth={1.5} />
          </div>
          <h1>Réservation Confirmée !</h1>
          <p>Merci <strong>{user?.nom_affiche}</strong>, votre réservation est bien enregistrée.</p>
          <div className="conf-details">
            <div className="conf-row"><span>Chambre</span><strong>{nomChambre}</strong></div>
            <div className="conf-row"><span>Arrivée</span><strong>{new Date(checkin).toLocaleDateString('fr-FR')}</strong></div>
            <div className="conf-row"><span>Départ</span><strong>{new Date(checkout).toLocaleDateString('fr-FR')}</strong></div>
            <div className="conf-row"><span>Nuits</span><strong>{nuits}</strong></div>
            <div className="conf-row total"><span>Total payé</span><strong>${total}</strong></div>
          </div>
          <p className="conf-note">Un email de confirmation sera envoyé à <strong>{user?.email}</strong>.</p>
          <div className="conf-actions">
            <button className="btn-primary" onClick={() => navigate('/mes-reservations')}>Mes Réservations</button>
            <button className="btn-ghost" onClick={() => navigate('/')}>Retour à l'accueil</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page-header">
        <h1>Réservation</h1>
        <p>Complétez les étapes ci-dessous pour finaliser votre séjour</p>
      </div>

      <StepIndicator current={step} />

      <div className="booking-layout">
        {/* ── LEFT: Step content ── */}
        <div className="booking-main">

          {/* STEP 0 : Sélection */}
          {step === 0 && (
            <div className="booking-step-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bed size={20} />
                <span>Détails du séjour</span>
              </h2>
              <div className="form-row">
                <div className="form-field">
                  <label>Date d'arrivée</label>
                  <input type="date" value={checkin} min={today} onChange={e => setCheckin(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Date de départ</label>
                  <input type="date" value={checkout} min={checkin} onChange={e => setCheckout(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Voyageurs</label>
                  <select value={voyageurs} onChange={e => setVoyageurs(Number(e.target.value))}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n} personne{n>1?'s':''}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Options</label>
                  <div className="checkbox-row">
                    <input type="checkbox" id="litsup" checked={litSup} onChange={e => setLitSup(e.target.checked)} />
                    <label htmlFor="litsup">Lit supplémentaire (+$15/nuit)</label>
                  </div>
                </div>
              </div>
              <div className="form-field full">
                <label>Demandes spéciales (optionnel)</label>
                <textarea rows={3} value={demandesSpeciales} onChange={e => setDemandesSpeciales(e.target.value)}
                  placeholder="Chambre haute, vue lac, arrivée tardive, allergie alimentaire…" />
              </div>
              <button className="btn-primary step-next" onClick={() => setStep(1)}>Continuer → Profil</button>
            </div>
          )}

          {/* STEP 1 : Profil */}
          {step === 1 && (
            <form className="booking-step-card" onSubmit={handleProfil}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} />
                <span>Informations d'identité</span>
              </h2>
              <p className="step-note">Ces informations sont requises pour valider votre réservation conformément aux réglementations hôtelières de la RDC.</p>
              <div className="form-row">
                <div className="form-field">
                  <label>Téléphone *</label>
                  <input type="tel" required placeholder="+243 XXX XXX XXX"
                    value={profil.telephone} onChange={e => setProfil({...profil, telephone: e.target.value})} />
                </div>
                <div className="form-field">
                  <label>Nationalité *</label>
                  <input type="text" required placeholder="ex: Congolaise"
                    value={profil.nationalite} onChange={e => setProfil({...profil, nationalite: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Type de document *</label>
                  <select value={profil.typeDoc} onChange={e => setProfil({...profil, typeDoc: e.target.value})}>
                    <option value="passeport">Passeport</option>
                    <option value="cni">Carte Nationale d'Identité</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Numéro du document *</label>
                  <input type="text" required placeholder="ex: CD12345678"
                    value={profil.numeroDoc} onChange={e => setProfil({...profil, numeroDoc: e.target.value})} />
                </div>
              </div>
              <div className="form-field full">
                <label>Pays de résidence *</label>
                <input type="text" required placeholder="ex: République Démocratique du Congo"
                  value={profil.paysResidence} onChange={e => setProfil({...profil, paysResidence: e.target.value})} />
              </div>
              <div className="step-btns">
                <button type="button" className="btn-ghost" onClick={() => setStep(0)}>← Retour</button>
                <button type="submit" className="btn-primary">Continuer → Paiement</button>
              </div>
            </form>
          )}

          {/* STEP 2 : Paiement */}
          {step === 2 && (
            <form className="booking-step-card" onSubmit={handleConfirm}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} />
                <span>Paiement sécurisé</span>
              </h2>
              <div className="payment-mock">
                <div className="payment-logos" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="pay-logo" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> VISA</span>
                  <span className="pay-logo" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> Mastercard</span>
                  <span className="pay-logo" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Smartphone size={14} /> M-Pesa</span>
                </div>
                <div className="form-field full">
                  <label>Numéro de carte</label>
                  <input type="text" placeholder="•••• •••• •••• ••••" maxLength={19} required />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Expiration</label>
                    <input type="text" placeholder="MM/AA" maxLength={5} required />
                  </div>
                  <div className="form-field">
                    <label>CVV</label>
                    <input type="text" placeholder="•••" maxLength={3} required />
                  </div>
                </div>
                <div className="payment-secure-note" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <Lock size={14} />
                  <span>Paiement sécurisé SSL 256-bit · Données chiffrées</span>
                </div>
              </div>
              <div className="step-btns">
                <button type="button" className="btn-ghost" onClick={() => setStep(1)}>← Retour</button>
                <button type="submit" className="btn-primary">Confirmer & Payer ${total}</button>
              </div>
            </form>
          )}
        </div>

        {/* ── RIGHT: Summary ── */}
        <div className="booking-summary">
          <h3>Récapitulatif</h3>
          <div className="summary-room-badge">{nomChambre}</div>
          <div className="summary-rows">
            <div className="summary-row"><span>Arrivée</span><strong>{new Date(checkin).toLocaleDateString('fr-FR')}</strong></div>
            <div className="summary-row"><span>Départ</span><strong>{new Date(checkout).toLocaleDateString('fr-FR')}</strong></div>
            <div className="summary-row"><span>Durée</span><strong>{nuits} nuit{nuits > 1 ? 's' : ''}</strong></div>
            <div className="summary-row"><span>Voyageurs</span><strong>{voyageurs}</strong></div>
            <div className="summary-row"><span>Prix/nuit</span><strong>${prixNuit}</strong></div>
            {litSup && <div className="summary-row"><span>Lit sup.</span><strong>+$15/nuit</strong></div>}
            <div className="summary-divider" />
            <div className="summary-row total"><span>Total</span><strong>${total}</strong></div>
          </div>
          <div className="summary-guest">
            <div className="sg-avatar">{user?.nom_affiche?.charAt(0)}</div>
            <div>
              <div className="sg-name">{user?.nom_affiche}</div>
              <div className="sg-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
