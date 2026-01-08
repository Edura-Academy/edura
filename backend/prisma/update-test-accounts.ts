import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Test hesapları güncelleniyor...\n');

  // 1. Önce ilgili kullanıcıları bul
  const onurBurak = await prisma.user.findFirst({
    where: { email: { contains: 'onurburaksu' } }
  });

  const omerMusab = await prisma.user.findFirst({
    where: { email: { contains: 'omermusabcicek' } }
  });

  const yahyaCemrek = await prisma.user.findFirst({
    where: { email: { contains: 'yahyacemrek' } }
  });

  if (!onurBurak || !omerMusab || !yahyaCemrek) {
    console.log('❌ Kullanıcılar bulunamadı!');
    console.log('  - Onur Burak:', onurBurak?.id || 'YOK');
    console.log('  - Ömer Musab:', omerMusab?.id || 'YOK');
    console.log('  - Yahya Çemrek:', yahyaCemrek?.id || 'YOK');
    return;
  }

  console.log('✅ Kullanıcılar bulundu:');
  console.log(`  - Onur Burak Su (${onurBurak.email}) - Şu anki rol: ${onurBurak.role}`);
  console.log(`  - Ömer Musab Çiçek (${omerMusab.email}) - Şu anki rol: ${omerMusab.role}`);
  console.log(`  - Yahya Çemrek (${yahyaCemrek.email}) - Şu anki rol: ${yahyaCemrek.role}`);

  // 2. Rol değişikliklerini yap
  console.log('\n🔄 Rol değişiklikleri yapılıyor...');

  // Onur Burak'ı veli yap
  await prisma.user.update({
    where: { id: onurBurak.id },
    data: {
      role: Role.veli,
      sinifId: null,
      ogrenciNo: null
    }
  });
  console.log('  ✅ Onur Burak Su → VELİ yapıldı');

  // Yahya Çemrek'i öğrenci yap (Ömer Musab'ın sınıfına)
  await prisma.user.update({
    where: { id: yahyaCemrek.id },
    data: {
      role: Role.ogrenci,
      sinifId: omerMusab.sinifId,
      ogrenciNo: `STU-${Date.now()}`
    }
  });
  console.log('  ✅ Yahya Çemrek → ÖĞRENCİ yapıldı');

  // Ömer Musab'ın velisini Onur Burak yap
  await prisma.user.update({
    where: { id: omerMusab.id },
    data: {
      veliId: onurBurak.id
    }
  });
  console.log('  ✅ Ömer Musab\'ın velisi → Onur Burak Su olarak ayarlandı');

  // 3. Email'lerden @edura.com kaldır (sadece test hesapları için)
  console.log('\n🔄 Email\'ler güncelleniyor (@edura.com kaldırılıyor)...');
  
  const testEmails = [
    // Müdürler
    'busrabuyuktanir@edura.com',
    'mervecevizcipinar@edura.com',
    // Öğretmenler
    'zeynepucar@edura.com',
    'muratbarisakyuz@edura.com',
    'emineumaykilinc@edura.com',
    'ziyaanilsen@edura.com',
    'damlamengus@edura.com',
    'mervehazaniscan@edura.com',
    'nursackurt@edura.com',
    'seydakarci@edura.com',
    // Öğrenciler
    'akilrahmanturza@edura.com',
    'alirizamistik@edura.com',
    'masihullahomar@edura.com',
    'buraktuzcu@edura.com',
    'egemenkoraykeles@edura.com',
    'muhammetbatuhankaranfil@edura.com',
    'efekocal@edura.com',
    'yusufipek@edura.com',
    'gokhancoban@edura.com',
    'elifguven@edura.com',
    'nilaykuru@edura.com',
    'emresen@edura.com',
    'emirhanoymak@edura.com',
    'omermusabcicek@edura.com',
    'onurburaksu@edura.com',
    'emreyanalak@edura.com',
    'mahiryasinbaskes@edura.com',
    'muhammedmehdiileri@edura.com',
    'erentaskiran@edura.com',
    'huseynteymurzade@edura.com',
    'ziyabaranutuglu@edura.com',
    'farukemrebakir@edura.com',
    'mericsarikaya@edura.com',
    'sudegocmez@edura.com',
    'fehmikoraymullaoglu@edura.com',
    // Veliler
    'furkanc@edura.com',
    'muhammedzahiddemirel@edura.com',
    'ferhatisik@edura.com',
    'tolgaertek@edura.com',
    'muhammedvefayoksul@edura.com',
    'muhammedkizildag@edura.com',
    'ozgurmese@edura.com',
    'yasirarslan@edura.com',
    'muhammetenesildirir@edura.com',
    'mustafamertceylan@edura.com',
    'hayatdiler@edura.com',
    'sevvalculcu@edura.com',
    'mustafatayyipic@edura.com',
    'yahyacemrek@edura.com',
    'umutbarisozdemir@edura.com',
    'yusuferencelebi@edura.com',
    'yusuftarlan@edura.com',
    'eneselysacicek@edura.com',
    'ahmeterenbasali@edura.com',
    'furkankoksalan@edura.com',
    'yusufdurmus@edura.com',
    'furkanadiguzel@edura.com',
    'enesbulut@edura.com',
    'beratoner@edura.com'
  ];

  let updatedCount = 0;
  for (const oldEmail of testEmails) {
    const newEmail = oldEmail.replace('@edura.com', '');
    
    try {
      const result = await prisma.user.updateMany({
        where: { email: oldEmail },
        data: { email: newEmail }
      });
      
      if (result.count > 0) {
        updatedCount++;
        console.log(`  ✅ ${oldEmail} → ${newEmail}`);
      }
    } catch (error: any) {
      console.log(`  ⚠️ ${oldEmail} güncellenemedi: ${error.message}`);
    }
  }

  console.log(`\n✅ Toplam ${updatedCount} email güncellendi`);
  console.log('\n🎉 Tüm güncellemeler tamamlandı!');
  
  // Sonuç özeti
  console.log('\n📋 Özet:');
  console.log('  - Onur Burak Su artık VELİ (Ömer Musab\'ın velisi)');
  console.log('  - Yahya Çemrek artık ÖĞRENCİ');
  console.log('  - Test hesapları artık @edura.com olmadan giriş yapabilir');
  console.log('  - Örnek: busrabuyuktanir (eski: busrabuyuktanir@edura.com)');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

