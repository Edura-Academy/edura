import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

// Branşlara göre örnek sorular
const bransOrnek: Record<string, Array<{ soru: string; secenekler: string[]; dogru: string; aciklama: string; altKonu: string; seviye: number; zorluk: number }>> = {
  'Matematik': [
    { soru: '√81 kaçtır?', secenekler: ['7', '8', '9', '10'], dogru: 'C', aciklama: '9×9=81', altKonu: 'Kök', seviye: 8, zorluk: 1 },
    { soru: '3x + 6 = 15 ise x kaçtır?', secenekler: ['2', '3', '4', '5'], dogru: 'B', aciklama: '3x=9, x=3', altKonu: 'Denklem', seviye: 7, zorluk: 2 },
    { soru: 'x² - 4 = 0 denkleminin kökleri?', secenekler: ['±1', '±2', '±3', '±4'], dogru: 'B', aciklama: 'x²=4, x=±2', altKonu: 'İkinci Derece', seviye: 9, zorluk: 3 },
    { soru: 'sin30° kaçtır?', secenekler: ['1/2', '√2/2', '√3/2', '1'], dogru: 'A', aciklama: 'sin30°=1/2', altKonu: 'Trigonometri', seviye: 10, zorluk: 3 },
    { soru: '∫x² dx = ?', secenekler: ['x³/3+C', 'x²/2+C', '2x+C', 'x³+C'], dogru: 'A', aciklama: 'İntegral kuralı', altKonu: 'İntegral', seviye: 12, zorluk: 4 },
  ],
  'Fizik': [
    { soru: 'Kuvvet birimi nedir?', secenekler: ['Joule', 'Watt', 'Newton', 'Pascal'], dogru: 'C', aciklama: 'F=ma, birimi Newton', altKonu: 'Kuvvet', seviye: 9, zorluk: 1 },
    { soru: 'v=100m/s, t=10s ise yol?', secenekler: ['500m', '1000m', '1500m', '2000m'], dogru: 'B', aciklama: 'x=v×t=1000m', altKonu: 'Hareket', seviye: 9, zorluk: 2 },
    { soru: 'E=mc² formülünde c neyi temsil eder?', secenekler: ['Kütle', 'Enerji', 'Işık hızı', 'İvme'], dogru: 'C', aciklama: 'c=ışık hızı', altKonu: 'Modern Fizik', seviye: 12, zorluk: 3 },
    { soru: 'V=12V, R=4Ω ise I=?', secenekler: ['2A', '3A', '4A', '6A'], dogru: 'B', aciklama: 'I=V/R=3A', altKonu: 'Elektrik', seviye: 11, zorluk: 3 },
  ],
  'Kimya': [
    { soru: 'Suyun formülü nedir?', secenekler: ['H₂O', 'CO₂', 'NaCl', 'O₂'], dogru: 'A', aciklama: 'Su=H₂O', altKonu: 'Bileşikler', seviye: 9, zorluk: 1 },
    { soru: 'pH<7 olan çözeltiler?', secenekler: ['Bazik', 'Nötr', 'Asidik', 'Tuzlu'], dogru: 'C', aciklama: 'pH<7 asidik', altKonu: 'Asit-Baz', seviye: 10, zorluk: 2 },
    { soru: '1 mol H₂O kaç gram?', secenekler: ['16g', '17g', '18g', '20g'], dogru: 'C', aciklama: '2×1+16=18g', altKonu: 'Mol', seviye: 10, zorluk: 3 },
  ],
  'Biyoloji': [
    { soru: 'Hücrenin enerji santrali?', secenekler: ['Ribozom', 'Mitokondri', 'Golgi', 'Lizozom'], dogru: 'B', aciklama: 'Mitokondri ATP üretir', altKonu: 'Hücre', seviye: 9, zorluk: 1 },
    { soru: 'DNA\'nın açılımı?', secenekler: ['Deoksiribonükleik Asit', 'Diribonükleik Asit', 'Dinükleik Asit', 'Dinükler Asit'], dogru: 'A', aciklama: 'DNA açılımı', altKonu: 'Genetik', seviye: 9, zorluk: 2 },
    { soru: 'Fotosentezde açığa çıkan gaz?', secenekler: ['CO₂', 'N₂', 'O₂', 'H₂'], dogru: 'C', aciklama: 'Oksijen açığa çıkar', altKonu: 'Fotosentez', seviye: 10, zorluk: 2 },
  ],
  'Türkçe': [
    { soru: '"Kitaplar" kelimesinin kökü?', secenekler: ['Kit', 'Kita', 'Kitap', 'Kitapl'], dogru: 'C', aciklama: 'Kök: Kitap', altKonu: 'Kök-Ek', seviye: 5, zorluk: 1 },
    { soru: '"Güzel" hangi sözcük türü?', secenekler: ['İsim', 'Fiil', 'Sıfat', 'Zarf'], dogru: 'C', aciklama: 'Niteleme sıfatı', altKonu: 'Sözcük Türleri', seviye: 6, zorluk: 2 },
    { soru: 'Nutuk kimin eseri?', secenekler: ['Yahya Kemal', 'Mehmet Akif', 'Atatürk', 'Namık Kemal'], dogru: 'C', aciklama: 'Atatürk yazmıştır', altKonu: 'Edebiyat', seviye: 8, zorluk: 2 },
  ],
  'Tarih': [
    { soru: 'Atatürk hangi yıl doğdu?', secenekler: ['1879', '1880', '1881', '1882'], dogru: 'C', aciklama: '1881 Selanik', altKonu: 'Atatürk', seviye: 8, zorluk: 1 },
    { soru: 'TBMM ne zaman açıldı?', secenekler: ['1919', '1920', '1921', '1922'], dogru: 'B', aciklama: '23 Nisan 1920', altKonu: 'Kurtuluş Savaşı', seviye: 8, zorluk: 2 },
    { soru: 'İstanbul ne zaman fethedildi?', secenekler: ['1453', '1454', '1455', '1456'], dogru: 'A', aciklama: '29 Mayıs 1453', altKonu: 'Osmanlı', seviye: 10, zorluk: 2 },
  ],
  'Coğrafya': [
    { soru: 'Türkiye\'nin başkenti?', secenekler: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], dogru: 'B', aciklama: 'Ankara başkenttir', altKonu: 'Türkiye', seviye: 5, zorluk: 1 },
    { soru: 'En büyük okyanus?', secenekler: ['Atlantik', 'Hint', 'Pasifik', 'Arktik'], dogru: 'C', aciklama: 'Pasifik en büyük', altKonu: 'Dünya', seviye: 9, zorluk: 2 },
    { soru: 'Türkiye\'nin en uzun nehri?', secenekler: ['Sakarya', 'Kızılırmak', 'Yeşilırmak', 'Fırat'], dogru: 'B', aciklama: 'Kızılırmak 1355km', altKonu: 'Türkiye', seviye: 9, zorluk: 2 },
  ],
  'İngilizce': [
    { soru: '"Apple" ne demek?', secenekler: ['Armut', 'Elma', 'Portakal', 'Muz'], dogru: 'B', aciklama: 'Apple=Elma', altKonu: 'Vocabulary', seviye: 5, zorluk: 1 },
    { soru: '"I ___ a student" boşluk?', secenekler: ['is', 'am', 'are', 'be'], dogru: 'B', aciklama: 'I am kullanılır', altKonu: 'Grammar', seviye: 5, zorluk: 1 },
    { soru: '"Beautiful" zıt anlamlısı?', secenekler: ['Nice', 'Ugly', 'Pretty', 'Good'], dogru: 'B', aciklama: 'Beautiful↔Ugly', altKonu: 'Vocabulary', seviye: 7, zorluk: 2 },
  ],
  'Fen Bilimleri': [
    { soru: 'Suyun kaynama noktası?', secenekler: ['90°C', '100°C', '110°C', '120°C'], dogru: 'B', aciklama: '100°C\'de kaynar', altKonu: 'Madde', seviye: 5, zorluk: 1 },
    { soru: 'Güneş sistemi merkezi?', secenekler: ['Dünya', 'Ay', 'Güneş', 'Mars'], dogru: 'C', aciklama: 'Güneş merkezde', altKonu: 'Astronomi', seviye: 6, zorluk: 1 },
    { soru: 'Canlıların en küçük birimi?', secenekler: ['Atom', 'Hücre', 'Molekül', 'Organ'], dogru: 'B', aciklama: 'Hücre temel birim', altKonu: 'Canlılar', seviye: 6, zorluk: 2 },
  ],
  'Sosyal Bilgiler': [
    { soru: 'Türkiye kaç coğrafi bölge?', secenekler: ['5', '6', '7', '8'], dogru: 'C', aciklama: '7 coğrafi bölge', altKonu: 'Türkiye', seviye: 5, zorluk: 1 },
    { soru: 'İlk Türk devleti?', secenekler: ['Osmanlı', 'Göktürk', 'Hun', 'Selçuklu'], dogru: 'C', aciklama: 'Asya Hun Devleti', altKonu: 'Tarih', seviye: 6, zorluk: 2 },
  ],
  'Din Kültürü': [
    { soru: 'İslam\'ın 5 şartından biri?', secenekler: ['Oruç', 'Kurban', 'Sadaka', 'Teravih'], dogru: 'A', aciklama: 'Oruç 5 şarttan biri', altKonu: 'İbadetler', seviye: 5, zorluk: 1 },
    { soru: 'Hz. Muhammed nerede doğdu?', secenekler: ['Medine', 'Mekke', 'Taif', 'Kudüs'], dogru: 'B', aciklama: 'Mekke\'de doğdu', altKonu: 'Peygamberler', seviye: 6, zorluk: 1 },
  ],
};

// Haftanın günlerine göre branş sırası (Ortaokul)
const ortaokulBransGunleri: Record<number, string> = {
  0: 'Matematik',      // Pazar
  1: 'Türkçe',         // Pazartesi
  2: 'Fen Bilimleri',  // Salı
  3: 'Sosyal Bilgiler',// Çarşamba
  4: 'İngilizce',      // Perşembe
  5: 'Matematik',      // Cuma
  6: 'Din Kültürü',    // Cumartesi
};

// Haftanın günlerine göre branş sırası (Lise)
const liseBransGunleri: Record<number, string> = {
  0: 'Matematik',  // Pazar
  1: 'Fizik',      // Pazartesi
  2: 'Kimya',      // Salı
  3: 'Biyoloji',   // Çarşamba
  4: 'Türkçe',     // Perşembe
  5: 'Tarih',      // Cuma
  6: 'Coğrafya',   // Cumartesi
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('📚 Öğretmen Soru Havuzu Seed Başlıyor...\n');

  // Tüm öğretmenleri al
  const ogretmenler = await prisma.user.findMany({
    where: { role: 'ogretmen', aktif: true },
    include: { kurs: true }
  });

  console.log(`👨‍🏫 ${ogretmenler.length} öğretmen bulundu\n`);

  // Ali Kaya'yı bul (Maltepe Zambak - Matematik)
  const aliKaya = ogretmenler.find(o => 
    o.ad === 'Ali' && o.soyad === 'Kaya' && o.kurs?.ad?.includes('Zambak')
  );

  if (aliKaya) {
    console.log(`🎯 Ali Kaya bulundu: ${aliKaya.email}\n`);
  }

  // Mevcut soruları temizle (yeniden oluşturmak için)
  await prisma.soruHavuzu.deleteMany({ where: { ekleyenId: { not: null } } });
  console.log('🗑️ Eski öğretmen soruları temizlendi\n');

  let toplamSoru = 0;
  let aliKayaSoruSayisi = 0;

  for (const ogretmen of ogretmenler) {
    const brans = ogretmen.brans || 'Matematik';
    const ornekler = bransOrnek[brans] || bransOrnek['Matematik'];
    
    // Ali Kaya için 9 soru, diğerleri için 20 soru
    const soruSayisi = (aliKaya && ogretmen.id === aliKaya.id) ? 9 : 20;
    
    if (aliKaya && ogretmen.id === aliKaya.id) {
      aliKayaSoruSayisi = soruSayisi;
    }

    for (let i = 0; i < soruSayisi; i++) {
      const ornek = ornekler[i % ornekler.length];
      const suffix = i > 0 ? ` (${i + 1})` : '';
      
      await prisma.soruHavuzu.create({
        data: {
          soruMetni: ornek.soru + suffix,
          secenekler: JSON.stringify(ornek.secenekler),
          dogruCevap: ornek.dogru,
          aciklama: ornek.aciklama,
          ekleyenId: ogretmen.id,
          konu: brans,
          altKonu: ornek.altKonu,
          sinifSeviyesi: ornek.seviye,
          hedefSiniflar: JSON.stringify([ornek.seviye, ornek.seviye + 1]),
          zorluk: ornek.zorluk,
          aktif: true,
          onaylandiMi: true,
        }
      });
      toplamSoru++;
    }
    
    console.log(`   ✅ ${ogretmen.ad} ${ogretmen.soyad} (${brans}): ${soruSayisi} soru`);
  }

  console.log(`\n📊 Toplam ${toplamSoru} soru oluşturuldu\n`);

  // ==================== BİLDİRİMLER ====================
  console.log('🔔 Soru sayısı düşük öğretmenlere bildirim gönderiliyor...\n');

  // Her öğretmenin soru sayısını kontrol et
  const soruSayilari = await prisma.soruHavuzu.groupBy({
    by: ['ekleyenId'],
    where: { ekleyenId: { not: null }, aktif: true },
    _count: true
  });

  let bildirimCount = 0;
  for (const ss of soruSayilari) {
    if (ss._count < 10 && ss.ekleyenId) {
      const ogretmen = ogretmenler.find(o => o.id === ss.ekleyenId);
      if (ogretmen) {
        // Mevcut bildirimi kontrol et
        const existing = await prisma.notification.findFirst({
          where: {
            userId: ogretmen.id,
            baslik: 'Soru Havuzu Uyarısı'
          }
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: ogretmen.id,
              tip: NotificationType.SISTEM,
              baslik: 'Soru Havuzu Uyarısı',
              mesaj: `Soru havuzunuzda sadece ${ss._count} soru bulunuyor. Öğrencileriniz için daha fazla soru eklemenizi öneririz. (Minimum: 10 soru)`,
              okundu: false,
            }
          });
          console.log(`   ⚠️ ${ogretmen.ad} ${ogretmen.soyad}: ${ss._count} soru - BİLDİRİM GÖNDERİLDİ`);
          bildirimCount++;
        }
      }
    }
  }

  console.log(`\n📬 ${bildirimCount} bildirim gönderildi\n`);

  // ==================== GÜNÜN SORULARINI GÜNCELLE (BRANŞA GÖRE) ====================
  console.log('📅 Günün soruları branşlara göre güncelleniyor...\n');

  const now = new Date();
  let guncellemeSayisi = 0;

  // Son 30 gün için günün sorularını güncelle
  for (let i = 0; i < 30; i++) {
    const tarih = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    tarih.setHours(0, 0, 0, 0);
    const gun = tarih.getDay(); // 0=Pazar, 1=Pazartesi...

    // Her sınıf seviyesi için
    for (let seviye = 5; seviye <= 12; seviye++) {
      // Ortaokul (5-8) veya Lise (9-12) branş sırası
      const bransGunleri = seviye <= 8 ? ortaokulBransGunleri : liseBransGunleri;
      const hedefBrans = bransGunleri[gun];

      // Bu branştan uygun bir soru bul
      const uygunSoru = await prisma.soruHavuzu.findFirst({
        where: {
          konu: hedefBrans,
          sinifSeviyesi: { lte: seviye },
          aktif: true,
        },
        orderBy: { sorulmaSayisi: 'asc' } // En az sorulan soruyu seç
      });

      if (uygunSoru) {
        try {
          // Önce mevcut kaydı kontrol et
          const existing = await prisma.gununSorusu.findUnique({
            where: { tarih_sinifSeviyesi: { tarih, sinifSeviyesi: seviye } }
          });
          
          if (existing) {
            await prisma.gununSorusu.update({
              where: { id: existing.id },
              data: {
                soruHavuzuId: uygunSoru.id,
                soruMetni: uygunSoru.soruMetni,
                secenekler: uygunSoru.secenekler,
                dogruCevap: uygunSoru.dogruCevap,
                aciklama: uygunSoru.aciklama,
                zorluk: uygunSoru.zorluk,
                konu: uygunSoru.konu,
              }
            });
          } else {
            await prisma.gununSorusu.create({
              data: {
                tarih,
                sinifSeviyesi: seviye,
                soruHavuzuId: uygunSoru.id,
                soruMetni: uygunSoru.soruMetni,
                secenekler: uygunSoru.secenekler,
                dogruCevap: uygunSoru.dogruCevap,
                aciklama: uygunSoru.aciklama,
                zorluk: uygunSoru.zorluk,
                xpOdulu: [10, 15, 20, 30, 50][uygunSoru.zorluk - 1] || 20,
                konu: uygunSoru.konu,
              }
            });
          }
          guncellemeSayisi++;
        } catch (e) {
          // Hata durumunda atla
        }
      }
    }
  }

  console.log(`   ✅ ${guncellemeSayisi} günün sorusu branşlara göre güncellendi\n`);

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 ÖĞRETMEN SORU HAVUZU SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Branş bazlı soru sayıları
  const bransSayilari = await prisma.soruHavuzu.groupBy({
    by: ['konu'],
    where: { ekleyenId: { not: null } },
    _count: true
  });

  console.log('📊 BRANŞ BAZLI SORU DAĞILIMI:');
  for (const bs of bransSayilari) {
    console.log(`   📖 ${bs.konu}: ${bs._count} soru`);
  }

  // Ali Kaya özel durumu
  if (aliKaya) {
    console.log('\n⚠️ ALİ KAYA ÖZEL DURUMU:');
    console.log(`   📌 Branş: ${aliKaya.brans}`);
    console.log(`   📌 Soru Sayısı: ${aliKayaSoruSayisi} (Minimum: 10)`);
    console.log(`   📌 Bildirim: GÖNDERİLDİ ✅`);
  }

  // Haftanın günleri branş sırası
  console.log('\n📅 HAFTANIN GÜNLERİ - BRANŞ SIRASI:');
  console.log('\n   ORTAOKUL (5-8. Sınıf):');
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  for (let i = 0; i < 7; i++) {
    console.log(`      ${gunler[i]}: ${ortaokulBransGunleri[i]}`);
  }
  console.log('\n   LİSE (9-12. Sınıf):');
  for (let i = 0; i < 7; i++) {
    console.log(`      ${gunler[i]}: ${liseBransGunleri[i]}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

