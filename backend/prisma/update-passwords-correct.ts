import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Şifre grupları - DOĞRU DEĞERLER
const SIFRELER = {
  admin: 'Edura2026.!',        // Adminler için
  buket: 'edura123',           // Küçükyalı Buket kullanıcıları için
  digerKurslar: 'Edura2025.!'  // Diğer kurs kullanıcıları için
};

// Küçükyalı Buket kullanıcı email'leri (@ olmadan)
const BUKET_EMAILS = [
  'buketdogan',
  'busrabuyuktanir',
  'mervecevizcipinar',
  'damlamengus',
  'mervehazaniscan',
  'seydakarci',
  'ziyaanilsen',
  'emineumaykilinc',
  'muratbarisakyuz',
  'zeynepucar',
  'akilrahmanturza',
  'alirizamistik',
  'masihullahomar',
  'buraktuzcu',
  'egemenkoraykeles',
  'muhammetbatuhankaranfil',
  'efekocal',
];

async function main() {
  console.log('🔐 Şifre güncelleme başlıyor...\n');
  console.log('Şifre grupları:');
  console.log('  - Adminler: ' + SIFRELER.admin);
  console.log('  - Küçükyalı Buket: ' + SIFRELER.buket);
  console.log('  - Diğer Kurslar: ' + SIFRELER.digerKurslar);
  console.log('\n');

  // Şifreleri hashle
  const hashedAdminSifre = await bcrypt.hash(SIFRELER.admin, 10);
  const hashedBuketSifre = await bcrypt.hash(SIFRELER.buket, 10);
  const hashedDigerSifre = await bcrypt.hash(SIFRELER.digerKurslar, 10);

  // 1. Admin şifrelerini güncelle
  console.log('1️⃣ Admin şifreleri güncelleniyor...');
  const adminResult = await prisma.user.updateMany({
    where: { role: 'admin' },
    data: { password: hashedAdminSifre }
  });
  console.log(`   ✅ ${adminResult.count} admin güncellendi (Şifre: ${SIFRELER.admin})\n`);

  // 2. Küçükyalı Buket kullanıcılarını güncelle (kurs adına göre)
  console.log('2️⃣ Küçükyalı Buket kullanıcıları güncelleniyor...');
  
  // Önce Buket kursunu bul
  const buketKurs = await prisma.kurs.findFirst({
    where: { ad: { contains: 'Buket' } }
  });

  let buketCount = 0;
  
  if (buketKurs) {
    // Kurs ID'sine göre güncelle
    const buketKursResult = await prisma.user.updateMany({
      where: { 
        kursId: buketKurs.id,
        role: { not: 'admin' }
      },
      data: { password: hashedBuketSifre }
    });
    buketCount += buketKursResult.count;
  }

  // Email'e göre de güncelle (kurs ataması olmayanlar için)
  for (const email of BUKET_EMAILS) {
    const result = await prisma.user.updateMany({
      where: { 
        email: { contains: email },
        role: { not: 'admin' }
      },
      data: { password: hashedBuketSifre }
    });
    if (result.count > 0 && !buketKurs) {
      buketCount += result.count;
    }
  }
  
  console.log(`   ✅ ${buketCount} Buket kullanıcısı güncellendi (Şifre: ${SIFRELER.buket})\n`);

  // 3. Diğer tüm kullanıcıları güncelle (admin ve buket hariç)
  console.log('3️⃣ Diğer kurs kullanıcıları güncelleniyor...');
  
  // Önce tüm kullanıcıları al
  const tumKullanicilar = await prisma.user.findMany({
    where: {
      role: { not: 'admin' },
      // Buket kursunda olmayanlar
      ...(buketKurs ? { kursId: { not: buketKurs.id } } : {}),
    },
    select: { id: true, email: true }
  });

  // Buket email'lerini filtrele
  const digerKullaniciIds = tumKullanicilar
    .filter(u => !BUKET_EMAILS.some(be => u.email?.includes(be)))
    .map(u => u.id);

  const digerResult = await prisma.user.updateMany({
    where: { id: { in: digerKullaniciIds } },
    data: { password: hashedDigerSifre }
  });
  
  console.log(`   ✅ ${digerResult.count} diğer kullanıcı güncellendi (Şifre: ${SIFRELER.digerKurslar})\n`);

  // Özet
  console.log('═'.repeat(50));
  console.log('📊 ÖZET:');
  console.log(`   Adminler: ${adminResult.count} kişi → Şifre: ${SIFRELER.admin}`);
  console.log(`   Küçükyalı Buket: ${buketCount} kişi → Şifre: ${SIFRELER.buket}`);
  console.log(`   Diğer Kurslar: ${digerResult.count} kişi → Şifre: ${SIFRELER.digerKurslar}`);
  console.log('═'.repeat(50));
  console.log('\n✅ Tüm şifreler başarıyla güncellendi!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
