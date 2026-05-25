const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "luciusamani@gmail.com";
  const password = "Lucien-Amani1234";
  const nom_affiche = "Lucien Amani (Super Admin)";

  console.log("🔐 Génération du hash sécurisé...");
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  console.log("👤 Création ou mise à jour de l'utilisateur...");
  const user = await prisma.utilisateur.upsert({
    where: { email },
    update: {
      password_hash,
      nom_affiche,
      est_admin: true
    },
    create: {
      email,
      password_hash,
      nom_affiche,
      est_admin: true
    }
  });

  console.log(`✅ Compte Super-Admin configuré avec succès !`);
  console.log(`📧 Email : ${user.email}`);
  console.log(`🔑 Rôle Admin : ${user.est_admin}`);
}

main()
  .catch(e => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
