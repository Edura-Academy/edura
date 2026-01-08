import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Veli isimleri havuzu
const veliErkekAdlari = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf',
  'Ömer', 'Murat', 'Burak', 'Emre', 'Cem', 'Can', 'Ege', 'Arda', 'Kaan', 'Berk',
  'Eren', 'Furkan', 'Gökhan', 'Onur', 'Tuna', 'Umut', 'Doruk', 'Emir', 'Kerem', 'Mert',
  'Oğuz', 'Serkan', 'Tolga', 'Yiğit', 'Barış', 'Deniz', 'Efe', 'Koray', 'Melih', 'Selim',
  'Alp', 'Batuhan', 'Berke', 'Bilal', 'Caner', 'Cemal', 'Cengiz', 'Çağatay', 'Çağrı', 'Dağhan',
];

const veliKadinAdlari = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Defne', 'Ece', 'Gizem', 'Naz',
  'Duru', 'Lara', 'Yağmur', 'Ceren', 'Hande', 'İpek', 'Pelin', 'Derya', 'Eylül', 'Ada',
  'Azra', 'Beren', 'Cansu', 'Dilara', 'Esra', 'Gamze', 'Hilal', 'Ilgın', 'Jale', 'Kardelen',
  'Melis', 'Nehir', 'Özge', 'Rana', 'Simge', 'Tuğçe', 'Yaprak', 'Zehra', 'Aslı', 'Başak',
  'Aleyna', 'Ayla', 'Bahar', 'Bengisu', 'Burcu', 'Büşra', 'Cemre', 'Damla', 'Dilan', 'Dilek',
];

// Türkçe karakterleri İngilizce karşılıklarına çevirir
function turkceToEnglish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '');
}

// Kullanılan email'leri takip etmek için Set
const kullanilanEmails = new Set<string>();

async function main() {
  console.log('🌱 Veli Seed İşlemi Başlıyor...\n');

  const hashedPassword = await bcrypt.hash('edura123', 10);

  // Mevcut öğrencileri getir (velisi olmayanlar)
  const ogrenciler = await prisma.user.findMany({
    where: {
      role: Role.ogrenci,
      aktif: true,
      veliId: null // Velisi olmayan öğrenciler
    },
    include: {
      sinif: true,
      kurs: true
    },
    orderBy: [
      { kursId: 'asc' },
      { sinifId: 'asc' },
      { ogrenciNo: 'asc' }
    ]
  });

  console.log(`📊 Veli bekleyen öğrenci sayısı: ${ogrenciler.length}\n`);

  if (ogrenciler.length === 0) {
    console.log('✅ Tüm öğrencilerin velisi mevcut.\n');
    return;
  }

  let veliSayisi = 0;
  let guncellenenOgrenci = 0;

  // Her öğrenci için veli oluştur
  for (const ogrenci of ogrenciler) {
    try {
      // Veli ismi oluştur - öğrencinin soyadını kullan
      const veliCinsiyet = Math.random() > 0.5 ? 'erkek' : 'kadin';
      const veliAdHavuzu = veliCinsiyet === 'erkek' ? veliErkekAdlari : veliKadinAdlari;
      const veliAd = veliAdHavuzu[Math.floor(Math.random() * veliAdHavuzu.length)];
      const veliSoyad = ogrenci.soyad; // Öğrenciyle aynı soyad

      // Benzersiz email oluştur
      let emailBase = `${turkceToEnglish(veliAd)}.${turkceToEnglish(veliSoyad)}`;
      let email = `${emailBase}@veli.edura.com`;
      let counter = 1;
      
      while (kullanilanEmails.has(email)) {
        email = `${emailBase}${counter}@veli.edura.com`;
        counter++;
      }
      kullanilanEmails.add(email);

      // Telefon numarası oluştur
      const telefon = `0555 ${600 + Math.floor(veliSayisi / 100)} ${String(veliSayisi % 1000).padStart(4, '0')}`;

      // Veli oluştur
      const veli = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          ad: veliAd,
          soyad: veliSoyad,
          telefon: telefon,
          role: Role.veli,
          kursId: ogrenci.kursId, // Öğrenciyle aynı kurs
          aktif: true,
        }
      });
      veliSayisi++;

      // Öğrenciyi veliye bağla
      await prisma.user.update({
        where: { id: ogrenci.id },
        data: { veliId: veli.id }
      });
      guncellenenOgrenci++;

      // Her 50 velide bir progress göster
      if (veliSayisi % 50 === 0) {
        console.log(`   ✅ ${veliSayisi} veli oluşturuldu...`);
      }
    } catch (error) {
      console.error(`   ❌ Hata (${ogrenci.ad} ${ogrenci.soyad}):`, error);
    }
  }

  console.log(`\n✅ ${veliSayisi} veli oluşturuldu`);
  console.log(`✅ ${guncellenenOgrenci} öğrenci veliye bağlandı`);

  // ==================== TEST VELİLERİ ====================
  console.log('\n🔐 Test velileri oluşturuluyor...');
  
  // Test öğrencilerini bul ve test velileri oluştur
  const testOgrenciler = await prisma.user.findMany({
    where: {
      email: { startsWith: 'test.' },
      role: Role.ogrenci,
      aktif: true
    },
    include: {
      sinif: true,
      kurs: true
    },
    orderBy: { email: 'asc' }
  });

  console.log(`   📊 Test öğrenci sayısı: ${testOgrenciler.length}`);

  // Test velileri için belirli isimler
  const testVeliIsimleri = [
    // 5-A velileri
    { sinif: '5a.1', veliAd: 'Ahmet', veliSoyad: 'Yılmaz' },
    { sinif: '5a.2', veliAd: 'Ayşe', veliSoyad: 'Kaya' },
    // 5-B velileri
    { sinif: '5b.1', veliAd: 'Mehmet', veliSoyad: 'Demir' },
    { sinif: '5b.2', veliAd: 'Fatma', veliSoyad: 'Çelik' },
    // 6-A velileri
    { sinif: '6a.1', veliAd: 'Ali', veliSoyad: 'Şahin' },
    { sinif: '6a.2', veliAd: 'Zeynep', veliSoyad: 'Aydın' },
    // 6-B velileri
    { sinif: '6b.1', veliAd: 'Mustafa', veliSoyad: 'Öztürk' },
    { sinif: '6b.2', veliAd: 'Elif', veliSoyad: 'Arslan' },
    // 7-A velileri
    { sinif: '7a.1', veliAd: 'Hasan', veliSoyad: 'Koç' },
    { sinif: '7a.2', veliAd: 'Merve', veliSoyad: 'Kurt' },
    // 7-B velileri
    { sinif: '7b.1', veliAd: 'İbrahim', veliSoyad: 'Polat' },
    { sinif: '7b.2', veliAd: 'Selin', veliSoyad: 'Erdoğan' },
    // 8-A velileri (LGS)
    { sinif: '8a.1', veliAd: 'Yusuf', veliSoyad: 'Özkan' },
    { sinif: '8a.2', veliAd: 'Defne', veliSoyad: 'Kılıç' },
    // 8-B velileri (LGS)
    { sinif: '8b.1', veliAd: 'Ömer', veliSoyad: 'Çetin' },
    { sinif: '8b.2', veliAd: 'Ece', veliSoyad: 'Aksoy' },
    // 9-A velileri
    { sinif: '9a.1', veliAd: 'Murat', veliSoyad: 'Ünal' },
    { sinif: '9a.2', veliAd: 'Gizem', veliSoyad: 'Doğan' },
    // 9-B velileri
    { sinif: '9b.1', veliAd: 'Burak', veliSoyad: 'Güneş' },
    { sinif: '9b.2', veliAd: 'Naz', veliSoyad: 'Bayrak' },
    // 10-A velileri
    { sinif: '10a.1', veliAd: 'Emre', veliSoyad: 'Kaplan' },
    { sinif: '10a.2', veliAd: 'Duru', veliSoyad: 'Bozkurt' },
    // 10-B velileri
    { sinif: '10b.1', veliAd: 'Cem', veliSoyad: 'Turan' },
    { sinif: '10b.2', veliAd: 'Lara', veliSoyad: 'Korkmaz' },
    // 11-A velileri
    { sinif: '11a.1', veliAd: 'Can', veliSoyad: 'Yavuz' },
    { sinif: '11a.2', veliAd: 'Yağmur', veliSoyad: 'Sarı' },
    // 11-B velileri
    { sinif: '11b.1', veliAd: 'Ege', veliSoyad: 'Kara' },
    { sinif: '11b.2', veliAd: 'Ceren', veliSoyad: 'Aslan' },
    // 12-A velileri (TYT/AYT)
    { sinif: '12a.1', veliAd: 'Arda', veliSoyad: 'Tekin' },
    { sinif: '12a.2', veliAd: 'Hande', veliSoyad: 'Yıldırım' },
    // 12-B velileri (TYT/AYT)
    { sinif: '12b.1', veliAd: 'Kaan', veliSoyad: 'Şen' },
    { sinif: '12b.2', veliAd: 'İpek', veliSoyad: 'Özdemir' },
  ];

  let testVeliSayisi = 0;

  for (const testVeli of testVeliIsimleri) {
    // Test öğrencisini bul
    const ogrenci = testOgrenciler.find(o => o.email.includes(testVeli.sinif));
    if (!ogrenci) continue;

    // Email oluştur: veli.5a.1@edura.com formatında
    const email = `veli.${testVeli.sinif}@edura.com`;

    try {
      // Veli oluştur veya güncelle
      const veli = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
          email: email,
          password: hashedPassword,
          ad: testVeli.veliAd,
          soyad: testVeli.veliSoyad,
          telefon: `0555 900 ${testVeli.sinif.replace('.', '')}`,
          role: Role.veli,
          kursId: ogrenci.kursId,
          aktif: true,
        }
      });

      // Öğrenciyi veliye bağla
      await prisma.user.update({
        where: { id: ogrenci.id },
        data: { veliId: veli.id }
      });

      testVeliSayisi++;
      console.log(`   ✅ ${email} (${testVeli.veliAd} ${testVeli.veliSoyad}) -> ${ogrenci.ad} ${ogrenci.soyad}`);
    } catch (error) {
      console.error(`   ❌ Hata (${email}):`, error);
    }
  }

  console.log(`\n   📊 ${testVeliSayisi} test velisi oluşturuldu/güncellendi`);

  // ==================== ÖZET ====================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎉 VELİ SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');

  // İstatistikler
  const toplamVeli = await prisma.user.count({ where: { role: Role.veli } });
  const veliliOgrenci = await prisma.user.count({ where: { role: Role.ogrenci, veliId: { not: null } } });
  const velisizOgrenci = await prisma.user.count({ where: { role: Role.ogrenci, veliId: null } });

  console.log('📊 İSTATİSTİKLER:');
  console.log(`   👨‍👩‍👧 Toplam Veli: ${toplamVeli}`);
  console.log(`   ✅ Velisi olan öğrenci: ${veliliOgrenci}`);
  console.log(`   ❌ Velisi olmayan öğrenci: ${velisizOgrenci}`);
  console.log('');

  console.log('🔐 TEST VELİ GİRİŞ BİLGİLERİ (Şifre: edura123):');
  console.log('   ───────────────────────────────────────');
  console.log('   • veli.5a.1@edura.com  (5-A öğrenci velisi)');
  console.log('   • veli.5a.2@edura.com  (5-A öğrenci velisi)');
  console.log('   • veli.8a.1@edura.com  (8-A LGS öğrenci velisi)');
  console.log('   • veli.12a.1@edura.com (12-A TYT/AYT öğrenci velisi)');
  console.log('   • ... (diğer sınıflar için: veli.<sinif><sube>.<sira>@edura.com)');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

