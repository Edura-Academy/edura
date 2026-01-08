import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Güncellemeler başlıyor...\n');

  const yeniSifre = await bcrypt.hash('Edura2025.!', 10);

  // ==================== 1. Admin Onavic -> Onavci ====================
  console.log('1️⃣ Admin Abdurrahman soyadı düzeltiliyor...');
  
  const adminGuncelleme = await prisma.user.updateMany({
    where: {
      email: 'abdurrahman.onavic@edura.com',
    },
    data: {
      email: 'abdurrahman.onavci@edura.com',
      soyad: 'Onavci',
    },
  });
  
  if (adminGuncelleme.count > 0) {
    console.log('   ✅ abdurrahman.onavic@edura.com → abdurrahman.onavci@edura.com\n');
  } else {
    // Belki zaten düzeltilmiş veya hiç yok
    console.log('   ⚠️ Admin bulunamadı veya zaten güncellenmiş\n');
  }

  // ==================== 2. Emine Umay Kılınç -> Kılıç ====================
  console.log('2️⃣ Öğretmen Emine Umay soyadı düzeltiliyor...');
  
  const ogretmenGuncelleme = await prisma.user.updateMany({
    where: {
      email: 'emineumaykilinc@edura.com',
    },
    data: {
      soyad: 'Kılıç',
    },
  });
  
  if (ogretmenGuncelleme.count > 0) {
    console.log('   ✅ Emine Umay Kılınç → Emine Umay Kılıç\n');
  } else {
    console.log('   ⚠️ Öğretmen bulunamadı\n');
  }

  // ==================== 3. Küçükyalı Buket Kurs Şifreleri ====================
  console.log('3️⃣ Küçükyalı Buket kurs şifreleri güncelleniyor...');
  
  // Önce kursu bul
  const buketKurs = await prisma.kurs.findFirst({
    where: {
      ad: 'Küçükyalı Buket',
    },
  });

  if (buketKurs) {
    // Bu kursa ait tüm kullanıcıların şifresini güncelle
    const sifreGuncelleme = await prisma.user.updateMany({
      where: {
        kursId: buketKurs.id,
      },
      data: {
        password: yeniSifre,
      },
    });
    
    console.log(`   ✅ ${sifreGuncelleme.count} kullanıcının şifresi 'Edura2025.!' olarak güncellendi\n`);
  } else {
    console.log('   ⚠️ Küçükyalı Buket kursu bulunamadı\n');
  }

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 GÜNCELLEMELER TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📝 Değişiklikler:');
  console.log('   1. Admin: Onavic → Onavci');
  console.log('   2. Öğretmen: Kılınç → Kılıç');
  console.log('   3. Küçükyalı Buket kurs şifresi: Edura2025.!');
  console.log('   (Diğer kurslar hala: edura123)');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Güncelleme hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

