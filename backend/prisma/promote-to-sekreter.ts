import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fehmi Koray Mullaoğlu → SEKRETERe yükseltiliyor...\n');

  // 1. Kullanıcıyı bul
  const fehmiKoray = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: { contains: 'fehmikoraymullaoglu' } },
        { email: 'fehmikoraymullaoglu@edura.com' }
      ]
    },
    include: {
      kurs: true,
      sinif: true
    }
  });

  if (!fehmiKoray) {
    console.log('❌ Fehmi Koray Mullaoğlu bulunamadı!');
    console.log('   Arama yapılan email: fehmikoraymullaoglu veya fehmikoraymullaoglu@edura.com');
    return;
  }

  console.log('✅ Kullanıcı bulundu:');
  console.log(`   📧 Email: ${fehmiKoray.email}`);
  console.log(`   👤 Ad Soyad: ${fehmiKoray.ad} ${fehmiKoray.soyad}`);
  console.log(`   🏫 Kurs: ${fehmiKoray.kurs?.ad || 'Yok'}`);
  console.log(`   📚 Sınıf: ${fehmiKoray.sinif?.ad || 'Yok'}`);
  console.log(`   🎭 Mevcut Rol: ${fehmiKoray.role}`);

  // 2. Rol değişikliğini yap
  console.log('\n🔄 Rol değişikliği yapılıyor...');

  const updatedUser = await prisma.user.update({
    where: { id: fehmiKoray.id },
    data: {
      role: Role.sekreter,
      // Öğrenci özelliklerini temizle
      sinifId: null,
      ogrenciNo: null,
      // Veli bilgilerini temizle (varsa)
      veliId: null,
      veliAd: null,
      veliSoyad: null,
      veliTelefon: null,
      veliEmail: null
    },
    include: {
      kurs: true
    }
  });

  console.log('\n✅ Rol değişikliği başarılı!');
  console.log('   ────────────────────────────────');
  console.log(`   📧 Email: ${updatedUser.email}`);
  console.log(`   👤 Ad Soyad: ${updatedUser.ad} ${updatedUser.soyad}`);
  console.log(`   🏫 Kurs: ${updatedUser.kurs?.ad || 'Yok'}`);
  console.log(`   🎭 YENİ Rol: ${updatedUser.role}`);
  console.log('   ────────────────────────────────');

  console.log('\n🎉 İşlem tamamlandı!');
  console.log('   Fehmi Koray Mullaoğlu artık Küçükyalı Buket kursunun sekreteri!');
  console.log(`   Giriş bilgileri: ${updatedUser.email} / Edura2025.!`);
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

