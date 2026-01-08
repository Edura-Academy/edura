import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Kurs Sahibi ekleme işlemi başlıyor...\n');

  const hashedPassword = await bcrypt.hash('Edura2025.!', 10);

  // 1. Buket Doğan'ı Kurs Sahibi olarak oluştur
  console.log('👑 Buket Doğan - Kurs Sahibi oluşturuluyor...');
  
  const kursSahibi = await prisma.user.upsert({
    where: { email: 'buketdogan@edura.com' },
    update: { 
      password: hashedPassword,
      role: 'kursSahibi' as any,
    },
    create: {
      email: 'buketdogan@edura.com',
      password: hashedPassword,
      ad: 'Buket',
      soyad: 'Doğan',
      telefon: '0532 555 0001',
      role: 'kursSahibi' as any,
      aktif: true,
    },
  });
  console.log(`   ✅ buketdogan@edura.com (Buket Doğan)`);
  console.log(`   📊 Kurs Sahibi ID: ${kursSahibi.id}\n`);

  // 2. Küçükyalı Buket kursunu bul ve sahipini ata
  console.log('🏫 Küçükyalı Buket kursuna sahip atanıyor...');
  
  const kurs = await prisma.kurs.findFirst({
    where: { ad: 'Küçükyalı Buket' }
  });

  if (kurs) {
    await prisma.kurs.update({
      where: { id: kurs.id },
      data: { sahipId: kursSahibi.id }
    });
    
    // Kurs sahibinin kursId'sini de güncelle
    await prisma.user.update({
      where: { id: kursSahibi.id },
      data: { kursId: kurs.id }
    });
    
    console.log(`   ✅ ${kurs.ad} kursu -> Buket Doğan'a atandı`);
    console.log(`   📊 Kurs ID: ${kurs.id}\n`);
  } else {
    console.log('   ⚠️ Küçükyalı Buket kursu bulunamadı!\n');
  }

  // 3. Diğer kurslara da örnek sahipler atayalım (opsiyonel)
  console.log('🏢 Diğer kursların sahipleri kontrol ediliyor...\n');
  
  const tumKurslar = await prisma.kurs.findMany({
    where: { sahipId: null }
  });

  for (const k of tumKurslar) {
    // Her kurs için varsayılan bir sahip oluştur
    const sahipEmail = `${k.ad.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}sahibi@edura.com`;
    const sahipAd = k.ad.split(' ')[0];
    
    const yeniSahip = await prisma.user.upsert({
      where: { email: sahipEmail },
      update: { 
        password: hashedPassword,
        role: 'kursSahibi' as any,
      },
      create: {
        email: sahipEmail,
        password: hashedPassword,
        ad: sahipAd,
        soyad: 'Sahibi',
        telefon: `0532 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'kursSahibi' as any,
        aktif: true,
        kursId: k.id,
      },
    });

    await prisma.kurs.update({
      where: { id: k.id },
      data: { sahipId: yeniSahip.id }
    });

    console.log(`   ✅ ${k.ad} -> ${yeniSahip.ad} ${yeniSahip.soyad} (${sahipEmail})`);
  }

  console.log('\n✅ Tüm kurs sahipleri başarıyla eklendi!\n');
  
  // Son durumu göster
  const kurslarSonDurum = await prisma.kurs.findMany({
    include: { sahip: { select: { ad: true, soyad: true, email: true } } }
  });

  console.log('📋 Kurs Sahipleri Listesi:');
  console.log('─'.repeat(60));
  for (const k of kurslarSonDurum) {
    console.log(`   ${k.ad} -> ${k.sahip ? `${k.sahip.ad} ${k.sahip.soyad} (${k.sahip.email})` : 'SAHİP YOK'}`);
  }
  console.log('─'.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

