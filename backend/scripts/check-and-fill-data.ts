/**
 * Veritabanındaki tabloları kontrol eder ve boş olanları doldurur
 * Maltepe Zambak Kursu için örnek veriler oluşturur
 */

import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🔍 Veritabanı durumu kontrol ediliyor...\n');

  // 1. Kursları kontrol et
  const kurslar = await prisma.kurs.findMany();
  console.log(`📚 Kurs sayısı: ${kurslar.length}`);
  
  // Maltepe Zambak Kursu'nu bul
  let maltepeZambak = kurslar.find(k => k.ad.includes('Maltepe') || k.ad.includes('Zambak'));
  
  if (!maltepeZambak) {
    console.log('⚠️ Maltepe Zambak Kursu bulunamadı, oluşturuluyor...');
    maltepeZambak = await prisma.kurs.create({
      data: {
        ad: 'Maltepe Zambak Kursu',
        adres: 'Maltepe, İstanbul',
        telefon: '0216 555 1234',
        aktif: true
      }
    });
    console.log('✅ Maltepe Zambak Kursu oluşturuldu');
  }

  const kursId = maltepeZambak.id;
  console.log(`\n📍 Kurs ID: ${kursId} - ${maltepeZambak.ad}`);

  // 2. Sınıfları kontrol et
  const siniflar = await prisma.sinif.findMany({ where: { kursId } });
  console.log(`\n🏫 Sınıf sayısı: ${siniflar.length}`);

  // Eksik sınıfları oluştur (5-A'dan 12-B'ye kadar)
  const gerekliSiniflar = [
    { ad: '5-A', seviye: 5, tip: 'ORTAOKUL' as const },
    { ad: '5-B', seviye: 5, tip: 'ORTAOKUL' as const },
    { ad: '6-A', seviye: 6, tip: 'ORTAOKUL' as const },
    { ad: '6-B', seviye: 6, tip: 'ORTAOKUL' as const },
    { ad: '7-A', seviye: 7, tip: 'ORTAOKUL' as const },
    { ad: '7-B', seviye: 7, tip: 'ORTAOKUL' as const },
    { ad: '8-A', seviye: 8, tip: 'ORTAOKUL' as const },
    { ad: '8-B', seviye: 8, tip: 'ORTAOKUL' as const },
    { ad: '9-A', seviye: 9, tip: 'LISE' as const },
    { ad: '9-B', seviye: 9, tip: 'LISE' as const },
    { ad: '10-A', seviye: 10, tip: 'LISE' as const },
    { ad: '10-B', seviye: 10, tip: 'LISE' as const },
    { ad: '11-A', seviye: 11, tip: 'LISE' as const },
    { ad: '11-B', seviye: 11, tip: 'LISE' as const },
    { ad: '12-A', seviye: 12, tip: 'LISE' as const },
    { ad: '12-B', seviye: 12, tip: 'LISE' as const },
  ];

  for (const s of gerekliSiniflar) {
    const exists = siniflar.find(sinif => sinif.ad === s.ad);
    if (!exists) {
      await prisma.sinif.create({
        data: { ...s, kursId }
      });
      console.log(`  ✅ ${s.ad} sınıfı oluşturuldu`);
    }
  }

  // Güncel sınıf listesini al
  const guncelSiniflar = await prisma.sinif.findMany({ where: { kursId } });

  // 3. Kullanıcıları kontrol et
  const users = await prisma.user.findMany({ where: { kursId } });
  console.log(`\n👥 Kullanıcı sayısı: ${users.length}`);
  
  const roller = {
    mudur: users.filter(u => u.role === 'mudur').length,
    ogretmen: users.filter(u => u.role === 'ogretmen').length,
    sekreter: users.filter(u => u.role === 'sekreter').length,
    ogrenci: users.filter(u => u.role === 'ogrenci').length,
    veli: users.filter(u => u.role === 'veli').length,
  };
  console.log('  Roller:', roller);

  // 4. Dersleri (Course) kontrol et
  const dersler = await prisma.course.findMany({
    where: { sinif: { kursId } },
    include: { sinif: true, ogretmen: true }
  });
  console.log(`\n📖 Ders sayısı: ${dersler.length}`);

  // Eğer ders yoksa, öğretmenlere göre ders oluştur
  if (dersler.length === 0) {
    console.log('  ⚠️ Ders bulunamadı, oluşturuluyor...');
    
    // Öğretmenleri al
    const ogretmenler = await prisma.user.findMany({
      where: { kursId, role: 'ogretmen', aktif: true }
    });

    // Her sınıf için dersler oluştur
    const dersAdlari = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'];
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const saatler = [
      { baslangic: '09:00', bitis: '09:45' },
      { baslangic: '10:00', bitis: '10:45' },
      { baslangic: '11:00', bitis: '11:45' },
      { baslangic: '13:00', bitis: '13:45' },
      { baslangic: '14:00', bitis: '14:45' },
    ];

    // Branşa göre öğretmen eşleştirme
    const bransEsleme: Record<string, string[]> = {
      'Matematik': ['Matematik'],
      'Türkçe': ['Türkçe', 'Edebiyat'],
      'Fen Bilimleri': ['Fen', 'Fizik', 'Kimya', 'Biyoloji'],
      'Sosyal Bilgiler': ['Sosyal', 'Tarih', 'Coğrafya'],
      'İngilizce': ['İngilizce', 'Yabancı Dil'],
    };

    for (const sinif of guncelSiniflar) {
      for (let i = 0; i < dersAdlari.length; i++) {
        const dersAdi = dersAdlari[i];
        const gun = gunler[i % gunler.length];
        const saat = saatler[i % saatler.length];

        // Uygun öğretmen bul
        let ogretmen = ogretmenler.find(o => {
          if (!o.brans) return false;
          const uygunBranslar = bransEsleme[dersAdi] || [];
          return uygunBranslar.some(b => o.brans!.toLowerCase().includes(b.toLowerCase()));
        });

        // Bulunamazsa rastgele bir öğretmen seç
        if (!ogretmen && ogretmenler.length > 0) {
          ogretmen = ogretmenler[i % ogretmenler.length];
        }

        if (ogretmen) {
          await prisma.course.create({
            data: {
              ad: dersAdi,
              aciklama: `${sinif.ad} sınıfı ${dersAdi} dersi`,
              sinifId: sinif.id,
              ogretmenId: ogretmen.id,
              gun,
              baslangicSaati: saat.baslangic,
              bitisSaati: saat.bitis,
              aktif: true
            }
          });
        }
      }
      console.log(`  ✅ ${sinif.ad} için dersler oluşturuldu`);
    }
  }

  // 5. Ders kayıtlarını kontrol et (öğrenci-ders ilişkisi)
  const dersKayitlari = await prisma.courseEnrollment.count();
  console.log(`\n📝 Ders Kayıt sayısı: ${dersKayitlari}`);

  // Öğrencileri kendi sınıflarının derslerine kaydet
  if (dersKayitlari === 0) {
    console.log('  ⚠️ Ders kayıtları oluşturuluyor...');
    
    const ogrenciler = await prisma.user.findMany({
      where: { kursId, role: 'ogrenci', aktif: true, sinifId: { not: null } }
    });

    for (const ogrenci of ogrenciler) {
      const sinifDersleri = await prisma.course.findMany({
        where: { sinifId: ogrenci.sinifId!, aktif: true }
      });

      for (const ders of sinifDersleri) {
        await prisma.courseEnrollment.upsert({
          where: {
            ogrenciId_courseId: { ogrenciId: ogrenci.id, courseId: ders.id }
          },
          create: {
            ogrenciId: ogrenci.id,
            courseId: ders.id,
            aktif: true
          },
          update: {}
        });
      }
    }
    console.log(`  ✅ ${ogrenciler.length} öğrenci için ders kayıtları oluşturuldu`);
  }

  // 6. Yoklama kayıtlarını kontrol et
  const yoklamalar = await prisma.yoklama.count();
  console.log(`\n✅ Yoklama kayıt sayısı: ${yoklamalar}`);

  // 7. Ödev sayısını kontrol et
  const odevler = await prisma.odev.count();
  console.log(`📋 Ödev sayısı: ${odevler}`);

  // 8. Online sınav sayısını kontrol et
  const onlineSinavlar = await prisma.onlineSinav.count();
  console.log(`📝 Online sınav sayısı: ${onlineSinavlar}`);

  // 9. Duyuru sayısını kontrol et
  const duyurular = await prisma.duyuru.count();
  console.log(`📢 Duyuru sayısı: ${duyurular}`);

  // 10. Mesaj sayısını kontrol et
  const mesajlar = await prisma.message.count();
  console.log(`💬 Mesaj sayısı: ${mesajlar}`);

  // Final özet
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERİTABANI ÖZETİ');
  console.log('='.repeat(50));
  
  const finalCounts = {
    kurslar: await prisma.kurs.count(),
    siniflar: await prisma.sinif.count(),
    kullanicilar: await prisma.user.count(),
    dersler: await prisma.course.count(),
    dersKayitlari: await prisma.courseEnrollment.count(),
    yoklamalar: await prisma.yoklama.count(),
    odevler: await prisma.odev.count(),
    onlineSinavlar: await prisma.onlineSinav.count(),
    duyurular: await prisma.duyuru.count(),
    mesajlar: await prisma.message.count(),
  };

  Object.entries(finalCounts).forEach(([key, value]) => {
    const status = value > 0 ? '✅' : '⚠️';
    console.log(`${status} ${key}: ${value}`);
  });

  console.log('\n✨ Kontrol tamamlandı!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

