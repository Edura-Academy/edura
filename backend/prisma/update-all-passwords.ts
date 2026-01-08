import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const yeniSifre = 'edura123';
  const hashedPassword = await bcrypt.hash(yeniSifre, 10);
  
  console.log('🔐 Tüm kullanıcı şifreleri güncelleniyor...');
  console.log('Yeni şifre:', yeniSifre);
  
  // Tüm kullanıcıların şifresini güncelle
  const result = await prisma.user.updateMany({
    data: { password: hashedPassword }
  });
  
  console.log(`\n✅ ${result.count} kullanıcının şifresi güncellendi!`);
  console.log('Yeni şifre: edura123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

