const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();




const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Importation de la liste des hôtels
const hotelsData = require('../../hotels.json');

// Utilitaire pour obtenir le hotel_slug associé à un admin connecté
function getHotelSlugForUser(email) {
  if (!email || email === 'okokaroland@gmail.com') return null;
  // Rechercher l'hôtel par son nom exact ou son slug
  const hotel = hotelsData.hotels.find(
    h => h.name.toLowerCase() === email.toLowerCase() || h.slug.toLowerCase() === email.toLowerCase()
  );
  return hotel ? hotel.slug : null;
}

// ── Middlewares ───────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Middleware auth JWT ───────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant.' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user?.est_admin) return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    next();
  });
}

// ============================================================
//  AUTH
// ============================================================

app.get('/api/setup-admin', async (req, res) => {
  try {
    const email = 'okokaroland@gmail.com';
    const password = 'okokaroland@gmail.com';
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const user = await prisma.utilisateur.upsert({
      where: { email },
      update: { password_hash, est_admin: true, nom_affiche: 'Roland Okoko (Super Admin)' },
      create: { email, password_hash, nom_affiche: 'Roland Okoko (Super Admin)', est_admin: true },
    });
    const { password_hash: _, ...userData } = user;
    res.json({ message: 'Super-Admin configuré !', user: userData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, nom_affiche } = req.body;
  try {
    if (await prisma.utilisateur.findUnique({ where: { email } })) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }
    const password_hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const newUser = await prisma.utilisateur.create({
      data: { email, password_hash, nom_affiche, est_admin: false },
    });
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, est_admin: newUser.est_admin },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    const { password_hash: _, ...userData } = newUser;
    res.json({ token, user: userData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, est_admin: user.est_admin },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    const { password_hash: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { nom_affiche, email, url_avatar, password } = req.body;
  try {
    const data = {};
    if (nom_affiche !== undefined) data.nom_affiche = nom_affiche;
    if (email !== undefined) {
      const existing = await prisma.utilisateur.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
      }
      data.email = email;
    }
    if (url_avatar !== undefined) data.url_avatar = url_avatar;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      data.password_hash = bcrypt.hashSync(password, salt);
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: req.user.id },
      data,
    });

    const { password_hash: _, ...userData } = updatedUser;
    res.json({ user: userData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  DASHBOARD STATS (Admin)
// ============================================================

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const hotelSlug = getHotelSlugForUser(req.user?.email);

    const now = new Date();
    const debut_mois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debut_mois_prec = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fin_mois_prec = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filtres
    const chambresFilter = hotelSlug ? { hotel_slug: hotelSlug } : {};
    const reservationsFilter = hotelSlug ? { hotel_slug: hotelSlug } : {};
    const commandesFilter = hotelSlug ? { hotel_slug: hotelSlug } : {};

    const [
      totalChambres,
      chambresDisponibles,
      reservationsActives,
      arrivéesAujourdhui,
      commandesEnCours,
      commandesEnPreparation,
      caMois,
      caMoisPrec,
      notificationsNonLues,
    ] = await Promise.all([
      prisma.chambre.count({ where: chambresFilter }),
      prisma.chambre.count({ where: { ...chambresFilter, statut: 'disponible' } }),
      prisma.reservation.count({ where: { ...reservationsFilter, statut: { in: ['confirmee', 'payee', 'en_sejour', 'en_attente'] } } }),
      prisma.reservation.count({
        where: {
          ...reservationsFilter,
          date_arrivee: { gte: new Date(now.toDateString()), lt: new Date(new Date(now.toDateString()).getTime() + 86400000) },
          statut: { in: ['confirmee', 'payee'] },
        },
      }),
      prisma.commande.count({ where: { ...commandesFilter, statut: { in: ['en_attente', 'en_preparation', 'prete'] } } }),
      prisma.commande.count({ where: { ...commandesFilter, statut: 'en_preparation' } }),
      prisma.reservation.aggregate({
        where: { ...reservationsFilter, created_at: { gte: debut_mois }, statut: { not: 'annulee' } },
        _sum: { montant_total: true },
      }),
      prisma.reservation.aggregate({
        where: { ...reservationsFilter, created_at: { gte: debut_mois_prec, lte: fin_mois_prec }, statut: { not: 'annulee' } },
        _sum: { montant_total: true },
      }),
      prisma.notification.count({
        where: {
          est_lue: false,
          ...(hotelSlug ? {
            OR: [
              { reservation: { hotel_slug: hotelSlug } },
              { commande: { hotel_slug: hotelSlug } }
            ]
          } : {})
        }
      }),
    ]);

    const caMoisVal = caMois._sum.montant_total || 0;
    const caMoisPrecVal = caMoisPrec._sum.montant_total || 0;
    const evolutionCA = caMoisPrecVal > 0
      ? Math.round(((caMoisVal - caMoisPrecVal) / caMoisPrecVal) * 100)
      : 0;

    res.json({
      chambres: { total: totalChambres, disponibles: chambresDisponibles },
      reservations: { actives: reservationsActives, arrivees_aujourd_hui: arrivéesAujourdhui },
      commandes: { en_cours: commandesEnCours, en_preparation: commandesEnPreparation },
      ca: { mois: caMoisVal, evolution: evolutionCA },
      notifications_non_lues: notificationsNonLues,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  CHAMBRES
// ============================================================

app.get('/api/chambres', async (req, res) => {
  try {
    const { statut } = req.query;
    let hotelSlug = req.query.hotel_slug;

    // Vérifier si l'appelant est un admin connecté
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const userSlug = getHotelSlugForUser(decoded.email);
        if (userSlug) hotelSlug = userSlug;
      } catch {}
    }

    const where = {};
    if (statut) where.statut = statut;
    if (hotelSlug) where.hotel_slug = hotelSlug;

    const chambres = await prisma.chambre.findMany({
      where,
      include: { 
        type_chambre: true,
        lignes_reservation: {
          where: { reservation: { statut: 'en_sejour' } },
          include: { reservation: { include: { utilisateur: true } } }
        }
      },
      orderBy: [{ etage: 'asc' }, { numero_chambre: 'asc' }],
    });
    res.json(chambres);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Disponibilité des chambres (pour le chatbot et la réservation)
app.get('/api/chambres/disponibles', async (req, res) => {
  try {
    const { date_arrivee, date_depart, type } = req.query;
    let hotelSlug = req.query.hotel_slug;

    // Vérifier si l'appelant est un admin connecté
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const userSlug = getHotelSlugForUser(decoded.email);
        if (userSlug) hotelSlug = userSlug;
      } catch {}
    }

    let whereType = { statut: { not: 'maintenance' } };
    if (hotelSlug) whereType.hotel_slug = hotelSlug;
    if (type) whereType.type_chambre = { nom: { contains: type, mode: 'insensitive' } };

    const toutesChambres = await prisma.chambre.findMany({
      where: whereType,
      include: { type_chambre: true },
    });

    let chambresOccupeesIds = new Set();

    if (date_arrivee && date_depart) {
      const reservationsConflictuelles = await prisma.ligneReservation.findMany({
        where: {
          reservation: {
            statut: { notIn: ['annulee', 'terminee'] },
            date_arrivee: { lt: new Date(date_depart) },
            date_depart: { gt: new Date(date_arrivee) },
          },
        },
        select: { chambre_id: true },
      });
      chambresOccupeesIds = new Set(reservationsConflictuelles.map(lr => lr.chambre_id));
    }

    const chambresDisponibles = toutesChambres.filter(c => !chambresOccupeesIds.has(c.id));

    // Regrouper par type pour la réponse JSON du chatbot
    const parType = {};
    for (const ch of chambresDisponibles) {
      const t = ch.type_chambre;
      if (!parType[t.id]) {
        parType[t.id] = {
          type_id: t.id,
          nom: t.nom,
          description: t.description,
          prix_base_nuit: t.prix_base_nuit,
          capacite_adultes: t.capacite_adultes,
          capacite_enfants: t.capacite_enfants,
          equipements: (() => {
            try { return JSON.parse(t.equipements || '[]'); } catch { return []; }
          })(),
          chambres_disponibles: 0,
          numeros: [],
        };
      }
      parType[t.id].chambres_disponibles++;
      parType[t.id].numeros.push(ch.numero_chambre);
    }

    res.json({
      date_arrivee: date_arrivee || null,
      date_depart: date_depart || null,
      total_disponibles: chambresDisponibles.length,
      chambres_ids: chambresDisponibles.map(c => c.id),
      types: Object.values(parType),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Types de chambres (catalogue public)
app.get('/api/types-chambres', async (req, res) => {
  try {
    const types = await prisma.typeChambre.findMany({
      include: {
        _count: { select: { chambres: true } },
        chambres: { where: { statut: 'disponible' }, select: { id: true } },
      },
    });
    const result = types.map(t => ({
      ...t,
      equipements: (() => { try { return JSON.parse(t.equipements || '[]'); } catch { return []; } })(),
      chambres_disponibles: t.chambres.length,
      total_chambres: t._count.chambres,
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/chambres/:id/statut', adminMiddleware, async (req, res) => {
  const { statut } = req.body;
  const statutsValides = ['disponible', 'occupee', 'nettoyage', 'maintenance'];
  if (!statutsValides.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });
  try {
    const chambre = await prisma.chambre.update({
      where: { id: req.params.id },
      data: { statut },
      include: { type_chambre: true },
    });
    res.json(chambre);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Créer une nouvelle chambre
app.post('/api/admin/chambres', adminMiddleware, async (req, res) => {
  try {
    const { numero_chambre, type_chambre_id, etage, statut, notes, image_url } = req.body;
    const hotelSlug = getHotelSlugForUser(req.user?.email);

    if (hotelSlug) {
      const typeChambre = await prisma.typeChambre.findFirst({ where: { id: type_chambre_id } });
      if (typeChambre && typeChambre.hotel_slug !== hotelSlug) {
        return res.status(403).json({ error: "Interdit d'ajouter des chambres dans un autre hôtel." });
      }
    }

    const chambre = await prisma.chambre.create({
      data: {
        numero_chambre,
        type_chambre_id,
        etage: etage ? parseInt(etage) : null,
        statut: statut || 'disponible',
        notes: notes || null,
        image_url: image_url || null,
        hotel_slug: hotelSlug || 'hotel-panorama',
      },
      include: { type_chambre: true },
    });
    res.status(201).json(chambre);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Modifier une chambre existante
app.put('/api/admin/chambres/:id', adminMiddleware, async (req, res) => {
  try {
    const { numero_chambre, type_chambre_id, etage, statut, notes, image_url } = req.body;
    const hotelSlug = getHotelSlugForUser(req.user?.email);

    if (hotelSlug) {
      const currentChambre = await prisma.chambre.findFirst({ where: { id: req.params.id } });
      if (!currentChambre || currentChambre.hotel_slug !== hotelSlug) {
        return res.status(403).json({ error: "Interdit de modifier une chambre d'un autre hôtel." });
      }
    }

    const chambre = await prisma.chambre.update({
      where: { id: req.params.id },
      data: {
        numero_chambre,
        type_chambre_id,
        etage: etage !== undefined ? parseInt(etage) : undefined,
        statut,
        notes,
        image_url,
      },
      include: { type_chambre: true },
    });
    res.json(chambre);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  RÉSERVATIONS
// ============================================================

app.get('/api/reservations', adminMiddleware, async (req, res) => {
  try {
    const { statut, limit = 50 } = req.query;
    const hotelSlug = getHotelSlugForUser(req.user?.email);
    
    const where = statut ? { statut } : {};
    if (hotelSlug) {
      where.hotel_slug = hotelSlug;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        utilisateur: { select: { id: true, email: true, nom_affiche: true } },
        lignes_reservation: { include: { chambre: { include: { type_chambre: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
    });
    res.json(reservations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/mes-reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { utilisateur_id: req.user.id },
      include: {
        lignes_reservation: { include: { chambre: { include: { type_chambre: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(reservations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  PROFIL UTILISATEUR
// ============================================================

app.get('/api/profil', authMiddleware, async (req, res) => {
  try {
    const profil = await prisma.profil.findUnique({ where: { utilisateur_id: req.user.id } });
    res.json(profil || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profil', authMiddleware, async (req, res) => {
  const { telephone, type_document_identite, numero_document_identite, nationalite, pays_residence } = req.body;
  try {
    const profil = await prisma.profil.upsert({
      where: { utilisateur_id: req.user.id },
      update: { telephone, type_document_identite, numero_document_identite, nationalite, pays_residence },
      create: { utilisateur_id: req.user.id, telephone, type_document_identite, numero_document_identite, nationalite, pays_residence },
    });
    res.json(profil);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reservations', authMiddleware, async (req, res) => {
  // Les administrateurs ne peuvent pas effectuer de réservations
  if (req.user.est_admin) {
    return res.status(403).json({ error: 'Les administrateurs ne peuvent pas effectuer de réservations.' });
  }
  const { chambre_id, date_arrivee, date_depart, nombre_voyageurs, demandes_speciales, lit_supplementaire } = req.body;
  try {
    const chambre = await prisma.chambre.findUnique({
      where: { id: chambre_id },
      include: { type_chambre: true },
    });
    if (!chambre) return res.status(404).json({ error: 'Chambre introuvable.' });
    if (chambre.statut === 'maintenance') return res.status(400).json({ error: 'Chambre en maintenance.' });

    // Vérifier disponibilité
    const conflit = await prisma.ligneReservation.findFirst({
      where: {
        chambre_id,
        reservation: {
          statut: { notIn: ['annulee', 'terminee'] },
          date_arrivee: { lt: new Date(date_depart) },
          date_depart: { gt: new Date(date_arrivee) },
        },
      },
    });
    if (conflit) return res.status(409).json({ error: 'Chambre déjà réservée pour ces dates.' });

    const nuits = Math.ceil((new Date(date_depart) - new Date(date_arrivee)) / 86400000);
    if (nuits <= 0) return res.status(400).json({ error: 'Dates invalides.' });

    const prixNuit = chambre.type_chambre.prix_base_nuit + (lit_supplementaire ? 15 : 0);
    const montant_total = prixNuit * nuits;

    const reservation = await prisma.reservation.create({
      data: {
        utilisateur_id: req.user.id,
        hotel_slug: chambre.hotel_slug, // Lier à l'hôtel de la chambre
        statut: 'en_attente',
        montant_total,
        date_arrivee: new Date(date_arrivee),
        date_depart: new Date(date_depart),
        nombre_voyageurs: nombre_voyageurs || 1,
        demandes_speciales: demandes_speciales || null,
        lignes_reservation: {
          create: { chambre_id, prix_par_nuit: prixNuit, lit_supplementaire: lit_supplementaire || false },
        },
      },
      include: { lignes_reservation: { include: { chambre: { include: { type_chambre: true } } } } },
    });

    res.json(reservation);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/reservations/:id/statut', adminMiddleware, async (req, res) => {
  const { statut } = req.body;
  // payee supprimé — workflow: en_attente → confirmee → en_sejour → terminee | annulee
  const statutsValides = ['en_attente', 'confirmee', 'en_sejour', 'terminee', 'annulee'];
  if (!statutsValides.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

  try {
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { statut },
    });
    const lignes = await prisma.ligneReservation.findMany({ where: { reservation_id: req.params.id } });

    if (statut === 'confirmee' || statut === 'en_sejour') {
      for (const l of lignes) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'occupee' } });
      }
    }
    if (statut === 'terminee') {
      // Chambre → maintenance. Seul l'admin peut la remettre disponible.
      for (const l of lignes) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'maintenance' } });
        await prisma.notification.create({
          data: {
            reservation_id: req.params.id,
            type: 'nettoyage_chambre',
            message: `Chambre en maintenance après départ — Réservation ${req.params.id.slice(0, 8)}`,
          },
        });
      }
    }
    if (statut === 'annulee') {
      for (const l of lignes) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'disponible' } });
      }
    }
    res.json(reservation);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  PLATS & MENU
// ============================================================

app.get('/api/plats', async (req, res) => {
  try {
    const { categorie } = req.query;
    const where = { disponible: true };
    if (categorie) where.categorie = categorie;
    const plats = await prisma.plat.findMany({
      where,
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
    res.json(plats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/plats/menu', async (req, res) => {
  try {
    const plats = await prisma.plat.findMany({
      where: { disponible: true },
      orderBy: [{ categorie: 'asc' }, { prix: 'asc' }],
    });
    // Regrouper par catégorie
    const menu = plats.reduce((acc, plat) => {
      if (!acc[plat.categorie]) acc[plat.categorie] = [];
      acc[plat.categorie].push(plat);
      return acc;
    }, {});
    res.json(menu);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/plats/:id', adminMiddleware, async (req, res) => {
  try {
    const plat = await prisma.plat.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(plat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  COMMANDES
// ============================================================

app.get('/api/admin/commandes', adminMiddleware, async (req, res) => {
  try {
    const { statut } = req.query;
    const hotelSlug = getHotelSlugForUser(req.user?.email);

    const where = statut ? { statut } : { statut: { notIn: ['terminee', 'annulee'] } };
    if (hotelSlug) {
      where.hotel_slug = hotelSlug;
    }

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        utilisateur: { select: { nom_affiche: true, email: true } },
        chambre: { select: { numero_chambre: true } },
        lignes_commande: { include: { plat: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(commandes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/commandes', authMiddleware, async (req, res) => {
  const { reservation_id, chambre_id, type_commande, articles, notes } = req.body;
  try {
    const montant_total = articles.reduce((sum, a) => sum + (a.prix_unitaire * a.quantite), 0);

    let hotel_slug = 'hotel-panorama';
    if (chambre_id) {
      const chambre = await prisma.chambre.findUnique({ where: { id: chambre_id } });
      if (chambre) hotel_slug = chambre.hotel_slug;
    } else if (reservation_id) {
      const reservation = await prisma.reservation.findUnique({ where: { id: reservation_id } });
      if (reservation) hotel_slug = reservation.hotel_slug;
    }

    const commande = await prisma.commande.create({
      data: {
        utilisateur_id: req.user.id,
        reservation_id: reservation_id || null,
        chambre_id: chambre_id || null,
        hotel_slug,
        type_commande,
        statut: 'en_attente',
        montant_total,
        notes: notes || null,
        lignes_commande: {
          create: articles.map(a => ({
            type_article: a.type_article,
            plat_id: a.plat_id || null,
            nom_article: a.nom_article,
            quantite: a.quantite,
            prix_unitaire: a.prix_unitaire,
            instructions_speciales: a.instructions_speciales || null,
          })),
        },
      },
      include: { lignes_commande: true },
    });

    await prisma.notification.create({
      data: {
        commande_id: commande.id,
        type: 'nouvelle_commande',
        message: `Nouvelle commande ${type_commande} — Chambre ${chambre_id || 'N/A'}`,
      },
    });

    res.json(commande);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/commandes', authMiddleware, async (req, res) => {
  try {
    const { reservation_id } = req.query;
    const where = { utilisateur_id: req.user.id };
    if (reservation_id) where.reservation_id = reservation_id;
    
    const commandes = await prisma.commande.findMany({
      where,
      include: {
        lignes_commande: { include: { plat: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(commandes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.patch('/api/admin/commandes/:id/statut', adminMiddleware, async (req, res) => {
  const { statut } = req.body;
  try {
    const commande = await prisma.commande.update({
      where: { id: req.params.id },
      data: { statut },
    });
    if (statut === 'prete') {
      await prisma.notification.create({
        data: {
          commande_id: req.params.id,
          type: 'commande_prete',
          message: `Commande ${req.params.id.slice(0, 8)} prête à être livrée.`,
        },
      });
    }
    res.json(commande);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  UTILISATEURS (Admin)
// ============================================================

app.get('/api/admin/utilisateurs', adminMiddleware, async (req, res) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      include: { profil: true, _count: { select: { reservations: true, commandes: true } } },
      orderBy: { created_at: 'desc' },
    });
    const result = utilisateurs.map(({ password_hash, ...u }) => u);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  NOTIFICATIONS
// ============================================================

app.get('/api/admin/notifications', adminMiddleware, async (req, res) => {
  try {
    const hotelSlug = getHotelSlugForUser(req.user?.email);
    const notifications = await prisma.notification.findMany({
      where: {
        est_lue: false,
        ...(hotelSlug ? {
          OR: [
            { reservation: { hotel_slug: hotelSlug } },
            { commande: { hotel_slug: hotelSlug } }
          ]
        } : {})
      },
      include: {
        commande: { select: { type_commande: true } },
        reservation: { select: { utilisateur: { select: { nom_affiche: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/notifications/:id/lue', adminMiddleware, async (req, res) => {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { est_lue: true } });
    res.json(n);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
//  JOURNAL CHAT (pour le chatbot IA)
// ============================================================

app.post('/api/chat/log', async (req, res) => {
  const { utilisateur_id, session_id, role, contenu, nom_fonction } = req.body;
  try {
    const log = await prisma.journalChat.create({
      data: {
        utilisateur_id: utilisateur_id || null,
        session_id,
        role,
        contenu: typeof contenu === 'object' ? JSON.stringify(contenu) : contenu,
        nom_fonction: nom_fonction || null,
      },
    });
    res.json(log);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/chat/session/:sessionId', async (req, res) => {
  try {
    const logs = await prisma.journalChat.findMany({
      where: { session_id: req.params.sessionId },
      orderBy: { created_at: 'asc' },
      take: 50,
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health check ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Panorama Assist API',
    db: 'PostgreSQL via Prisma',
    version: '2.0.0',
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: e.message });
  }
});

// ── Auto-scheduler : arrivées → en_sejour / départs → maintenance ────────
async function autoUpdateReservations() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);

    // Réservations confirmées dont la date d'arrivée est aujourd'hui → en_sejour
    const arrivals = await prisma.reservation.findMany({
      where: { statut: { in: ['confirmee', 'en_attente'] }, date_arrivee: { gte: today, lt: tomorrow } },
      include: { lignes_reservation: true },
    });
    for (const r of arrivals) {
      await prisma.reservation.update({ where: { id: r.id }, data: { statut: 'en_sejour' } });
      for (const l of r.lignes_reservation) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'occupee' } });
      }
    }

    // Réservations en_sejour dont la date de départ est dépassée → terminee + maintenance
    const departures = await prisma.reservation.findMany({
      where: { statut: 'en_sejour', date_depart: { lt: tomorrow } },
      include: { lignes_reservation: true },
    });
    for (const r of departures) {
      await prisma.reservation.update({ where: { id: r.id }, data: { statut: 'terminee' } });
      for (const l of r.lignes_reservation) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'maintenance' } });
        await prisma.notification.create({
          data: {
            reservation_id: r.id, type: 'nettoyage_chambre',
            message: `Chambre en maintenance après départ (auto) — Réservation ${r.id.slice(0, 8)}`,
          },
        });
      }
    }
    if (arrivals.length + departures.length > 0) {
      console.log(`[Scheduler] ${arrivals.length} arrivée(s), ${departures.length} départ(s) traités.`);
    }
  } catch (err) {
    console.error('[Scheduler] Erreur:', err.message);
  }
}

// ── Démarrage ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  \x1b[1;33m🔥  Hôtel PANORAMA  🔥\x1b[0m`);
  console.log(`  \x1b[1;32m✔  Assistant de l'hôtel démarré et authentifié avec succès.\x1b[0m\n`);
  console.log(`  \x1b[1;33m•\x1b[0m  \x1b[1;32mPort\x1b[0m           : \x1b[1;36m${PORT}\x1b[0m`);
  console.log(`  \x1b[1;33m•\x1b[0m  \x1b[1;32mBase de données\x1b[0m: \x1b[1;36mPostgreSQL\x1b[0m`);
  console.log(`  \x1b[1;33m•\x1b[0m  \x1b[1;32mURL locale\x1b[0m     : \x1b[1;36mhttp://localhost:${PORT}\x1b[0m\n`);
  // Lancer le scheduler immédiatement puis toutes les 5 minutes
  autoUpdateReservations();
  setInterval(autoUpdateReservations, 5 * 60 * 1000);
});

module.exports = app;
