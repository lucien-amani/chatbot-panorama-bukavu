const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// ROUTES DE L'API REST (Panorama Assist)
// ==========================================

// --- AUTHENTIFICATION ---
app.get('/api/setup-admin', async (req, res) => {
  try {
    const email = "luciusamani@gmail.com";
    const password = "Lucien-Amani1234";
    const nom_affiche = "Lucien Amani (Super Admin)";

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const user = await prisma.utilisateur.upsert({
      where: { email },
      update: { password_hash, nom_affiche, est_admin: true },
      create: { email, password_hash, nom_affiche, est_admin: true }
    });

    res.json({ message: "Super-Admin configuré avec succès !", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la configuration." });
  }
});
app.post('/api/auth/register', async (req, res) => {
  const { email, password, nom_affiche } = req.body;
  try {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Cet email est déjà utilisé." });
    
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    
    const newUser = await prisma.utilisateur.create({
      data: { email, password_hash, nom_affiche, est_admin: false }
    });
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, est_admin: newUser.est_admin }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const { password_hash: _, ...userData } = newUser;
    res.json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Email ou mot de passe incorrect." });
    
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Email ou mot de passe incorrect." });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, est_admin: user.est_admin }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const { password_hash: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// --- CHAMBRES ---
// Lister toutes les chambres avec leur type (prix, capacité)
app.get('/api/chambres', async (req, res) => {
  try {
    const chambres = await prisma.chambre.findMany({
      include: { type_chambre: true }
    });
    res.json(chambres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des chambres." });
  }
});

// --- RÉSERVATIONS ---
// Lister les réservations avec les détails de l'utilisateur et des chambres
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { 
        utilisateur: true, 
        lignes_reservation: { 
          include: { chambre: true } 
        } 
      }
    });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des réservations." });
  }
});

// Créer une nouvelle réservation
app.post('/api/reservations', async (req, res) => {
  const { utilisateur_id, date_arrivee, date_depart, statut, montant_total } = req.body;
  try {
    const nouvelleReservation = await prisma.reservation.create({
      data: {
        utilisateur_id,
        date_arrivee: new Date(date_arrivee),
        date_depart: new Date(date_depart),
        statut: statut || "en_attente",
        montant_total
      }
    });
    res.json(nouvelleReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création de la réservation." });
  }
});

// --- UTILISATEURS ---
// Lister les utilisateurs
app.get('/api/utilisateurs', async (req, res) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      include: { profil: true }
    });
    res.json(utilisateurs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs." });
  }
});

// Route par défaut
app.get('/', (req, res) => {
  res.send('API Panorama Assist fonctionnelle avec Prisma et SQLite !');
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Serveur Backend démarré sur le port ${PORT}`);
  console.log(`🔌 Base de données : SQLite via Prisma`);
  console.log(`🌐 URL : http://localhost:${PORT}`);
  console.log(`=========================================`);
});
