const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
  const email = 'luciusamani@gmail.com';
  const password = 'Lucien-Amani1234';
  const user = await prisma.utilisateur.findUnique({ where: { email } });
  
  if (!user) {
    console.log('Utilisateur non trouvé dans la BD');
    return;
  }
  
  console.log('Utilisateur trouvé:', user.email);
  const match = bcrypt.compareSync(password, user.password_hash);
  console.log('Match mot de passe:', match);
}

check().catch(console.error).finally(() => prisma.$disconnect());
