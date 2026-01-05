import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ÖĞRETMENLERE DERS ATAMA ===\n');

  // Dersi olmayan öğretmenleri bul
  const ogretmenler = await prisma.user.findMany({
    where: {
      role: 'ogretmen',
      ogretmenDersleri: { none: {} }
    },
    include: { kurs: true }
  });

  console.log(`Dersi olmayan ${ogretmenler.length} öğretmen bulundu.\n`);

  for (const ogretmen of ogretmenler) {
    if (!ogretmen.kursId) {
      console.log(`⚠️ ${ogretmen.ad} ${ogretmen.soyad} - Kurs atanmamış, atlanıyor.`);
      continue;
    }

    // Bu öğretmenin kursundaki sınıfları bul
    const siniflar = await prisma.sinif.findMany({
      where: {
        kursId: ogretmen.kursId,
        aktif: true
      },
      orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
    });

    if (siniflar.length === 0) {
      console.log(`⚠️ ${ogretmen.ad} ${ogretmen.soyad} - Kursta sınıf yok, atlanıyor.`);
      continue;
    }

    // Branşa göre hangi sınıflara ders vereceğini belirle
    let hedefSiniflar = siniflar;
    
    // Ortaokul branşları (5-8. sınıflar)
    const ortaokulBranslar = ['Fen Bilimleri', 'Sosyal Bilgiler'];
    // Lise branşları (9-12. sınıflar)
    const liseBranslar = ['Fizik', 'Kimya', 'Biyoloji'];
    // Tüm sınıflar için
    const genelBranslar = ['Matematik', 'Türkçe', 'İngilizce'];

    if (ortaokulBranslar.includes(ogretmen.brans || '')) {
      hedefSiniflar = siniflar.filter(s => s.seviye <= 8);
    } else if (liseBranslar.includes(ogretmen.brans || '')) {
      hedefSiniflar = siniflar.filter(s => s.seviye >= 9);
    }
    // genelBranslar için tüm sınıflar

    console.log(`\n👨‍🏫 ${ogretmen.ad} ${ogretmen.soyad} (${ogretmen.brans}) - ${ogretmen.kurs?.ad}`);
    console.log(`   Hedef sınıf sayısı: ${hedefSiniflar.length}`);

    // Her sınıf için ders oluştur
    const dersAdi = ogretmen.brans || 'Genel';
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    let dersIndex = 0;

    for (const sinif of hedefSiniflar) {
      const gun = gunler[dersIndex % gunler.length];
      const saat = 9 + Math.floor(dersIndex / gunler.length);
      
      await prisma.course.create({
        data: {
          ad: `${dersAdi} - ${sinif.ad}`,
          aciklama: `${ogretmen.ad} ${ogretmen.soyad} tarafından verilen ${dersAdi} dersi`,
          sinifId: sinif.id,
          ogretmenId: ogretmen.id,
          gun,
          baslangicSaati: `${saat.toString().padStart(2, '0')}:00`,
          bitisSaati: `${(saat + 1).toString().padStart(2, '0')}:00`,
          aktif: true
        }
      });
      
      dersIndex++;
    }

    console.log(`   ✅ ${hedefSiniflar.length} ders oluşturuldu.`);
  }

  console.log('\n=== İŞLEM TAMAMLANDI ===');

  // Özet
  const toplamDers = await prisma.course.count();
  console.log(`Toplam ders sayısı: ${toplamDers}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

