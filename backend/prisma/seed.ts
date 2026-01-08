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
  { ad: 'Ali', soyad: 'Kaya' },
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
  { ad: 'Veli', soyad: 'Kılıç' },
  { ad: 'Hakan', soyad: 'Çetin' },
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

// Öğrenci isimleri - Geniş havuz (tekrar olmaması için)
const erkekAdlari = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf',
  'Ömer', 'Murat', 'Burak', 'Emre', 'Cem', 'Can', 'Ege', 'Arda', 'Kaan', 'Berk',
  'Eren', 'Furkan', 'Gökhan', 'Onur', 'Tuna', 'Umut', 'Doruk', 'Emir', 'Kerem', 'Mert',
  'Oğuz', 'Serkan', 'Tolga', 'Yiğit', 'Barış', 'Deniz', 'Efe', 'Koray', 'Melih', 'Selim',
  'Alp', 'Batuhan', 'Berke', 'Bilal', 'Caner', 'Cemal', 'Cengiz', 'Çağatay', 'Çağrı', 'Dağhan',
  'Ediz', 'Ekrem', 'Eray', 'Erdem', 'Erhan', 'Erkan', 'Eyüp', 'Fatih', 'Ferhat', 'Fırat',
  'Görkem', 'Güney', 'Halit', 'Haluk', 'Hamza', 'İlker', 'İsmail', 'Kağan', 'Kayra', 'Kutay',
  'Levent', 'Mahmut', 'Metehan', 'Miraç', 'Necati', 'Nuri', 'Okan', 'Orkun', 'Özgür', 'Polat',
  'Rüzgar', 'Sami', 'Semih', 'Sinan', 'Şafak', 'Tarık', 'Taylan', 'Teoman', 'Turgut', 'Uğur',
  'Uras', 'Utku', 'Vedat', 'Volkan', 'Yakup', 'Yaman', 'Yasin', 'Yavuz', 'Yunus', 'Zafer',
];

const kizAdlari = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Defne', 'Ece', 'Gizem', 'Naz',
  'Duru', 'Lara', 'Yağmur', 'Ceren', 'Hande', 'İpek', 'Pelin', 'Derya', 'Eylül', 'Ada',
  'Azra', 'Beren', 'Cansu', 'Dilara', 'Esra', 'Gamze', 'Hilal', 'Ilgın', 'Jale', 'Kardelen',
  'Melis', 'Nehir', 'Özge', 'Rana', 'Simge', 'Tuğçe', 'Yaprak', 'Zehra', 'Aslı', 'Başak',
  'Aleyna', 'Ayla', 'Bahar', 'Bengisu', 'Burcu', 'Büşra', 'Cemre', 'Damla', 'Dilan', 'Dilek',
  'Ebru', 'Eda', 'Ela', 'Elvan', 'Esin', 'Ezgi', 'Fulya', 'Gaye', 'Gülşen', 'Gülten',
  'Hacer', 'Hayriye', 'Hazal', 'Hülya', 'İrem', 'Kübra', 'Leyla', 'Meltem', 'Mine', 'Miray',
  'Nazlı', 'Neslihan', 'Nida', 'Nilgün', 'Nur', 'Nursena', 'Rabia', 'Reyhan', 'Rümeysa', 'Saadet',
  'Safiye', 'Seda', 'Seher', 'Sena', 'Seray', 'Sevgi', 'Şeyma', 'Tuba', 'Tuğba', 'Ümran',
  'Yasemin', 'Yıldız', 'Zeliha', 'Zübeyde', 'Zühal', 'Almina', 'Asya', 'Bade', 'Betül', 'Ceyda',
];

const ogrenciSoyadlari = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Yıldız',
  'Koç', 'Kurt', 'Polat', 'Erdoğan', 'Özkan', 'Kılıç', 'Çetin', 'Aksoy', 'Ünal', 'Korkmaz',
  'Tekin', 'Şen', 'Özdemir', 'Güneş', 'Bayrak', 'Kaplan', 'Bozkurt', 'Turan', 'Yavuz', 'Sarı',
  'Aslan', 'Karaca', 'Akın', 'Tan', 'Koçak', 'Taş', 'Bulut', 'Güler', 'Acar', 'Özer',
  'Eren', 'Kıran', 'Yücel', 'Erdem', 'Başar', 'Coşkun', 'Özcan', 'Güven', 'Sezer', 'Toprak',
  'Duman', 'Sönmez', 'Peker', 'Çakır', 'Kara', 'Aktaş', 'Gündüz', 'Keskin', 'Bakır', 'Mutlu',
];

// Kullanılan isimleri takip etmek için Set
const kullanilanIsimler = new Set<string>();

// Benzersiz isim oluşturucu
function benzersizIsimAl(adHavuzu: string[], soyadHavuzu: string[], index: number): { ad: string; soyad: string } {
  const maxDeneme = 100;
  for (let deneme = 0; deneme < maxDeneme; deneme++) {
    const adIndex = (index + deneme * 7) % adHavuzu.length;
    const soyadIndex = (index + deneme * 13) % soyadHavuzu.length;
    const ad = adHavuzu[adIndex];
    const soyad = soyadHavuzu[soyadIndex];
    const tamIsim = `${ad} ${soyad}`;
    
    if (!kullanilanIsimler.has(tamIsim)) {
      kullanilanIsimler.add(tamIsim);
      return { ad, soyad };
    }
  }
  // Eşsiz bulunamadıysa index ekle
  const ad = adHavuzu[index % adHavuzu.length];
  const soyad = soyadHavuzu[index % soyadHavuzu.length];
  return { ad, soyad };
}

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
  console.log('👤 Adminler oluşturuluyor...');
  
  const adminler = [
    { email: 'hasan.vural@edura.com', ad: 'Hasan', soyad: 'Vural', telefon: '0555 000 0001' },
    { email: 'abdurrahman.onavci@edura.com', ad: 'Abdurrahman', soyad: 'Onavci', telefon: '0555 000 0002' },
    { email: 'ferhat.kara@edura.com', ad: 'Ferhat', soyad: 'Kara', telefon: '0555 000 0003' },
  ];

  for (const adminData of adminler) {
    await prisma.user.upsert({
      where: { email: adminData.email },
      update: { password: hashedPassword },
      create: {
        email: adminData.email,
        password: hashedPassword,
        ad: adminData.ad,
        soyad: adminData.soyad,
        telefon: adminData.telefon,
        role: Role.admin,
        aktif: true,
      },
    });
    console.log(`   ✅ ${adminData.email} (${adminData.ad} ${adminData.soyad})`);
  }
  console.log(`   📊 Toplam: ${adminler.length} admin\n`);

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
  // NOT: Her branş için bağımsız öğretmen oluşturulur
  // Müdürün branşı olsa bile öğretmen ayrı kişidir (rol karışıklığını önlemek için)
  console.log('👨‍🏫 Öğretmenler oluşturuluyor...');
  let ogretmenSayisi = 0;
  
  for (let kursIndex = 0; kursIndex < kurslarData.length; kursIndex++) {
    const kursData = kurslarData[kursIndex];
    
    for (let bransIndex = 0; bransIndex < branslar.length; bransIndex++) {
      const brans = branslar[bransIndex];
      const havuzIndex = bransIndex * 5 + kursIndex;
      const ogretmen = ogretmenHavuzu[havuzIndex];
      
      // Her zaman öğretmen havuzundan al - müdürle karıştırma!
      const isim = ogretmen;
      
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
  
  // Kullanılan isimleri sıfırla (her seed için temiz başla)
  kullanilanIsimler.clear();
  
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
        const uniqueIndex = ogrenciSayisi * 18 + i; // Benzersiz index
        const isim = benzersizIsimAl(adHavuzu, ogrenciSoyadlari, uniqueIndex);
        const ortalama = Math.floor(Math.random() * 51) + 50; // 50-100 arası
        
        ogrenciler.push({
          ad: isim.ad,
          soyad: isim.soyad,
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
  
  // Her sınıf seviyesi ve şubeden 2'şer öğrenci (zambak kursu)
  // Toplam: 8 seviye × 2 şube × 2 öğrenci = 32 öğrenci
  const bypassOgrenciAdlari = [
    // 5-A
    { sinif: '5-A', sira: 1, ad: 'Ege', soyad: 'Yılmaz' },
    { sinif: '5-A', sira: 2, ad: 'Defne', soyad: 'Kaya' },
    // 5-B
    { sinif: '5-B', sira: 1, ad: 'Mert', soyad: 'Demir' },
    { sinif: '5-B', sira: 2, ad: 'Azra', soyad: 'Çelik' },
    // 6-A
    { sinif: '6-A', sira: 1, ad: 'Berk', soyad: 'Şahin' },
    { sinif: '6-A', sira: 2, ad: 'Lara', soyad: 'Aydın' },
    // 6-B
    { sinif: '6-B', sira: 1, ad: 'Doruk', soyad: 'Öztürk' },
    { sinif: '6-B', sira: 2, ad: 'Nehir', soyad: 'Arslan' },
    // 7-A
    { sinif: '7-A', sira: 1, ad: 'Arda', soyad: 'Koç' },
    { sinif: '7-A', sira: 2, ad: 'Duru', soyad: 'Kurt' },
    // 7-B
    { sinif: '7-B', sira: 1, ad: 'Kerem', soyad: 'Polat' },
    { sinif: '7-B', sira: 2, ad: 'Ada', soyad: 'Erdoğan' },
    // 8-A (LGS)
    { sinif: '8-A', sira: 1, ad: 'Kaan', soyad: 'Özkan' },
    { sinif: '8-A', sira: 2, ad: 'Elif', soyad: 'Kılıç' },
    // 8-B (LGS)
    { sinif: '8-B', sira: 1, ad: 'Yiğit', soyad: 'Çetin' },
    { sinif: '8-B', sira: 2, ad: 'Zeynep', soyad: 'Aksoy' },
    // 9-A
    { sinif: '9-A', sira: 1, ad: 'Onur', soyad: 'Ünal' },
    { sinif: '9-A', sira: 2, ad: 'Simge', soyad: 'Doğan' },
    // 9-B
    { sinif: '9-B', sira: 1, ad: 'Koray', soyad: 'Güneş' },
    { sinif: '9-B', sira: 2, ad: 'Melis', soyad: 'Bayrak' },
    // 10-A
    { sinif: '10-A', sira: 1, ad: 'Tuna', soyad: 'Kaplan' },
    { sinif: '10-A', sira: 2, ad: 'Ceren', soyad: 'Bozkurt' },
    // 10-B
    { sinif: '10-B', sira: 1, ad: 'Barış', soyad: 'Turan' },
    { sinif: '10-B', sira: 2, ad: 'Hande', soyad: 'Korkmaz' },
    // 11-A
    { sinif: '11-A', sira: 1, ad: 'Selim', soyad: 'Yavuz' },
    { sinif: '11-A', sira: 2, ad: 'Pelin', soyad: 'Sarı' },
    // 11-B
    { sinif: '11-B', sira: 1, ad: 'Melih', soyad: 'Kara' },
    { sinif: '11-B', sira: 2, ad: 'Derya', soyad: 'Aslan' },
    // 12-A (TYT/AYT)
    { sinif: '12-A', sira: 1, ad: 'Umut', soyad: 'Tekin' },
    { sinif: '12-A', sira: 2, ad: 'İpek', soyad: 'Yıldırım' },
    // 12-B (TYT/AYT)
    { sinif: '12-B', sira: 1, ad: 'Serkan', soyad: 'Şen' },
    { sinif: '12-B', sira: 2, ad: 'Gamze', soyad: 'Özdemir' },
  ];

  for (const ogr of bypassOgrenciAdlari) {
    const sinifKey = `zambak-${ogr.sinif}`;
    const sinifId = siniflar[sinifKey];
    const emailSinif = ogr.sinif.toLowerCase().replace('-', '');
    const email = `test.${emailSinif}.${ogr.sira}@edura.com`;
    const ogrenciNo = `TEST${ogr.sinif.replace('-', '')}${ogr.sira}`;
    
    await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword, sinifId, ad: ogr.ad, soyad: ogr.soyad },
      create: {
        email,
        password: hashedPassword,
        ad: ogr.ad,
        soyad: ogr.soyad,
        telefon: `0555 800 ${emailSinif}${ogr.sira}`,
        role: Role.ogrenci,
        kursId: kurslar['zambak'],
        sinifId,
        ogrenciNo,
        aktif: true,
      },
    });
    console.log(`   ✅ ${email} (${ogr.ad} ${ogr.soyad} - ${ogr.sinif})`);
  }
  console.log(`   📊 Toplam: ${bypassOgrenciAdlari.length} bypass öğrenci\n`);

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
    
    // Bu kurstaki tüm öğretmenleri bul (sadece öğretmen rolündekiler)
    const kursOgretmenler = await prisma.user.findMany({
      where: {
        kursId,
        role: 'ogretmen',
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
  console.log('   👤 Admin:     3');
  console.log('   🏫 Kurs:      5');
  console.log('   👔 Müdür:     5');
  console.log('   💼 Sekreter:  5');
  console.log('   👨‍🏫 Öğretmen: 30');
  console.log('   🏛️ Sınıf:    80 (5 kurs × 8 seviye × 2 şube)');
  console.log(`   👨‍🎓 Öğrenci: ${ogrenciSayisi}\n`);
  
  console.log('🔐 GİRİŞ BİLGİLERİ (Şifre: edura123):');
  console.log('   ───────────────────────────────────────');
  console.log('   Adminler:');
  console.log('     • hasan.vural@edura.com       (Hasan Vural)');
  console.log('     • abdurrahman.onavci@edura.com (Abdurrahman Onavci)');
  console.log('     • ferhat.kara@edura.com       (Ferhat Kara)');
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
  console.log('   Öğrenciler (bypass - 32 öğrenci):');
  console.log('     Her sınıf/şubeden 2\'şer öğrenci:');
  console.log('     • test.5a.1@edura.com, test.5a.2@edura.com   (5-A)');
  console.log('     • test.5b.1@edura.com, test.5b.2@edura.com   (5-B)');
  console.log('     • test.6a.1@edura.com ... test.12b.2@edura.com');
  console.log('     Format: test.<sinif><sube>.<sira>@edura.com');
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
