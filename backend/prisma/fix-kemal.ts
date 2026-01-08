import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '063189fa-518b-4fb8-855b-37cafe273d0a';
  
  console.log('🔧 Kemal Özdemir soyadı düzeltiliyor...\n');
  
  // Soyadı düzelt
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { soyad: 'Özdemir' }
  });
  
  console.log('✅ Düzeltildi!');
  console.log(`   Ad: ${updatedUser.ad}`);
  console.log(`   Soyad: ${updatedUser.soyad}`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   Rol: ${updatedUser.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

