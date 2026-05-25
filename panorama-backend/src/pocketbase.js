/**
 * ============================================================
 *  panorama-backend/src/pocketbase.js
 *  Client PocketBase centralisé — Panorama Assist
 *  Hôtel Panorama · Bukavu, RDC
 * ============================================================
 *  Collections (noms en français) :
 *    utilisateurs, profils, types_chambres, chambres,
 *    reservations, lignes_reservation, plats, commandes,
 *    lignes_commande, journaux_chat, notifications
 * ============================================================
 */

import PocketBase from 'pocketbase';

// ── Initialisation ─────────────────────────────────────────
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Authentification admin pour les opérations serveur-side
pb.autoCancellation(false);

// ── Auth Admin (backend uniquement) ────────────────────────
export async function authentifierAdmin() {
  await pb.admins.authWithPassword(
    process.env.PB_ADMIN_EMAIL,
    process.env.PB_ADMIN_PASSWORD
  );
}

export { pb };

// ============================================================
//  1. UTILISATEURS
// ============================================================

/**
 * Créer ou retrouver un utilisateur via Google OAuth
 * @param {string} identifiantGoogle - ID Google (sub)
 * @param {string} email
 * @param {string} nomAffiche - Nom complet Google
 * @param {string} urlAvatar - Photo de profil Google
 */
export async function creerOuTrouverUtilisateur(identifiantGoogle, email, nomAffiche, urlAvatar) {
  try {
    // Rechercher par identifiant_google
    const resultats = await pb.collection('utilisateurs').getList(1, 1, {
      filter: `identifiant_google = "${identifiantGoogle}"`,
    });

    if (resultats.items.length > 0) {
      // Mettre à jour la dernière connexion
      const utilisateur = resultats.items[0];
      await pb.collection('utilisateurs').update(utilisateur.id, {
        derniere_connexion: new Date().toISOString(),
        url_avatar: urlAvatar,
      });
      return utilisateur;
    }

    // Créer un nouvel utilisateur
    return await pb.collection('utilisateurs').create({
      identifiant_google: identifiantGoogle,
      email,
      nom_affiche: nomAffiche,
      url_avatar: urlAvatar,
      est_admin: false,
      derniere_connexion: new Date().toISOString(),
    });
  } catch (erreur) {
    throw new Error(`Erreur création utilisateur : ${erreur.message}`);
  }
}

// ============================================================
//  2. PROFILS
// ============================================================

/**
 * Vérifier si un utilisateur a un profil complet
 * @param {string} utilisateurId
 * @returns {object|null} profil ou null
 */
export async function obtenirProfil(utilisateurId) {
  try {
    const resultats = await pb.collection('profils').getList(1, 1, {
      filter: `utilisateur_id = "${utilisateurId}"`,
    });
    return resultats.items[0] || null;
  } catch {
    return null;
  }
}

/**
 * Créer ou mettre à jour le profil d'un utilisateur
 */
export async function sauvegarderProfil(utilisateurId, donneesProfil) {
  const {
    telephone,
    typeDocumentIdentite, // 'passeport' | 'cni'
    numeroDocumentIdentite,
    nationalite,
    paysResidence,
  } = donneesProfil;

  const profilExistant = await obtenirProfil(utilisateurId);

  const donnees = {
    utilisateur_id: utilisateurId,
    telephone,
    type_document_identite: typeDocumentIdentite,
    numero_document_identite: numeroDocumentIdentite,
    nationalite,
    pays_residence: paysResidence,
  };

  if (profilExistant) {
    return await pb.collection('profils').update(profilExistant.id, donnees);
  }
  return await pb.collection('profils').create(donnees);
}

// ============================================================
//  3. CHAMBRES & DISPONIBILITÉ
// ============================================================

/**
 * Vérifier la disponibilité des chambres pour une période
 * @param {string} dateArrivee - ISO date (YYYY-MM-DD)
 * @param {string} dateDepart - ISO date (YYYY-MM-DD)
 * @param {string} [nomTypeChambres] - Filtre optionnel sur le type
 * @returns {Array} Types de chambres disponibles avec nombre de chambres libres
 */
export async function verifierDisponibilite(dateArrivee, dateDepart, nomTypeChambres = null) {
  // 1. Récupérer toutes les chambres (avec leur type)
  let filtreType = '';
  if (nomTypeChambres) {
    filtreType = `type_chambre_id.nom = "${nomTypeChambres}" &&`;
  }

  const chambres = await pb.collection('chambres').getFullList({
    filter: `${filtreType} statut != "maintenance"`,
    expand: 'type_chambre_id',
  });

  // 2. Trouver les chambres déjà réservées pour cette période
  const reservationsActives = await pb.collection('lignes_reservation').getFullList({
    filter: `
      reservation_id.statut != "annulee" &&
      reservation_id.statut != "terminee" &&
      reservation_id.date_arrivee < "${dateDepart}" &&
      reservation_id.date_depart > "${dateArrivee}"
    `,
    fields: 'chambre_id',
  });

  const chambresOccupees = new Set(reservationsActives.map((lr) => lr.chambre_id));

  // 3. Filtrer les chambres disponibles
  const chambresDisponibles = chambres.filter((c) => !chambresOccupees.has(c.id));

  // 4. Regrouper par type
  const parType = {};
  for (const chambre of chambresDisponibles) {
    const type = chambre.expand?.type_chambre_id;
    if (!type) continue;

    if (!parType[type.id]) {
      parType[type.id] = {
        typeId: type.id,
        nom: type.nom,
        description: type.description,
        prixBaseNuit: type.prix_base_nuit,
        capaciteAdultes: type.capacite_adultes,
        capaciteEnfants: type.capacite_enfants,
        equipements: type.equipements,
        chambresDisponibles: 0,
      };
    }
    parType[type.id].chambresDisponibles++;
  }

  return Object.values(parType);
}

// ============================================================
//  4. RÉSERVATIONS
// ============================================================

/**
 * Créer une réservation (vérifie le profil au préalable)
 */
export async function creerReservation(utilisateurId, donneesReservation) {
  const {
    typeChambresId,
    dateArrivee,
    dateDepart,
    nombreVoyageurs,
    demandesSpeciales,
    litSupplementaire = false,
  } = donneesReservation;

  // Vérification profil obligatoire
  const profil = await obtenirProfil(utilisateurId);
  if (!profil) {
    const erreur = new Error('Profil requis avant toute réservation.');
    erreur.code = 'PROFIL_REQUIS';
    erreur.statut = 403;
    throw erreur;
  }

  // Calculer le nombre de nuits
  const arrivee = new Date(dateArrivee);
  const depart = new Date(dateDepart);
  const nombreNuits = Math.ceil((depart - arrivee) / (1000 * 60 * 60 * 24));

  if (nombreNuits <= 0) {
    throw new Error('La date de départ doit être postérieure à la date d\'arrivée.');
  }

  // Trouver une chambre disponible du bon type
  const disponibilites = await verifierDisponibilite(dateArrivee, dateDepart, null);
  const typeChoisi = disponibilites.find((t) => t.typeId === typeChambresId);

  if (!typeChoisi || typeChoisi.chambresDisponibles === 0) {
    throw new Error('Aucune chambre disponible pour ces dates et ce type.');
  }

  // Récupérer la première chambre disponible
  const chambresLibres = await pb.collection('chambres').getList(1, 1, {
    filter: `type_chambre_id = "${typeChambresId}" && statut = "disponible"`,
  });

  if (chambresLibres.items.length === 0) {
    throw new Error('Chambre indisponible.');
  }

  const chambre = chambresLibres.items[0];
  const prixParNuit = typeChoisi.prixBaseNuit + (litSupplementaire ? 15 : 0);
  const montantTotal = prixParNuit * nombreNuits;

  // Créer la réservation principale
  const reservation = await pb.collection('reservations').create({
    utilisateur_id: utilisateurId,
    statut: 'en_attente',
    montant_total: montantTotal,
    date_arrivee: dateArrivee,
    date_depart: dateDepart,
    nombre_voyageurs: nombreVoyageurs,
    demandes_speciales: demandesSpeciales,
  });

  // Créer la ligne de réservation
  await pb.collection('lignes_reservation').create({
    reservation_id: reservation.id,
    chambre_id: chambre.id,
    prix_par_nuit: prixParNuit,
    lit_supplementaire: litSupplementaire,
  });

  return reservation;
}

/**
 * Obtenir les réservations d'un utilisateur
 */
export async function obtenirReservationsUtilisateur(utilisateurId) {
  return await pb.collection('reservations').getList(1, 50, {
    filter: `utilisateur_id = "${utilisateurId}"`,
    sort: '-created',
    expand: 'lignes_reservation(reservation_id).chambre_id.type_chambre_id',
  });
}

/**
 * Changer le statut d'une réservation (admin)
 * @param {string} reservationId
 * @param {string} nouveauStatut - 'confirmee'|'payee'|'en_sejour'|'terminee'|'annulee'
 */
export async function changerStatutReservation(reservationId, nouveauStatut) {
  const statutsValides = ['confirmee', 'payee', 'en_sejour', 'terminee', 'annulee'];
  if (!statutsValides.includes(nouveauStatut)) {
    throw new Error(`Statut invalide : ${nouveauStatut}`);
  }

  const reservation = await pb.collection('reservations').update(reservationId, {
    statut: nouveauStatut,
  });

  // Mettre à jour le statut des chambres si check-in / check-out
  if (nouveauStatut === 'en_sejour') {
    const lignes = await pb.collection('lignes_reservation').getFullList({
      filter: `reservation_id = "${reservationId}"`,
    });
    for (const ligne of lignes) {
      await pb.collection('chambres').update(ligne.chambre_id, { statut: 'occupee' });
    }
  }

  if (nouveauStatut === 'terminee') {
    const lignes = await pb.collection('lignes_reservation').getFullList({
      filter: `reservation_id = "${reservationId}"`,
    });
    for (const ligne of lignes) {
      await pb.collection('chambres').update(ligne.chambre_id, { statut: 'nettoyage' });
    }
    // Créer une notification de nettoyage
    for (const ligne of lignes) {
      await pb.collection('notifications').create({
        reservation_id: reservationId,
        type: 'nettoyage_chambre',
        message: `Chambre à nettoyer après départ — Réservation ${reservationId.slice(0, 8)}`,
        est_lue: false,
      });
    }
  }

  return reservation;
}

// ============================================================
//  5. COMMANDES
// ============================================================

/**
 * Créer une commande (vérifie le séjour actif)
 */
export async function creerCommande(utilisateurId, donneesCommande) {
  const { typeCommande, articles = [], notes, chambreId } = donneesCommande;

  // Vérifier séjour actif pour les commandes en chambre
  const sejours = await pb.collection('reservations').getList(1, 1, {
    filter: `utilisateur_id = "${utilisateurId}" && statut = "en_sejour"`,
  });

  if (sejours.items.length === 0) {
    throw new Error('Aucun séjour actif. La commande nécessite un check-in effectué.');
  }

  const sejourActif = sejours.items[0];

  // Calculer le total
  const montantTotal = articles.reduce((total, article) => {
    return total + article.prix_unitaire * article.quantite;
  }, 0);

  // Créer la commande principale
  const commande = await pb.collection('commandes').create({
    utilisateur_id: utilisateurId,
    reservation_id: sejourActif.id,
    chambre_id: chambreId || null,
    type_commande: typeCommande,
    statut: 'en_attente',
    montant_total: montantTotal,
    notes,
  });

  // Créer les lignes de commande
  for (const article of articles) {
    await pb.collection('lignes_commande').create({
      commande_id: commande.id,
      type_article: article.typeArticle,   // 'plat' | 'boisson' | 'autre'
      plat_id: article.platId || null,
      nom_article: article.nomArticle,
      quantite: article.quantite,
      prix_unitaire: article.prixUnitaire,
      instructions_speciales: article.instructionsSpeciales || '',
    });
  }

  // Notification pour la cuisine / le personnel
  await pb.collection('notifications').create({
    commande_id: commande.id,
    type: 'nouvelle_commande',
    message: `Nouvelle commande ${typeCommande} — Chambre ${chambreId || 'N/A'}`,
    est_lue: false,
  });

  return commande;
}

/**
 * Obtenir le statut d'une commande
 */
export async function obtenirStatutCommande(commandeId) {
  return await pb.collection('commandes').getOne(commandeId, {
    expand: 'lignes_commande(commande_id).plat_id',
  });
}

/**
 * Mettre à jour le statut d'une commande (personnel)
 */
export async function changerStatutCommande(commandeId, nouveauStatut) {
  const commande = await pb.collection('commandes').update(commandeId, {
    statut: nouveauStatut,
  });

  // Notifier si prête
  if (nouveauStatut === 'prete') {
    await pb.collection('notifications').create({
      commande_id: commandeId,
      type: 'commande_prete',
      message: `Commande ${commandeId.slice(0, 8)} prête à être livrée.`,
      est_lue: false,
    });
  }

  return commande;
}

// ============================================================
//  6. JOURNAUX DE CHAT
// ============================================================

/**
 * Sauvegarder un message dans le journal
 * @param {string|null} utilisateurId - null pour visiteur anonyme
 * @param {string} sessionId
 * @param {'utilisateur'|'assistant'|'fonction'} role
 * @param {string} contenu
 * @param {string|null} nomFonction - Si appel de fonction Gemini
 */
export async function sauvegarderMessageChat(utilisateurId, sessionId, role, contenu, nomFonction = null) {
  return await pb.collection('journaux_chat').create({
    utilisateur_id: utilisateurId || null,
    session_id: sessionId,
    role,
    contenu: typeof contenu === 'object' ? JSON.stringify(contenu) : contenu,
    nom_fonction: nomFonction,
  });
}

/**
 * Récupérer l'historique d'une session
 * @param {string} sessionId
 * @param {number} limite - Nombre de messages à récupérer
 */
export async function obtenirHistoriqueSession(sessionId, limite = 20) {
  const resultats = await pb.collection('journaux_chat').getList(1, limite, {
    filter: `session_id = "${sessionId}"`,
    sort: 'created',
  });
  return resultats.items;
}

// ============================================================
//  7. CATALOGUE DE PLATS
// ============================================================

/**
 * Obtenir le catalogue complet des plats disponibles
 */
export async function obtenirCataloguePlats(categorie = null) {
  const filtre = categorie
    ? `disponible = true && categorie = "${categorie}"`
    : 'disponible = true';

  return await pb.collection('plats').getFullList({
    filter: filtre,
    sort: 'categorie,nom',
  });
}

// ============================================================
//  8. NOTIFICATIONS (admin/personnel)
// ============================================================

/**
 * Obtenir les notifications non lues (dashboard admin)
 */
export async function obtenirNotificationsNonLues() {
  return await pb.collection('notifications').getList(1, 50, {
    filter: 'est_lue = false',
    sort: '-created',
    expand: 'commande_id,reservation_id',
  });
}

/**
 * Marquer une notification comme lue
 */
export async function marquerNotificationLue(notificationId) {
  return await pb.collection('notifications').update(notificationId, {
    est_lue: true,
  });
}
