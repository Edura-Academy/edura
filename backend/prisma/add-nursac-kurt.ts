import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👨‍🏫 Nursaç Kurt öğretmen ekleniyor...\n');

  const hashedPassword = await bcrypt.hash('edura123', 10);

  // Küçükyalı Buket kursunu bul
  const kurs = await prisma.kurs.findFirst({
    where: { ad: 'Küçükyalı Buket' }
  });

  if (!kurs) {
    console.log('❌ Küçükyalı Buket kursu bulunamadı!');
    return;
  }

  console.log(`✅ Kurs bulundu: ${kurs.ad}\n`);

  // Öğretmeni oluştur veya güncelle
  const ogretmen = await prisma.user.upsert({
    where: { email: 'nursackurt@edura.com' },
    update: { 
      password: hashedPassword,
      brans: 'Din Kültürü ve Ahlak Bilgisi',
      kursId: kurs.id,
      aktif: true
    },
    create: {
      email: 'nursackurt@edura.com',
      password: hashedPassword,
      ad: 'Nursaç',
      soyad: 'Kurt',
      telefon: '0555 000 0000',
      role: Role.ogretmen,
      kursId: kurs.id,
      brans: 'Din Kültürü ve Ahlak Bilgisi',
      aktif: true,
    },
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ ÖĞRETMEN BAŞARIYLA EKLENDİ!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   👨‍🏫 Ad Soyad: Nursaç Kurt`);
  console.log(`   📧 Email: nursackurt@edura.com`);
  console.log(`   🔐 Şifre: edura123`);
  console.log(`   📚 Branş: Din Kültürü ve Ahlak Bilgisi`);
  console.log(`   🏫 Kurs: ${kurs.ad}`);
  console.log(`   🆔 ID: ${ogretmen.id}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

