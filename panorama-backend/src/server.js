const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ───────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

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
    const email = 'luciusamani@gmail.com';
    const password = 'Lucien-Amani1234';
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const user = await prisma.utilisateur.upsert({
      where: { email },
      update: { password_hash, est_admin: true },
      create: { email, password_hash, nom_affiche: 'Lucien Amani (Admin)', est_admin: true },
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

// ============================================================
//  DASHBOARD STATS (Admin)
// ============================================================

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const debut_mois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debut_mois_prec = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fin_mois_prec = new Date(now.getFullYear(), now.getMonth(), 0);

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
      prisma.chambre.count(),
      prisma.chambre.count({ where: { statut: 'disponible' } }),
      prisma.reservation.count({ where: { statut: { in: ['confirmee', 'payee', 'en_sejour', 'en_attente'] } } }),
      prisma.reservation.count({
        where: {
          date_arrivee: { gte: new Date(now.toDateString()), lt: new Date(new Date(now.toDateString()).getTime() + 86400000) },
          statut: { in: ['confirmee', 'payee'] },
        },
      }),
      prisma.commande.count({ where: { statut: { in: ['en_attente', 'en_preparation', 'prete'] } } }),
      prisma.commande.count({ where: { statut: 'en_preparation' } }),
      prisma.reservation.aggregate({
        where: { created_at: { gte: debut_mois }, statut: { not: 'annulee' } },
        _sum: { montant_total: true },
      }),
      prisma.reservation.aggregate({
        where: { created_at: { gte: debut_mois_prec, lte: fin_mois_prec }, statut: { not: 'annulee' } },
        _sum: { montant_total: true },
      }),
      prisma.notification.count({ where: { est_lue: false } }),
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
    const where = statut ? { statut } : {};
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

    let whereType = { statut: { not: 'maintenance' } };
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
    const chambre = await prisma.chambre.create({
      data: {
        numero_chambre,
        type_chambre_id,
        etage: etage ? parseInt(etage) : null,
        statut: statut || 'disponible',
        notes: notes || null,
        image_url: image_url || null,
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
    const where = statut ? { statut } : {};
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

app.post('/api/reservations', authMiddleware, async (req, res) => {
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
  const statutsValides = ['confirmee', 'payee', 'en_sejour', 'terminee', 'annulee'];
  if (!statutsValides.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

  try {
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { statut },
    });

    // Mettre à jour le statut des chambres liées
    const lignes = await prisma.ligneReservation.findMany({ where: { reservation_id: req.params.id } });

    if (statut === 'en_sejour') {
      for (const l of lignes) await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'occupee' } });
    }
    if (statut === 'terminee') {
      for (const l of lignes) {
        await prisma.chambre.update({ where: { id: l.chambre_id }, data: { statut: 'nettoyage' } });
        await prisma.notification.create({
          data: {
            reservation_id: req.params.id,
            type: 'nettoyage_chambre',
            message: `Chambre à nettoyer après départ — Réservation ${req.params.id.slice(0, 8)}`,
          },
        });
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
    const where = statut ? { statut } : { statut: { notIn: ['terminee', 'annulee'] } };
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

    const commande = await prisma.commande.create({
      data: {
        utilisateur_id: req.user.id,
        reservation_id: reservation_id || null,
        chambre_id: chambre_id || null,
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
    const notifications = await prisma.notification.findMany({
      where: { est_lue: false },
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

// ── Démarrage ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║  🏨  Panorama Assist Backend v2.0         ║`);
  console.log(`╠═══════════════════════════════════════════╣`);
  console.log(`║  🚀  Port         : ${PORT}                   ║`);
  console.log(`║  🐘  Base données : PostgreSQL             ║`);
  console.log(`║  🌐  URL          : http://localhost:${PORT}  ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
});

module.exports = app;
