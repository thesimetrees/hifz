// Seed akun super admin — jalankan: node prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'alialatas6797@gmail.com';
  const password = await bcrypt.hash('IhyaAdmin#2026', 12);
  await prisma.user.upsert({
    where: { email },
    update: { peran: 'admin', aktif: true },
    create: { email, password, nama: 'Admin Ihya', peran: 'admin' },
  });
  console.log('Seed selesai: admin', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
