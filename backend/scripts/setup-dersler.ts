import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ortaokul dersleri (5-8. sınıf)
const ortaokulDersleri = [
  'Matematik',
  'Türkçe',
  'Fen Bilimleri',
  'Sosyal Bilgiler',
  'İngilizce'
];

// Lise dersleri (9-12. sınıf)
const liseDersleri = [
  'Matematik',
  'Türk Dili ve Edebiyatı',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'İngilizce'
];

// Ders saatleri
const dersGunleri = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

async function main() {
  console.log('🚀 Ders ve kayıt oluşturma başlıyor...\n');

  // 1. Öğretmenleri bul
  const ogretmenler = await prisma.user.findMany({
    where: { role: 'ogretmen' },
    select: { id: true, ad: true, soyad: true }
  });

  if (ogretmenler.length === 0) {
    console.log('❌ Hiç öğretmen bulunamadı! Önce öğretmen ekleyin.');
    return;
  }

  console.log(`📚 ${ogretmenler.length} öğretmen bulundu.`);

  // 2. Tüm sınıfları al (benzersiz sınıf adlarına göre grupla)
  const siniflar = await prisma.sinif.findMany({
    select: { id: true, ad: true, tip: true, kursId: true },
    orderBy: { ad: 'asc' }
  });

  // Benzersiz sınıf adları (5-A, 5-B, vs.)
  const benzersizSiniflar = new Map<string, typeof siniflar>();
  for (const sinif of siniflar) {
    const key = `${sinif.ad}-${sinif.kursId}`;
    if (!benzersizSiniflar.has(key)) {
      benzersizSiniflar.set(key, []);
    }
    benzersizSiniflar.get(key)!.push(sinif);
  }

  console.log(`🏫 ${siniflar.length} sınıf bulundu.\n`);

  // 3. Her sınıf için dersler oluştur
  let olusturulanDers = 0;
  let olusturulanKayit = 0;

  // Sınıf tipine göre grupla
  const sinifGruplari = new Map<string, typeof siniflar[0][]>();
  
  for (const sinif of siniflar) {
    // Her sınıf için sadece bir kez ders oluştur
    const sinifSeviyesi = sinif.ad.split('-')[0]; // "5", "6", "9", vs.
    const sinifSube = sinif.ad.split('-')[1]; // "A", "B"
    
    const dersListesi = sinif.tip === 'ORTAOKUL' ? ortaokulDersleri : liseDersleri;
    
    for (let i = 0; i < dersListesi.length; i++) {
      const dersAdi = dersListesi[i];
      const ogretmen = ogretmenler[i % ogretmenler.length];
      const gun = dersGunleri[i % dersGunleri.length];
      
      // Ders saati hesapla (09:00'dan başlayarak)
      const saat = 9 + (i % 8);
      const baslangicSaati = `${saat.toString().padStart(2, '0')}:00`;
      const bitisSaati = `${(saat + 1).toString().padStart(2, '0')}:00`;

      // Mevcut ders var mı kontrol et
      const mevcutDers = await prisma.course.findFirst({
        where: {
          ad: dersAdi,
          sinifId: sinif.id
        }
      });

      if (mevcutDers) {
        continue; // Zaten var, atla
      }

      // Ders oluştur
      const ders = await prisma.course.create({
        data: {
          ad: dersAdi,
          aciklama: `${sinif.ad} sınıfı ${dersAdi} dersi`,
          sinifId: sinif.id,
          ogretmenId: ogretmen.id,
          gun,
          baslangicSaati,
          bitisSaati,
          aktif: true
        }
      });

      olusturulanDers++;
      console.log(`  ✅ ${sinif.ad} - ${dersAdi} (${ogretmen.ad} ${ogretmen.soyad})`);

      // Bu sınıftaki öğrencileri derse kayıt et
      const ogrenciler = await prisma.user.findMany({
        where: {
          role: 'ogrenci',
          sinifId: sinif.id
        },
        select: { id: true }
      });

      if (ogrenciler.length > 0) {
        await prisma.courseEnrollment.createMany({
          data: ogrenciler.map(ogr => ({
            ogrenciId: ogr.id,
            courseId: ders.id,
            aktif: true
          })),
          skipDuplicates: true
        });
        olusturulanKayit += ogrenciler.length;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ ${olusturulanDers} ders oluşturuldu`);
  console.log(`✅ ${olusturulanKayit} öğrenci-ders kaydı oluşturuldu`);
  console.log('='.repeat(50));

  // Özet
  const toplamDers = await prisma.course.count();
  const toplamKayit = await prisma.courseEnrollment.count();
  
  console.log(`\n📊 ÖZET:`);
  console.log(`   Toplam ders: ${toplamDers}`);
  console.log(`   Toplam kayıt: ${toplamKayit}`);
}

main()
  .catch(e => {
    console.error('Hata:', e);
  })
  .finally(() => prisma.$disconnect());

