import { PrismaClient, Role, SinifTipi } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== VERİ TANIMLARI ====================

// 5 Kurs
const kurslarData = [
  { ad: 'Maltepe Zambak', kod: 'zambak', adres: 'Cevizli Mah. Tugay Yolu Cad. No:45, Maltepe/İstanbul', telefon: '0216 441 1111' },
  { ad: 'Kadıköy Lale', kod: 'lale', adres: 'Caferağa Mah. Moda Cad. No:78, Kadıköy/İstanbul', telefon: '0216 442 2222' },
  { ad: 'Ataşehir Papatya', kod: 'papatya', adres: 'Küçükbakkalköy Mah. Kayışdağı Cad. No:23, Ataşehir/İstanbul', telefon: '0216 443 3333' },
  { ad: 'Yenisahra Menekşe', kod: 'menekse', adres: 'Yenisahra Mah. Şehit Hakan Sok. No:12, Ataşehir/İstanbul', telefon: '0216 444 4444' },
  { ad: 'Üsküdar Gül', kod: 'gul', adres: 'Altunizade Mah. Kısıklı Cad. No:56, Üsküdar/İstanbul', telefon: '0216 445 5555' },
];

// Müdürler (2'si aynı zamanda öğretmen)
const mudurlerData = [
  { ad: 'Hasan', soyad: 'Yıldırım', brans: 'Matematik' }, // Aynı zamanda öğretmen
  { ad: 'Mehmet', soyad: 'Aydın', brans: null },
  { ad: 'Kemal', soyad: 'Özdemir', brans: 'Fizik' }, // Aynı zamanda öğretmen
  { ad: 'Serkan', soyad: 'Çelik', brans: null },
  { ad: 'Burak', soyad: 'Koçak', brans: null },
];

// Sekreterler
const sekreterlerData = [
  { ad: 'Ayşe', soyad: 'Demir' },
  { ad: 'Fatma', soyad: 'Şahin' },
  { ad: 'Zeynep', soyad: 'Yılmaz' },
  { ad: 'Elif', soyad: 'Arslan' },
  { ad: 'Merve', soyad: 'Koç' },
];

// 6 Branş
const branslar = ['Matematik', 'Türkçe', 'İngilizce', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Fizik'];

// Öğretmen isimleri (branş başına 5 isim)
const ogretmenHavuzu = [
  // Matematik
  { ad: 'Ahmet', soyad: 'Kaya' },
  { ad: 'Mustafa', soyad: 'Yılmaz' },
  { ad: 'Emre', soyad: 'Demir' },
  { ad: 'Oğuz', soyad: 'Şahin' },
  { ad: 'Tolga', soyad: 'Arslan' },
  // Türkçe
  { ad: 'Fatma', soyad: 'Öztürk' },
  { ad: 'Seda', soyad: 'Aydın' },
  { ad: 'Gül', soyad: 'Çelik' },
  { ad: 'Sibel', soyad: 'Koç' },
  { ad: 'Aylin', soyad: 'Kurt' },
  // İngilizce
  { ad: 'Deniz', soyad: 'Aktaş' },
  { ad: 'Ece', soyad: 'Polat' },
  { ad: 'Berk', soyad: 'Erdoğan' },
  { ad: 'Cem', soyad: 'Özkan' },
  { ad: 'Selin', soyad: 'Yıldız' },
  // Fen Bilimleri
  { ad: 'Ali', soyad: 'Kılıç' },
  { ad: 'Veli', soyad: 'Çetin' },
  { ad: 'Hüseyin', soyad: 'Aksoy' },
  { ad: 'İbrahim', soyad: 'Ünal' },
  { ad: 'Murat', soyad: 'Doğan' },
  // Sosyal Bilgiler
  { ad: 'Zehra', soyad: 'Güneş' },
  { ad: 'Hatice', soyad: 'Bayrak' },
  { ad: 'Emine', soyad: 'Kaplan' },
  { ad: 'Havva', soyad: 'Bozkurt' },
  { ad: 'Melek', soyad: 'Turan' },
  // Fizik
  { ad: 'Can', soyad: 'Korkmaz' },
  { ad: 'Arda', soyad: 'Yavuz' },
  { ad: 'Kaan', soyad: 'Sarı' },
  { ad: 'Ege', soyad: 'Kara' },
  { ad: 'Doruk', soyad: 'Aslan' },
];

// Öğrenci isimleri
const erkekAdlari = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf',
  'Ömer', 'Murat', 'Burak', 'Emre', 'Cem', 'Can', 'Ege', 'Arda', 'Kaan', 'Berk',
  'Eren', 'Furkan', 'Gökhan', 'Onur', 'Tuna', 'Umut', 'Doruk', 'Emir', 'Kerem', 'Mert',
  'Oğuz', 'Serkan', 'Tolga', 'Yiğit', 'Barış', 'Deniz', 'Efe', 'Koray', 'Melih', 'Selim',
];

const kizAdlari = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Defne', 'Ece', 'Gizem', 'Naz',
  'Duru', 'Lara', 'Yağmur', 'Ceren', 'Hande', 'İpek', 'Pelin', 'Derya', 'Eylül', 'Ada',
  'Azra', 'Beren', 'Cansu', 'Dilara', 'Esra', 'Gamze', 'Hilal', 'Ilgın', 'Jale', 'Kardelen',
  'Melis', 'Nehir', 'Özge', 'Rana', 'Simge', 'Tuğçe', 'Yaprak', 'Zehra', 'Aslı', 'Başak',
];

const ogrenciSoyadlari = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Yıldız',
  'Koç', 'Kurt', 'Polat', 'Erdoğan', 'Özkan', 'Kılıç', 'Çetin', 'Aksoy', 'Ünal', 'Korkmaz',
];

// Sınıf seviyeleri
const sinifSeviyeleri = [
  { seviye: 5, tip: SinifTipi.ORTAOKUL },
  { seviye: 6, tip: SinifTipi.ORTAOKUL },
  { seviye: 7, tip: SinifTipi.ORTAOKUL },
  { seviye: 8, tip: SinifTipi.ORTAOKUL },
  { seviye: 9, tip: SinifTipi.LISE },
  { seviye: 10, tip: SinifTipi.LISE },
  { seviye: 11, tip: SinifTipi.LISE },
  { seviye: 12, tip: SinifTipi.LISE },
];

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...\n');

  const hashedPassword = await bcrypt.hash('edura123', 10);
  
  // ==================== 1. ADMIN ====================
  console.log('👤 Admin oluşturuluyor...');
  await prisma.user.upsert({
    where: { email: 'admin@edura.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@edura.com',
      password: hashedPassword,
      ad: 'Admin',
      soyad: 'Edura',
      telefon: '0555 000 0000',
      role: Role.admin,
      aktif: true,
    },
  });
  console.log('   ✅ admin@edura.com\n');

  // ==================== 2. KURSLAR ====================
  console.log('🏫 Kurslar oluşturuluyor...');
  const kurslar: Record<string, string> = {};
  
  for (const kursData of kurslarData) {
    const kurs = await prisma.kurs.upsert({
      where: { ad: kursData.ad },
      update: {},
      create: {
        ad: kursData.ad,
        adres: kursData.adres,
        telefon: kursData.telefon,
        aktif: true,
      },
    });
    kurslar[kursData.kod] = kurs.id;
    console.log(`   ✅ ${kursData.ad}`);
  }
  console.log(`   📊 Toplam: ${Object.keys(kurslar).length} kurs\n`);

  // ==================== 3. MÜDÜRLER ====================
  console.log('👔 Müdürler oluşturuluyor...');
  
  for (let i = 0; i < kurslarData.length; i++) {
    const kursData = kurslarData[i];
    const mudurData = mudurlerData[i];
    
    await prisma.user.upsert({
      where: { email: `mudur.${kursData.kod}@edura.com` },
      update: { password: hashedPassword },
      create: {
        email: `mudur.${kursData.kod}@edura.com`,
        password: hashedPassword,
        ad: mudurData.ad,
        soyad: mudurData.soyad,
        telefon: `0555 100 000${i + 1}`,
        role: Role.mudur,
        kursId: kurslar[kursData.kod],
        brans: mudurData.brans || undefined,
        aktif: true,
      },
    });
    console.log(`   ✅ mudur.${kursData.kod}@edura.com (${mudurData.ad} ${mudurData.soyad})`);
  }
  console.log(`   📊 Toplam: 5 müdür\n`);

  // ==================== 4. SEKRETERLER ====================
  console.log('💼 Sekreterler oluşturuluyor...');
  
  for (let i = 0; i < kurslarData.length; i++) {
    const kursData = kurslarData[i];
    const sekreterData = sekreterlerData[i];
    
    await prisma.user.upsert({
      where: { email: `sekreter.${kursData.kod}@edura.com` },
      update: { password: hashedPassword },
      create: {
        email: `sekreter.${kursData.kod}@edura.com`,
        password: hashedPassword,
        ad: sekreterData.ad,
        soyad: sekreterData.soyad,
        telefon: `0555 200 000${i + 1}`,
        role: Role.sekreter,
        kursId: kurslar[kursData.kod],
        aktif: true,
      },
    });
    console.log(`   ✅ sekreter.${kursData.kod}@edura.com (${sekreterData.ad} ${sekreterData.soyad})`);
  }
  console.log(`   📊 Toplam: 5 sekreter\n`);

  // ==================== 5. ÖĞRETMENLER ====================
  console.log('👨‍🏫 Öğretmenler oluşturuluyor...');
  let ogretmenSayisi = 0;
  
  for (let kursIndex = 0; kursIndex < kurslarData.length; kursIndex++) {
    const kursData = kurslarData[kursIndex];
    const mudurData = mudurlerData[kursIndex];
    
    for (let bransIndex = 0; bransIndex < branslar.length; bransIndex++) {
      const brans = branslar[bransIndex];
      const havuzIndex = bransIndex * 5 + kursIndex;
      const ogretmen = ogretmenHavuzu[havuzIndex];
      
      // Müdür aynı zamanda bu branşın öğretmeni mi?
      const mudurBuBransta = mudurData.brans === brans;
      const isim = mudurBuBransta ? { ad: mudurData.ad, soyad: mudurData.soyad } : ogretmen;
      
      const emailPrefix = brans.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c');
      
      await prisma.user.upsert({
        where: { email: `${emailPrefix}.${kursData.kod}@edura.com` },
        update: { password: hashedPassword },
        create: {
          email: `${emailPrefix}.${kursData.kod}@edura.com`,
          password: hashedPassword,
          ad: isim.ad,
          soyad: isim.soyad,
          telefon: `0555 3${kursIndex}${bransIndex} ${String(ogretmenSayisi + 1).padStart(4, '0')}`,
          role: Role.ogretmen,
          kursId: kurslar[kursData.kod],
          brans: brans,
          aktif: true,
        },
      });
      ogretmenSayisi++;
    }
    console.log(`   ✅ ${kursData.ad}: 6 öğretmen`);
  }
  console.log(`   📊 Toplam: ${ogretmenSayisi} öğretmen\n`);

  // ==================== 6. SINIFLAR ====================
  console.log('🏛️ Sınıflar oluşturuluyor...');
  const siniflar: Record<string, string> = {};
  
  for (const kursData of kurslarData) {
    const kursId = kurslar[kursData.kod];
    
    for (const seviyeData of sinifSeviyeleri) {
      for (const sube of ['A', 'B']) {
        const sinifAd = `${seviyeData.seviye}-${sube}`;
        const sinifKey = `${kursData.kod}-${sinifAd}`;
        
        const sinif = await prisma.sinif.upsert({
          where: { ad_kursId: { ad: sinifAd, kursId } },
          update: {},
          create: {
            ad: sinifAd,
            seviye: seviyeData.seviye,
            tip: seviyeData.tip,
            kursId,
            aktif: true,
          },
        });
        siniflar[sinifKey] = sinif.id;
      }
    }
    console.log(`   ✅ ${kursData.ad}: 16 sınıf (8 seviye × 2 şube)`);
  }
  console.log(`   📊 Toplam: ${Object.keys(siniflar).length} sınıf\n`);

  // ==================== 7. ÖĞRENCİLER ====================
  console.log('👨‍🎓 Öğrenciler oluşturuluyor (bu biraz zaman alabilir)...');
  let ogrenciSayisi = 0;
  
  // Kurs kodlarını index'e çevir
  const kursKodIndex: Record<string, number> = { zambak: 1, lale: 2, papatya: 3, menekse: 4, gul: 5 };
  
  for (const kursData of kurslarData) {
    const kursId = kurslar[kursData.kod];
    const kursIdx = kursKodIndex[kursData.kod];
    let kursOgrenciSayisi = 0;
    
    for (const seviyeData of sinifSeviyeleri) {
      // Her seviye için 18 öğrenci oluştur
      // Ortalamaya göre sırala ve A/B şubesine dağıt
      const ogrenciler: Array<{
        ad: string;
        soyad: string;
        ortalama: number;
      }> = [];
      
      for (let i = 0; i < 18; i++) {
        const cinsiyet = i % 2 === 0 ? 'erkek' : 'kiz';
        const adHavuzu = cinsiyet === 'erkek' ? erkekAdlari : kizAdlari;
        const adIndex = (ogrenciSayisi + i) % adHavuzu.length;
        const soyadIndex = (ogrenciSayisi + i) % ogrenciSoyadlari.length;
        const ortalama = Math.floor(Math.random() * 51) + 50; // 50-100 arası
        
        ogrenciler.push({
          ad: adHavuzu[adIndex],
          soyad: ogrenciSoyadlari[soyadIndex],
          ortalama,
        });
      }
      
      // Ortalamaya göre sırala (yüksekten düşüğe)
      ogrenciler.sort((a, b) => b.ortalama - a.ortalama);
      
      for (let i = 0; i < ogrenciler.length; i++) {
        const ogr = ogrenciler[i];
        const sube = i < 10 ? 'A' : 'B'; // İlk 10 A, kalan 8 B
        const sinifAd = `${seviyeData.seviye}-${sube}`;
        const sinifKey = `${kursData.kod}-${sinifAd}`;
        const sinifId = siniflar[sinifKey];
        
        // Benzersiz öğrenci numarası: 2024 + KursIdx + Seviye + Sıra
        // Örnek: 2024-1-08-01 = Zambak, 8.sınıf, 1.öğrenci
        const ogrenciNo = `2024${kursIdx}${seviyeData.seviye.toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`;
        
        const emailBase = `${ogr.ad.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ğ/g, 'g').replace(/ç/g, 'c')}`;
        const emailSoyad = `${ogr.soyad.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ğ/g, 'g').replace(/ç/g, 'c')}`;
        const email = `${emailBase}.${emailSoyad}.${ogrenciNo}@ogrenci.edura.com`;
        
        await prisma.user.upsert({
          where: { email },
          update: { password: hashedPassword },
          create: {
            email,
            password: hashedPassword,
            ad: ogr.ad,
            soyad: ogr.soyad,
            telefon: `0555 ${400 + kursIdx} ${seviyeData.seviye.toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`,
            role: Role.ogrenci,
            kursId,
            sinifId,
            ogrenciNo,
            aktif: true,
          },
        });
        
        ogrenciSayisi++;
        kursOgrenciSayisi++;
      }
    }
    console.log(`   ✅ ${kursData.ad}: ${kursOgrenciSayisi} öğrenci`);
  }
  console.log(`   📊 Toplam: ${ogrenciSayisi} öğrenci\n`);

  // ==================== 8. BYPASS KULLANICILARI ====================
  console.log('🔐 Bypass kullanıcıları oluşturuluyor...');
  
  // Her sınıf seviyesi için örnek öğrenci (zambak kursu)
  // Numara formatı: BYPASS + kurs + seviye + sıra
  const bypassOgrenciler = [
    { sinif: '5-A', no: 'BYPASS10599' },
    { sinif: '6-A', no: 'BYPASS10699' },
    { sinif: '7-A', no: 'BYPASS10799' },
    { sinif: '8-A', no: 'BYPASS10899' },
    { sinif: '9-A', no: 'BYPASS10999' },
    { sinif: '10-A', no: 'BYPASS11099' },
    { sinif: '11-A', no: 'BYPASS11199' },
    { sinif: '12-A', no: 'BYPASS11299' },
  ];

  for (const bypass of bypassOgrenciler) {
    const sinifKey = `zambak-${bypass.sinif}`;
    const sinifId = siniflar[sinifKey];
    
    await prisma.user.upsert({
      where: { email: `ogrenci.${bypass.sinif.toLowerCase().replace('-', '')}@edura.com` },
      update: { password: hashedPassword, sinifId },
      create: {
        email: `ogrenci.${bypass.sinif.toLowerCase().replace('-', '')}@edura.com`,
        password: hashedPassword,
        ad: 'Test',
        soyad: `Öğrenci ${bypass.sinif}`,
        telefon: `0555 999 ${bypass.sinif.replace('-', '')}`,
        role: Role.ogrenci,
        kursId: kurslar['zambak'],
        sinifId,
        ogrenciNo: bypass.no,
        aktif: true,
      },
    });
    console.log(`   ✅ ogrenci.${bypass.sinif.toLowerCase().replace('-', '')}@edura.com`);
  }
  console.log('');

  // ==================== 9. GRUP KONUŞMALARI ====================
  console.log('💬 Grup konuşmaları oluşturuluyor...');
  
  // Her kurs için öğretmenler grubu ve personel grubu oluştur
  for (const kursData of kurslarData) {
    const kursId = kurslar[kursData.kod];
    
    // Bu kurstaki tüm personeli bul
    const kursPersonel = await prisma.user.findMany({
      where: {
        kursId,
        role: { in: ['mudur', 'ogretmen', 'sekreter'] },
        aktif: true
      },
      select: { id: true, role: true }
    });
    
    // Bu kurstaki tüm öğretmenleri bul (müdür dahil)
    const kursOgretmenler = await prisma.user.findMany({
      where: {
        kursId,
        OR: [
          { role: 'ogretmen' },
          { role: 'mudur', brans: { not: null } }
        ],
        aktif: true
      },
      select: { id: true, role: true }
    });
    
    // Müdürü bul (grup yöneticisi olacak)
    const mudur = kursPersonel.find(p => p.role === 'mudur');
    
    if (kursPersonel.length > 0) {
      // Personel Grubu oluştur
      const personelGrubu = await prisma.conversation.upsert({
        where: { id: `personel-grup-${kursData.kod}` },
        update: {},
        create: {
          id: `personel-grup-${kursData.kod}`,
          tip: 'PERSONEL',
          ad: `${kursData.ad} - Personel`,
          olusturanId: mudur?.id,
          uyeler: {
            create: kursPersonel.map(p => ({
              userId: p.id,
              rolAd: p.role === 'mudur' ? 'admin' : 'uye'
            }))
          }
        }
      });
      console.log(`   ✅ ${kursData.ad} - Personel grubu (${kursPersonel.length} üye)`);
    }
    
    if (kursOgretmenler.length > 0) {
      // Öğretmenler Grubu oluştur
      const ogretmenGrubu = await prisma.conversation.upsert({
        where: { id: `ogretmen-grup-${kursData.kod}` },
        update: {},
        create: {
          id: `ogretmen-grup-${kursData.kod}`,
          tip: 'OGRETMEN',
          ad: `${kursData.ad} - Öğretmenler`,
          olusturanId: mudur?.id,
          uyeler: {
            create: kursOgretmenler.map(p => ({
              userId: p.id,
              rolAd: p.role === 'mudur' ? 'admin' : 'uye'
            }))
          }
        }
      });
      console.log(`   ✅ ${kursData.ad} - Öğretmenler grubu (${kursOgretmenler.length} üye)`);
    }
  }
  console.log('');

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 İSTATİSTİKLER:');
  console.log('   🏫 Kurs:      5');
  console.log('   👔 Müdür:     5 (2\'si aynı zamanda öğretmen)');
  console.log('   💼 Sekreter:  5');
  console.log('   👨‍🏫 Öğretmen: 30');
  console.log('   🏛️ Sınıf:    80 (5 kurs × 8 seviye × 2 şube)');
  console.log(`   👨‍🎓 Öğrenci: ${ogrenciSayisi}\n`);
  
  console.log('🔐 GİRİŞ BİLGİLERİ (Şifre: edura123):');
  console.log('   ───────────────────────────────────────');
  console.log('   Admin:     admin@edura.com');
  console.log('   ');
  console.log('   Müdürler:');
  console.log('     • mudur.zambak@edura.com   (Maltepe Zambak)');
  console.log('     • mudur.lale@edura.com     (Kadıköy Lale)');
  console.log('     • mudur.papatya@edura.com  (Ataşehir Papatya)');
  console.log('     • mudur.menekse@edura.com  (Yenisahra Menekşe)');
  console.log('     • mudur.gul@edura.com      (Üsküdar Gül)');
  console.log('   ');
  console.log('   Sekreterler:');
  console.log('     • sekreter.zambak@edura.com');
  console.log('     • sekreter.lale@edura.com');
  console.log('     • ... (diğer kurslar)');
  console.log('   ');
  console.log('   Öğretmenler (örnek):');
  console.log('     • matematik.zambak@edura.com');
  console.log('     • turkce.zambak@edura.com');
  console.log('     • ingilizce.lale@edura.com');
  console.log('     • ... (her kurs için 6 branş)');
  console.log('   ');
  console.log('   Öğrenciler (bypass):');
  console.log('     • ogrenci.5a@edura.com   (5. sınıf)');
  console.log('     • ogrenci.6a@edura.com   (6. sınıf)');
  console.log('     • ogrenci.7a@edura.com   (7. sınıf)');
  console.log('     • ogrenci.8a@edura.com   (8. sınıf)');
  console.log('     • ogrenci.9a@edura.com   (9. sınıf)');
  console.log('     • ogrenci.10a@edura.com  (10. sınıf)');
  console.log('     • ogrenci.11a@edura.com  (11. sınıf)');
  console.log('     • ogrenci.12a@edura.com  (12. sınıf)');
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
