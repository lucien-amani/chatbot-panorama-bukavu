import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle, Bed, User, Loader2, AlertTriangle,
  Phone, FileText, Globe, MapPin, Info, ShieldCheck
} from 'lucide-react';
import { chambresApi, reservationsApi, profilApi } from '../lib/api';
import DateRangePicker from '../components/DateRangePicker';

const STEPS = ['Séjour', 'Profil', 'Confirmation'];

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, i) => (
        <div key={step} className={`step-item ${i < current ? 'done' : i === current ? 'active' : ''}`}>
          <div className="step-circle">{i < current ? '✓' : i + 1}</div>
          <div className="step-label">{step}</div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

export default function BookingPage() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [litSup, setLitSup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [profilExistant, setProfilExistant] = useState(null);
  const [profilLoading, setProfilLoading] = useState(true);

  const locationState = location.state || {};
  const typeNom = locationState.type_nom || 'Chambre Standard';
  const prixBase = locationState.prix || 85;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkin, setCheckin] = useState(locationState.date_arrivee || today);
  const [checkout, setCheckout] = useState(locationState.date_depart || tomorrow);
  const [voyageurs, setVoyageurs] = useState(2);
  const [demandesSpeciales, setDemandesSpeciales] = useState('');
  const [profil, setProfil] = useState({
    telephone: '', typeDoc: 'passeport', numeroDoc: '', nationalite: '', paysResidence: 'RDC'
  });

  const nuits = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000));
  const prixNuit = prixBase + (litSup ? 15 : 0);
  const total = prixNuit * nuits;

  // Charger le profil existant
  useEffect(() => {
    profilApi.get()
      .then(p => {
        if (p) {
          setProfilExistant(p);
          setProfil({
            telephone: p.telephone || '',
            typeDoc: p.type_document_identite || 'passeport',
            numeroDoc: p.numero_document_identite || '',
            nationalite: p.nationalite || '',
            paysResidence: p.pays_residence || 'RDC',
          });
        }
      })
      .catch(() => {})
      .finally(() => setProfilLoading(false));
  }, []);

  const handleSejourNext = () => {
    // Si profil déjà complet, sauter l'étape profil
    if (profilExistant && profilExistant.telephone && profilExistant.numero_document_identite) {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleProfilNext = async (e) => {
    e.preventDefault();
    // Sauvegarder le profil en BD
    try {
      await profilApi.sauvegarder({
        telephone: profil.telephone,
        type_document_identite: profil.typeDoc,
        numero_document_identite: profil.numeroDoc,
        nationalite: profil.nationalite,
        pays_residence: profil.paysResidence,
      });
      setProfilExistant({ ...profil });
    } catch (err) {
      console.warn('Profil non sauvegardé:', err.message);
    }
    setStep(2);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const disponibles = await chambresApi.disponibles({
        date_arrivee: checkin,
        date_depart: checkout,
        type: locationState.type_nom,
      });
      const typeData = disponibles.types?.[0];
      if (!typeData || typeData.chambres_disponibles === 0) {
        throw new Error('Aucune chambre disponible pour ces dates. Veuillez choisir d\'autres dates.');
      }
      const chambres = await chambresApi.liste();
      const chambreLibre = chambres.find(c =>
        c.type_chambre_id === typeData.type_id && c.statut === 'disponible'
      );
      if (!chambreLibre) throw new Error('Chambre introuvable.');

      const resa = await reservationsApi.creer({
        chambre_id: chambreLibre.id,
        date_arrivee: checkin,
        date_depart: checkout,
        nombre_voyageurs: voyageurs,
        demandes_speciales: demandesSpeciales || null,
        lit_supplementaire: litSup,
      });
      setConfirmedReservation(resa);
      setStep(3);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation ──
  if (step === 3) {
    return (
      <div className="booking-page">
        <div className="booking-confirmation">
          <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={80} strokeWidth={1.5} />
          </div>
          <h1>Réservation Confirmée !</h1>
          <p>Merci <strong>{user?.nom_affiche}</strong>, votre réservation est bien enregistrée.</p>
          <p className="conf-note" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            Elle est en attente de confirmation par notre équipe. Vous recevrez une notification dès qu'elle sera validée.
          </p>
          <div className="conf-details">
            <div className="conf-row"><span>Chambre</span><strong>{typeNom}</strong></div>
            <div className="conf-row"><span>Arrivée</span><strong>{new Date(checkin + 'T00:00:00').toLocaleDateString('fr-FR')}</strong></div>
            <div className="conf-row"><span>Départ</span><strong>{new Date(checkout + 'T00:00:00').toLocaleDateString('fr-FR')}</strong></div>
            <div className="conf-row"><span>Nuits</span><strong>{nuits}</strong></div>
            <div className="conf-row total"><span>Total</span><strong>${confirmedReservation?.montant_total || total}</strong></div>
          </div>
          <p className="conf-note">Référence : <code>{confirmedReservation?.id?.slice(0, 8).toUpperCase()}</code></p>
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
        {/* LEFT */}
        <div className="booking-main">

          {/* STEP 0 : Séjour */}
          {step === 0 && (
            <div className="booking-step-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bed size={20} /><span>Détails du séjour</span>
              </h2>

              {/* DateRangePicker moderne */}
              <div className="form-field full" style={{ marginBottom: '16px' }}>
                <label>Dates d'arrivée et de départ</label>
                <div style={{ marginTop: '6px' }}>
                  <DateRangePicker
                    startDate={checkin}
                    endDate={checkout}
                    onStartChange={setCheckin}
                    onEndChange={setCheckout}
                    minDate={today}
                  />
                </div>
                {checkin && checkout && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Durée : <strong style={{ color: 'var(--text-main)' }}>{nuits} nuit{nuits > 1 ? 's' : ''}</strong>
                  </p>
                )}
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
                  placeholder="Chambre haute, vue lac, arrivée tardive…" />
              </div>
              <button className="btn-primary step-next" onClick={handleSejourNext}
                disabled={!checkin || !checkout}>
                Continuer → {profilExistant?.telephone ? 'Confirmation' : 'Profil'}
              </button>
            </div>
          )}

          {/* STEP 1 : Profil */}
          {step === 1 && (
            <form className="booking-step-card" onSubmit={handleProfilNext}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} /><span>Informations d'identité</span>
              </h2>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: 'rgba(197,168,128,0.08)', border: '1px solid rgba(197,168,128,0.2)',
                borderRadius: '12px', padding: '12px 14px', marginBottom: '20px'
              }}>
                <Info size={16} style={{ color: 'var(--accent-color)', marginTop: '1px', shrink: 0 }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Ces informations sont requises pour valider votre réservation (réglementation hôtelière RDC). 
                  Elles seront <strong style={{ color: 'var(--text-main)' }}>sauvegardées</strong> pour vos prochaines réservations.
                </p>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label><Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />Téléphone *</label>
                  <input type="tel" required placeholder="+243 XXX XXX XXX"
                    value={profil.telephone} onChange={e => setProfil({...profil, telephone: e.target.value})} />
                </div>
                <div className="form-field">
                  <label><Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />Nationalité *</label>
                  <input type="text" required placeholder="ex: Congolaise"
                    value={profil.nationalite} onChange={e => setProfil({...profil, nationalite: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label><FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />Type de document *</label>
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
                <label><MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />Pays de résidence *</label>
                <input type="text" required placeholder="ex: République Démocratique du Congo"
                  value={profil.paysResidence} onChange={e => setProfil({...profil, paysResidence: e.target.value})} />
              </div>
              <div className="step-btns">
                <button type="button" className="btn-ghost" onClick={() => setStep(0)}>← Retour</button>
                <button type="submit" className="btn-primary">Continuer → Confirmation</button>
              </div>
            </form>
          )}

          {/* STEP 2 : Confirmation */}
          {step === 2 && (
            <form className="booking-step-card" onSubmit={handleConfirm}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} /><span>Confirmer la réservation</span>
              </h2>

              {/* Récap profil */}
              {profilExistant?.telephone && (
                <div style={{
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '12px', padding: '14px 16px', marginBottom: '20px'
                }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} /> Identité enregistrée
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <span>📞 {profilExistant.telephone || profil.telephone}</span>
                    <span>🌍 {profilExistant.nationalite || profil.nationalite}</span>
                    <span>📄 {(profilExistant.type_document_identite || profil.typeDoc) === 'passeport' ? 'Passeport' : 'CNI'}</span>
                    <span>🔢 {profilExistant.numero_document_identite || profil.numeroDoc}</span>
                  </div>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Modifier mes informations
                  </button>
                </div>
              )}

              <div style={{
                background: 'rgba(197,168,128,0.06)', border: '1px solid rgba(197,168,128,0.15)',
                borderRadius: '12px', padding: '16px', marginBottom: '20px'
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  En confirmant, votre réservation sera soumise à notre équipe pour validation. 
                  La chambre vous sera attribuée et votre paiement sera traité à l'hôtel lors de votre arrivée.
                </p>
              </div>

              <div className="step-btns">
                {submitError && (
                  <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', width: '100%', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} /><span>{submitError}</span>
                  </div>
                )}
                <button type="button" className="btn-ghost" onClick={() => setStep(profilExistant?.telephone ? 0 : 1)}>← Retour</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />En cours...</span>
                    : `✓ Confirmer ma réservation — $${total}`}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div className="booking-summary">
          <h3>Récapitulatif</h3>
          <div className="summary-room-badge">{typeNom}</div>
          <div className="summary-rows">
            <div className="summary-row"><span>Arrivée</span><strong>{checkin ? new Date(checkin + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}</strong></div>
            <div className="summary-row"><span>Départ</span><strong>{checkout ? new Date(checkout + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}</strong></div>
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
          {profilExistant?.telephone && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              ✓ Profil complet — infos pré-remplies
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
