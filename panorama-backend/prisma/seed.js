/**
 * seed.js — Données initiales pour Hôtel Panorama Bukavu
 * Exécuter : node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding PostgreSQL — Panorama Bukavu...\n');

  // ── 1. Types de chambres ─────────────────────────────────
  console.log('📦 Création des types de chambres...');
  const types = await Promise.all([
    prisma.typeChambre.upsert({
      where: { nom: 'Standard' },
      update: {},
      create: {
        nom: 'Standard',
        description: 'Chambre confortable avec vue sur le jardin, idéale pour les séjours d\'affaires.',
        prix_base_nuit: 85,
        capacite_adultes: 2,
        capacite_enfants: 1,
        equipements: JSON.stringify(['Wi-Fi', 'TV satellite', 'Climatisation', 'Minibar', 'Coffre-fort']),
      },
    }),
    prisma.typeChambre.upsert({
      where: { nom: 'VIP Vue Lac' },
      update: {},
      create: {
        nom: 'VIP Vue Lac',
        description: 'Chambre supérieure avec vue panoramique sur le lac Kivu et les collines environnantes.',
        prix_base_nuit: 150,
        capacite_adultes: 2,
        capacite_enfants: 2,
        equipements: JSON.stringify(['Wi-Fi', 'TV satellite 4K', 'Climatisation', 'Minibar premium', 'Coffre-fort', 'Baignoire', 'Balcon vue lac']),
      },
    }),
    prisma.typeChambre.upsert({
      where: { nom: 'Suite Junior' },
      update: {},
      create: {
        nom: 'Suite Junior',
        description: 'Suite spacieuse avec salon séparé et vue dégagée, parfaite pour les familles.',
        prix_base_nuit: 220,
        capacite_adultes: 3,
        capacite_enfants: 2,
        equipements: JSON.stringify(['Wi-Fi haut débit', 'TV satellite 4K', 'Climatisation multi-zone', 'Minibar premium', 'Coffre-fort', 'Baignoire + douche', 'Salon séparé', 'Balcon']),
      },
    }),
    prisma.typeChambre.upsert({
      where: { nom: 'Suite Présidentielle' },
      update: {},
      create: {
        nom: 'Suite Présidentielle',
        description: 'Notre suite la plus luxueuse avec terrasse privée, jacuzzi et service butler 24h/24.',
        prix_base_nuit: 350,
        capacite_adultes: 4,
        capacite_enfants: 2,
        equipements: JSON.stringify(['Wi-Fi fibre', 'TV satellite 4K + Cinéma', 'Climatisation multi-zone', 'Bar privé', 'Coffre-fort', 'Jacuzzi', 'Douche hammam', 'Terrasse privée', 'Service butler', 'Piano']),
      },
    }),
  ]);
  console.log(`   ✅ ${types.length} types de chambres créés/mis à jour\n`);

  // ── 2. Chambres ──────────────────────────────────────────
  console.log('🛏️  Création des chambres...');
  const [std, vip, junior, presid] = types;

  const chambresData = [
    // Étage 1 — Standard
    { numero_chambre: '101', type_chambre_id: std.id, etage: 1, statut: 'disponible' },
    { numero_chambre: '102', type_chambre_id: std.id, etage: 1, statut: 'disponible' },
    { numero_chambre: '103', type_chambre_id: std.id, etage: 1, statut: 'nettoyage' },
    { numero_chambre: '104', type_chambre_id: std.id, etage: 1, statut: 'disponible' },
    { numero_chambre: '105', type_chambre_id: std.id, etage: 1, statut: 'maintenance', notes: 'Réparation climatisation' },
    // Étage 2 — VIP Vue Lac
    { numero_chambre: '201', type_chambre_id: vip.id, etage: 2, statut: 'occupee' },
    { numero_chambre: '202', type_chambre_id: vip.id, etage: 2, statut: 'disponible' },
    { numero_chambre: '203', type_chambre_id: vip.id, etage: 2, statut: 'disponible' },
    { numero_chambre: '204', type_chambre_id: vip.id, etage: 2, statut: 'nettoyage' },
    // Étage 3 — Suite Junior
    { numero_chambre: '301', type_chambre_id: junior.id, etage: 3, statut: 'disponible' },
    { numero_chambre: '302', type_chambre_id: junior.id, etage: 3, statut: 'occupee' },
    { numero_chambre: '303', type_chambre_id: junior.id, etage: 3, statut: 'disponible' },
    // Étage 4 — Suite Présidentielle
    { numero_chambre: '401', type_chambre_id: presid.id, etage: 4, statut: 'disponible' },
    { numero_chambre: '402', type_chambre_id: presid.id, etage: 4, statut: 'maintenance', notes: 'Rénovation jacuzzi' },
  ];

  let chambresCount = 0;
  for (const chambre of chambresData) {
    await prisma.chambre.upsert({
      where: { numero_chambre: chambre.numero_chambre },
      update: { statut: chambre.statut, notes: chambre.notes || null },
      create: chambre,
    });
    chambresCount++;
  }
  console.log(`   ✅ ${chambresCount} chambres créées/mises à jour\n`);

  // ── 3. Catalogue de plats ────────────────────────────────
  console.log('🍽️  Création du catalogue de plats...');
  const platsData = [
    // Entrées
    { nom: 'Soupe de légumes africains', description: 'Soupe traditionnelle aux légumes locaux et épices', categorie: 'entree', prix: 8 },
    { nom: 'Salade Panorama', description: 'Mélange de légumes frais, avocat et vinaigrette maison', categorie: 'entree', prix: 10 },
    { nom: 'Brochettes de crevettes', description: 'Crevettes marinées grillées, sauce citron-coriandre', categorie: 'entree', prix: 14 },
    // Plats principaux
    { nom: 'Poulet Moambé', description: 'Plat traditionnel congolais au poulet et sauce noix de palme', categorie: 'plat_principal', prix: 22 },
    { nom: 'Tilapia du Lac Kivu', description: 'Filet de tilapia frais grillé, légumes vapeur, riz pilaf', categorie: 'plat_principal', prix: 28 },
    { nom: 'Entrecôte du Chef', description: '250g d\'entrecôte grillée, sauce au poivre, frites maison', categorie: 'plat_principal', prix: 35 },
    { nom: 'Riz aux haricots rouges', description: 'Recette traditionnelle aux haricots rouges du Kivu', categorie: 'plat_principal', prix: 12 },
    { nom: 'Brochettes de chèvre', description: 'Brochettes de chèvre marinées, sauce pimentée, frites', categorie: 'plat_principal', prix: 26 },
    // Desserts
    { nom: 'Fondant chocolat', description: 'Fondant au chocolat noir, boule de glace vanille', categorie: 'dessert', prix: 9 },
    { nom: 'Salade de fruits tropicaux', description: 'Mangue, papaye, ananas et fruits de la passion', categorie: 'dessert', prix: 8 },
    { nom: 'Crème brûlée café', description: 'Crème brûlée arôme café arabica du Kivu', categorie: 'dessert', prix: 9 },
    // Boissons
    { nom: 'Eau minérale (50cl)', description: 'Eau minérale plate ou gazeuse', categorie: 'boisson', prix: 3 },
    { nom: 'Jus de fruit frais', description: 'Maracuja, mangue, ananas ou goyave — pressé à la commande', categorie: 'boisson', prix: 6 },
    { nom: 'Café Arabica du Kivu', description: 'Expresso ou café filtre, grains locaux torréfiés sur place', categorie: 'boisson', prix: 4 },
    { nom: 'Bière Primus (33cl)', description: 'Bière locale congolaise, fraîche', categorie: 'boisson', prix: 4 },
    { nom: 'Coca-Cola / Fanta / Sprite', description: 'Boisson fraîche en canette 33cl', categorie: 'boisson', prix: 3 },
    // Vins
    { nom: 'Bordeaux Château Minos', description: 'Vin rouge fruité, tanins souples, idéal avec viandes', categorie: 'vin', prix: 45 },
    { nom: 'Sauvignon Blanc Afrique du Sud', description: 'Vin blanc frais, notes d\'agrumes et herbes fraîches', categorie: 'vin', prix: 40 },
    { nom: 'Rosé Provence', description: 'Rosé sec et léger, parfait avec poissons et fruits de mer', categorie: 'vin', prix: 38 },
  ];

  let platsCount = 0;
  for (const plat of platsData) {
    await prisma.plat.upsert({
      where: { nom: plat.nom },
      update: { prix: plat.prix, disponible: true },
      create: { ...plat, disponible: true },
    });
    platsCount++;
  }
  console.log(`   ✅ ${platsCount} plats créés/mis à jour\n`);

  // ── 4. Super Admin ───────────────────────────────────────
  console.log('👤 Création du Super Admin...');
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Lucien-Amani1234', salt);

  const admin = await prisma.utilisateur.upsert({
    where: { email: 'luciusamani@gmail.com' },
    update: { est_admin: true, nom_affiche: 'Lucien Amani (Admin)' },
    create: {
      email: 'luciusamani@gmail.com',
      password_hash: adminHash,
      nom_affiche: 'Lucien Amani (Admin)',
      est_admin: true,
    },
  });
  console.log(`   ✅ Admin créé : ${admin.email}\n`);

  // ── 5. Utilisateur de test ───────────────────────────────
  console.log('👤 Création d\'un utilisateur de test...');
  const userHash = bcrypt.hashSync('Test1234!', salt);
  const testUser = await prisma.utilisateur.upsert({
    where: { email: 'client@panorama.cd' },
    update: {},
    create: {
      email: 'client@panorama.cd',
      password_hash: userHash,
      nom_affiche: 'Jean-Paul Muteba',
      est_admin: false,
    },
  });
  console.log(`   ✅ Utilisateur test : ${testUser.email} / Test1234!\n`);

  // ── Résumé ───────────────────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('✅ Seeding PostgreSQL terminé avec succès !');
  console.log('═══════════════════════════════════════════');
  console.log(`🛏️  Types chambres : ${types.length}`);
  console.log(`🚪 Chambres       : ${chambresCount}`);
  console.log(`🍽️  Plats          : ${platsCount}`);
  console.log(`👤 Utilisateurs   : 2 (admin + test)`);
  console.log('');
  console.log('📌 Connexion Admin :');
  console.log('   Email    : luciusamani@gmail.com');
  console.log('   Mot de passe : Lucien-Amani1234');
  console.log('');
  console.log('📌 Connexion Client test :');
  console.log('   Email    : client@panorama.cd');
  console.log('   Mot de passe : Test1234!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
