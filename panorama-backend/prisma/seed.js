/**
 * seed.js — Données initiales multi-hôtels pour les hôtels de Bukavu
 * Exécuter : node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const hotelsData = require('../../hotels.json');

const prisma = new PrismaClient();

function parsePrice(priceStr) {
  if (!priceStr) return 80;
  const matches = priceStr.toString().match(/\d+/g);
  if (matches && matches.length > 0) {
    return parseFloat(matches[0]);
  }
  return 80;
}

async function main() {
  console.log('🌱 Début du seeding PostgreSQL — Panorama Bukavu (Multi-Hôtels)...\n');

  const salt = bcrypt.genSaltSync(10);

  // ── 1. Nettoyage ou gestion du Super-Admin ────────────────────────────────
  console.log('👤 Configuration du Super Admin...');
  const superAdminEmail = 'okokaroland@gmail.com';
  const superAdminHash = bcrypt.hashSync('okokaroland@gmail.com', salt);

  // Supprimer l'ancien super-admin s'il existe pour éviter les conflits ou doublons
  try {
    await prisma.utilisateur.deleteMany({
      where: { email: 'luciusamani@gmail.com' }
    });
    console.log('   🗑️ Ancien admin luciusamani@gmail.com retiré.');
  } catch (err) {
    // ignoré s'il n'existe pas
  }

  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: superAdminEmail },
    update: { est_admin: true, nom_affiche: 'Roland Okoko (Super Admin)' },
    create: {
      email: superAdminEmail,
      password_hash: superAdminHash,
      nom_affiche: 'Roland Okoko (Super Admin)',
      est_admin: true,
    },
  });
  console.log(`   ✅ Super Admin créé : ${superAdmin.email}\n`);

  // ── 2. Création des Administrateurs Hôteliers et Chambres ──────────────────
  console.log('🏨 Création des administrateurs et des chambres pour chaque hôtel...');
  
  let totalTypesChambres = 0;
  let totalChambres = 0;
  let totalAdmins = 1; // Super admin inclus

  for (const hotel of hotelsData.hotels) {
    const hotelSlug = hotel.slug;
    const hotelName = hotel.name;

    console.log(`   👉 Configuration de l'hôtel : ${hotelName} (${hotelSlug})`);

    // A. Créer le compte admin pour cet hôtel (nom de l'hôtel comme email et password)
    const hotelAdminHash = bcrypt.hashSync(hotelName, salt);
    await prisma.utilisateur.upsert({
      where: { email: hotelName },
      update: { est_admin: true, nom_affiche: `${hotelName} (Admin)` },
      create: {
        email: hotelName,
        password_hash: hotelAdminHash,
        nom_affiche: `${hotelName} (Admin)`,
        est_admin: true,
      },
    });
    totalAdmins++;

    // B. Créer les types de chambres de cet hôtel
    const roomTypes = hotel.features?.rooms?.types || [
      { name: 'Chambre Standard', description: 'Chambre confortable équipée de tout le nécessaire.', price_range_usd: '80' },
      { name: 'Suite Premium', description: 'Suite spacieuse avec finitions haut de gamme.', price_range_usd: '150' }
    ];

    for (const rt of roomTypes) {
      const price = parsePrice(rt.price_range_usd);

      // Création unique par hôtel
      const typeChambre = await prisma.typeChambre.upsert({
        where: {
          hotel_slug_nom: {
            hotel_slug: hotelSlug,
            nom: rt.name,
          }
        },
        update: {
          prix_base_nuit: price,
          description: rt.description || 'Chambre de luxe',
        },
        create: {
          nom: rt.name,
          hotel_slug: hotelSlug,
          description: rt.description || 'Chambre de luxe',
          prix_base_nuit: price,
          capacite_adultes: rt.name.toLowerCase().includes('suite') || rt.name.toLowerCase().includes('famille') ? 3 : 2,
          capacite_enfants: 1,
          equipements: JSON.stringify(['Wi-Fi', 'TV satellite', 'Climatisation', 'Service d\'étage']),
        },
      });
      totalTypesChambres++;

      // C. Créer 3 chambres physiques pour ce type de chambre
      const numeros = ['101', '102', '103'];
      for (const num of numeros) {
        await prisma.chambre.upsert({
          where: {
            hotel_slug_numero_chambre: {
              hotel_slug: hotelSlug,
              numero_chambre: num,
            }
          },
          update: {},
          create: {
            numero_chambre: num,
            hotel_slug: hotelSlug,
            type_chambre_id: typeChambre.id,
            etage: 1,
            statut: 'disponible',
          },
        });
        totalChambres++;
      }
    }
  }
  console.log(`   ✅ ${totalAdmins} comptes administrateurs prêts.`);
  console.log(`   ✅ ${totalTypesChambres} types de chambres configurés.`);
  console.log(`   ✅ ${totalChambres} chambres physiques créées.\n`);

  // ── 3. Catalogue de plats pour Room Service ──────────────────────────────
  console.log('🍽️  Création du catalogue de plats...');
  const platsData = [
    { nom: 'Soupe de légumes africains', description: 'Soupe traditionnelle aux légumes locaux et épices', categorie: 'entree', prix: 8 },
    { nom: 'Salade Panorama', description: 'Mélange de légumes frais, avocat et vinaigrette maison', categorie: 'entree', prix: 10 },
    { nom: 'Brochettes de crevettes', description: 'Crevettes marinées grillées, sauce citron-coriandre', categorie: 'entree', prix: 14 },
    { nom: 'Poulet Moambé', description: 'Plat traditionnel congolais au poulet et sauce noix de palme', categorie: 'plat_principal', prix: 22 },
    { nom: 'Tilapia du Lac Kivu', description: 'Filet de tilapia frais grillé, légumes vapeur, riz pilaf', categorie: 'plat_principal', prix: 28 },
    { nom: 'Entrecôte du Chef', description: '250g d\'entrecôte grillée, sauce au poivre, frites maison', categorie: 'plat_principal', prix: 35 },
    { nom: 'Riz aux haricots rouges', description: 'Recette traditionnelle aux haricots rouges du Kivu', categorie: 'plat_principal', prix: 12 },
    { nom: 'Brochettes de chèvre', description: 'Brochettes de chèvre marinées, sauce pimentée, frites', categorie: 'plat_principal', prix: 26 },
    { nom: 'Fondant chocolat', description: 'Fondant au chocolat noir, boule de glace vanille', categorie: 'dessert', prix: 9 },
    { nom: 'Salade de fruits tropicaux', description: 'Mangue, papaye, ananas et fruits de la passion', categorie: 'dessert', prix: 8 },
    { nom: 'Crème brûlée café', description: 'Crème brûlée arôme café arabica du Kivu', categorie: 'dessert', prix: 9 },
    { nom: 'Eau minérale (50cl)', description: 'Eau minérale plate ou gazeuse', categorie: 'boisson', prix: 3 },
    { nom: 'Jus de fruit frais', description: 'Maracuja, mangue, ananas ou goyave — pressé à la commande', categorie: 'boisson', prix: 6 },
    { nom: 'Café Arabica du Kivu', description: 'Expresso ou café filtre, grains locaux torréfiés sur place', categorie: 'boisson', prix: 4 },
    { nom: 'Bière Primus (33cl)', description: 'Bière locale congolaise, fraîche', categorie: 'boisson', prix: 4 },
    { nom: 'Coca-Cola / Fanta / Sprite', description: 'Boisson fraîche en canette 33cl', categorie: 'boisson', prix: 3 },
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

  // ── 4. Utilisateur de test ───────────────────────────────────────────────
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

  // ── Résumé ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('✅ Seeding PostgreSQL terminé avec succès !');
  console.log('═══════════════════════════════════════════');
  console.log(`👤 Super Admin    : ${superAdminEmail} / ${superAdminEmail}`);
  console.log(`🏨 Admins Hôtels  : ${totalAdmins - 1} comptes créés`);
  console.log(`🚪 Types Chambres : ${totalTypesChambres}`);
  console.log(`🛏️  Chambres       : ${totalChambres}`);
  console.log(`🍽️  Plats          : ${platsCount}`);
  console.log(`👤 Utilisateur Test: client@panorama.cd / Test1234!`);
  console.log('');
  console.log('📌 Exemples de connexions Administrateurs Hôtels :');
  if (hotelsData.hotels.length > 0) {
    console.log(`   Email        : ${hotelsData.hotels[0].name}`);
    console.log(`   Mot de passe : ${hotelsData.hotels[0].name}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
