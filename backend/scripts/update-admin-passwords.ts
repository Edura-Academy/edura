import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPasswords() {
  const yeniSifre = 'Edura2026.!';
  const hashedPassword = await bcrypt.hash(yeniSifre, 10);
  
  console.log('🔐 Admin şifreleri güncelleniyor...');
  console.log('Yeni şifre:', yeniSifre);
  console.log('Hashlenmiş şifre:', hashedPassword);
  
  const adminEmails = [
    'hasan.vural@edura.com',
    'abdurrahman.onavci@edura.com',
    'ferhat.kara@edura.com'
  ];

  for (const email of adminEmails) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, ad: true, soyad: true, email: true, role: true }
      });

      if (user) {
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        console.log(`✅ ${user.ad} ${user.soyad} (${email}) - Şifre güncellendi`);
      } else {
        console.log(`⚠️  ${email} - Kullanıcı bulunamadı`);
      }
    } catch (error) {
      console.error(`❌ ${email} - Hata:`, error);
    }
  }

  console.log('\n✅ Tüm admin şifreleri güncellendi!');
  console.log('Yeni şifre: Edura2026.!');
}

updateAdminPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


