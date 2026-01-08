import { PrismaClient, Role, SinifTipi } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== KÜÇÜKYALI BUKET KURS VERİLERİ ====================

// Kurs Sahibi (Patron)
const kursSahibiData = {
  ad: 'Buket',
  soyad: 'Doğan',
  email: 'buketdogan',
  telefon: '0532 555 0001'
};

// Kurs bilgisi
const kursData = {
  ad: 'Küçükyalı Buket',
  kod: 'buk',
  adres: 'Küçükyalı Mah. Sahil Yolu Cad. No:123, Maltepe/İstanbul',
  telefon: '0216 555 1234'
};

// Müdürler
const mudurlerData = [
  { ad: 'Büşra', soyad: 'Büyüktanır', email: 'busrabuyuktanir' },
  { ad: 'Merve', soyad: 'Cevizci Pınar', email: 'mervecevizcipinar' },
];

// Öğretmenler ve branşları
const ogretmenlerData = [
  { ad: 'Damla', soyad: 'Menguş', email: 'damlamengus', brans: 'Tarih' },
  { ad: 'Merve Hazan', soyad: 'İşcan', email: 'mervehazaniscan', brans: 'Coğrafya' },
  { ad: 'Seyda', soyad: 'Karci', email: 'seydakarci', brans: 'Din Kültürü ve Ahlak Bilgisi' },
  { ad: 'Ziya Anıl', soyad: 'Şen', email: 'ziyaanilsen', brans: 'Biyoloji' },
  { ad: 'Emine Umay', soyad: 'Kılıç', email: 'emineumaykilinc', brans: 'Türkçe' },
  { ad: 'Murat Barış', soyad: 'Akyüz', email: 'muratbarisakyuz', brans: 'Fizik' },
  { ad: 'Zeynep', soyad: 'Uçar', email: 'zeynepucar', brans: 'Matematik' },
];

// Öğrenciler (arkadaşlar listesi)
const ogrencilerData = [
  // İlk resimden
  { ad: 'Akıl Rahman', soyad: 'Turza', email: 'akilrahmanturza' },
  { ad: 'Ali Rıza', soyad: 'Mıstık', email: 'alirizamistik' },
  { ad: 'Masihullah', soyad: 'Omar', email: 'masihullahomar' },
  { ad: 'Burak', soyad: 'Tuzcu', email: 'buraktuzcu' },
  { ad: 'Egemen Koray', soyad: 'Keleş', email: 'egemenkoraykeles' },
  { ad: 'Muhammet Batuhan', soyad: 'Karanfil', email: 'muhammetbatuhankaranfil' },
  { ad: 'Efe', soyad: 'Koçal', email: 'efekocal' },
  { ad: 'Yusuf', soyad: 'İpek', email: 'yusufipek' },
  { ad: 'Gökhan', soyad: 'Çoban', email: 'gokhancoban' },
  { ad: 'Elif', soyad: 'Güven', email: 'elifguven' },
  { ad: 'Nilay', soyad: 'Kuru', email: 'nilaykuru' },
  { ad: 'Emre', soyad: 'Şen', email: 'emresen' },
  { ad: 'Emirhan', soyad: 'Oymak', email: 'emirhanoymak' },
  { ad: 'Ömer Musab', soyad: 'Çiçek', email: 'omermusabcicek' },
  { ad: 'Onur Burak', soyad: 'Su', email: 'onurburaksu' },
  { ad: 'Emre', soyad: 'Yanalak', email: 'emreyanalak' },
  { ad: 'Mahir Yasin', soyad: 'Başkes', email: 'mahiryasinbaskes' },
  { ad: 'Muhammed Mehdi', soyad: 'İleri', email: 'muhammedmehdiileri' },
  { ad: 'Eren', soyad: 'Taşkıran', email: 'erentaskiran' },
  { ad: 'Hüseyn', soyad: 'Teymurzade', email: 'huseynteymurzade' },
  { ad: 'Ziya Baran', soyad: 'Utuğlu', email: 'ziyabaranutuglu' },
  { ad: 'Faruk Emre', soyad: 'Bakır', email: 'farukemrebakir' },
  { ad: 'Meriç', soyad: 'Sarıkaya', email: 'mericsarikaya' },
  { ad: 'Sude', soyad: 'Göçmez', email: 'sudegocmez' },
  { ad: 'Fehmi Koray', soyad: 'Mullaoğlu', email: 'fehmikoraymullaoglu' },
  { ad: 'Furkan', soyad: 'Çevik', email: 'furkanc' },
  { ad: 'Muhammed Zahid', soyad: 'Demirel', email: 'muhammedzahiddemirel' },
  { ad: 'Ferhat', soyad: 'Işık', email: 'ferhatisik' },
  { ad: 'Tolga', soyad: 'Ertek', email: 'tolgaertek' },
  { ad: 'Muhammed Vefa', soyad: 'Yoksul', email: 'muhammedvefayoksul' },
  // İkinci resimden (admin ve öğretmen olmayanlar)
  { ad: 'Muhammed', soyad: 'Kızıldağ', email: 'muhammedkizildag' },
  { ad: 'Özgür', soyad: 'Meşe', email: 'ozgurmese' },
  { ad: 'Yasir', soyad: 'Arslan', email: 'yasirarslan' },
  { ad: 'Muhammet Enes', soyad: 'Yıldırır', email: 'muhammetenesildirir' },
  { ad: 'Mustafa Mert', soyad: 'Ceylan', email: 'mustafamertceylan' },
  { ad: 'Hayat', soyad: 'Diler', email: 'hayatdiler' },
  { ad: 'Şevval', soyad: 'Çulcu', email: 'sevvalculcu' },
  { ad: 'Mustafa Tayyip', soyad: 'İç', email: 'mustafatayyipic' },
  { ad: 'Yahya', soyad: 'Çemrek', email: 'yahyacemrek' },
  { ad: 'Umut Barış', soyad: 'Özdemir', email: 'umutbarisozdemir' },
  { ad: 'Yusuf Eren', soyad: 'Çelebi', email: 'yusuferencelebi' },
  { ad: 'Yusuf', soyad: 'Tarlan', email: 'yusuftarlan' },
  { ad: 'Enes Elyesa', soyad: 'Çiçek', email: 'eneselysacicek' },
  { ad: 'Ahmet Eren', soyad: 'Başalı', email: 'ahmeterenbasali' },
  { ad: 'Furkan', soyad: 'Köksalan', email: 'furkankoksalan' },
  { ad: 'Yusuf', soyad: 'Durmuş', email: 'yusufdurmus' },
  { ad: 'Furkan', soyad: 'Adıgüzel', email: 'furkanadiguzel' },
  { ad: 'Enes', soyad: 'Bulut', email: 'enesbulut' },
  { ad: 'Berat', soyad: 'Öner', email: 'beratoner' },
];

// Ders programı (11. sınıf için haftalık)
const dersProgrami = [
  // Pazartesi
  { gun: 'Pazartesi', baslangic: '09:00', bitis: '09:45', brans: 'Matematik' },
  { gun: 'Pazartesi', baslangic: '10:00', bitis: '10:45', brans: 'Matematik' },
  { gun: 'Pazartesi', baslangic: '11:00', bitis: '11:45', brans: 'Fizik' },
  { gun: 'Pazartesi', baslangic: '13:00', bitis: '13:45', brans: 'Türkçe' },
  { gun: 'Pazartesi', baslangic: '14:00', bitis: '14:45', brans: 'Tarih' },
  // Salı
  { gun: 'Salı', baslangic: '09:00', bitis: '09:45', brans: 'Fizik' },
  { gun: 'Salı', baslangic: '10:00', bitis: '10:45', brans: 'Biyoloji' },
  { gun: 'Salı', baslangic: '11:00', bitis: '11:45', brans: 'Coğrafya' },
  { gun: 'Salı', baslangic: '13:00', bitis: '13:45', brans: 'Matematik' },
  { gun: 'Salı', baslangic: '14:00', bitis: '14:45', brans: 'Türkçe' },
  // Çarşamba
  { gun: 'Çarşamba', baslangic: '09:00', bitis: '09:45', brans: 'Tarih' },
  { gun: 'Çarşamba', baslangic: '10:00', bitis: '10:45', brans: 'Coğrafya' },
  { gun: 'Çarşamba', baslangic: '11:00', bitis: '11:45', brans: 'Din Kültürü ve Ahlak Bilgisi' },
  { gun: 'Çarşamba', baslangic: '13:00', bitis: '13:45', brans: 'Fizik' },
  { gun: 'Çarşamba', baslangic: '14:00', bitis: '14:45', brans: 'Matematik' },
  // Perşembe
  { gun: 'Perşembe', baslangic: '09:00', bitis: '09:45', brans: 'Biyoloji' },
  { gun: 'Perşembe', baslangic: '10:00', bitis: '10:45', brans: 'Türkçe' },
  { gun: 'Perşembe', baslangic: '11:00', bitis: '11:45', brans: 'Matematik' },
  { gun: 'Perşembe', baslangic: '13:00', bitis: '13:45', brans: 'Din Kültürü ve Ahlak Bilgisi' },
  { gun: 'Perşembe', baslangic: '14:00', bitis: '14:45', brans: 'Tarih' },
  // Cuma
  { gun: 'Cuma', baslangic: '09:00', bitis: '09:45', brans: 'Türkçe' },
  { gun: 'Cuma', baslangic: '10:00', bitis: '10:45', brans: 'Fizik' },
  { gun: 'Cuma', baslangic: '11:00', bitis: '11:45', brans: 'Biyoloji' },
  { gun: 'Cuma', baslangic: '13:00', bitis: '13:45', brans: 'Coğrafya' },
  { gun: 'Cuma', baslangic: '14:00', bitis: '14:45', brans: 'Matematik' },
  // Cumartesi (hafta sonu takviye)
  { gun: 'Cumartesi', baslangic: '10:00', bitis: '10:45', brans: 'Matematik' },
  { gun: 'Cumartesi', baslangic: '11:00', bitis: '11:45', brans: 'Matematik' },
  { gun: 'Cumartesi', baslangic: '12:00', bitis: '12:45', brans: 'Fizik' },
];

async function main() {
  console.log('🌱 Küçükyalı Buket Kurs seed işlemi başlıyor...\n');

  const hashedPassword = await bcrypt.hash('Edura2025.!', 10);
  
  // ==================== 1. KURS SAHİBİ ====================
  console.log('👑 Kurs Sahibi oluşturuluyor...');
  
  const kursSahibiEmail = `${kursSahibiData.email}@edura.com`;
  const kursSahibi = await prisma.user.upsert({
    where: { email: kursSahibiEmail },
    update: { password: hashedPassword },
    create: {
      email: kursSahibiEmail,
      password: hashedPassword,
      ad: kursSahibiData.ad,
      soyad: kursSahibiData.soyad,
      telefon: kursSahibiData.telefon,
      role: Role.kursSahibi,
      aktif: true,
    },
  });
  console.log(`   ✅ ${kursSahibiEmail} (${kursSahibiData.ad} ${kursSahibiData.soyad})`);
  console.log(`   📊 Kurs Sahibi ID: ${kursSahibi.id}\n`);

  // ==================== 2. KURS ====================
  console.log('🏫 Kurs oluşturuluyor...');
  
  const kurs = await prisma.kurs.upsert({
    where: { ad: kursData.ad },
    update: {
      sahipId: kursSahibi.id, // Mevcut kursa sahibi ata
    },
    create: {
      ad: kursData.ad,
      adres: kursData.adres,
      telefon: kursData.telefon,
      aktif: true,
      sahipId: kursSahibi.id, // Yeni kursa sahibi ata
    },
  });
  console.log(`   ✅ ${kursData.ad} kursu oluşturuldu`);
  console.log(`   👑 Kurs Sahibi: ${kursSahibiData.ad} ${kursSahibiData.soyad}`);
  console.log(`   📊 Kurs ID: ${kurs.id}\n`);

  // Kurs sahibinin kursId'sini güncelle
  await prisma.user.update({
    where: { id: kursSahibi.id },
    data: { kursId: kurs.id },
  });

  // ==================== 3. SINIF ====================
  console.log('🏛️ Sınıf oluşturuluyor...');
  
  const sinif = await prisma.sinif.upsert({
    where: { ad_kursId: { ad: '11-A', kursId: kurs.id } },
    update: {},
    create: {
      ad: '11-A',
      seviye: 11,
      tip: SinifTipi.LISE,
      kursId: kurs.id,
      aktif: true,
    },
  });
  console.log(`   ✅ 11-A sınıfı oluşturuldu`);
  console.log(`   📊 Sınıf ID: ${sinif.id}\n`);

  // ==================== 4. MÜDÜRLER ====================
  console.log('👔 Müdürler oluşturuluyor...');
  
  for (const mudurData of mudurlerData) {
    const email = `${mudurData.email}@edura.com`;
    
    await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        ad: mudurData.ad,
        soyad: mudurData.soyad,
        telefon: `0555 BUK ${mudurlerData.indexOf(mudurData) + 1}`.padEnd(14, '0'),
        role: Role.mudur,
        kursId: kurs.id,
        aktif: true,
      },
    });
    console.log(`   ✅ ${email} (${mudurData.ad} ${mudurData.soyad})`);
  }
  console.log(`   📊 Toplam: ${mudurlerData.length} müdür\n`);

  // ==================== 5. ÖĞRETMENLER ====================
  console.log('👨‍🏫 Öğretmenler oluşturuluyor...');
  
  const ogretmenMap: Record<string, string> = {}; // brans -> ogretmenId
  
  for (const ogretmenData of ogretmenlerData) {
    const email = `${ogretmenData.email}@edura.com`;
    
    const ogretmen = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        ad: ogretmenData.ad,
        soyad: ogretmenData.soyad,
        telefon: `0555 OGR ${ogretmenlerData.indexOf(ogretmenData) + 1}`.padEnd(14, '0'),
        role: Role.ogretmen,
        kursId: kurs.id,
        brans: ogretmenData.brans,
        aktif: true,
      },
    });
    
    ogretmenMap[ogretmenData.brans] = ogretmen.id;
    console.log(`   ✅ ${email} (${ogretmenData.ad} ${ogretmenData.soyad} - ${ogretmenData.brans})`);
  }
  console.log(`   📊 Toplam: ${ogretmenlerData.length} öğretmen\n`);

  // ==================== 6. ÖĞRENCİLER ====================
  console.log('👨‍🎓 Öğrenciler oluşturuluyor...');
  
  const ogrenciIds: string[] = [];
  let ogrenciNo = 1;
  
  for (const ogrenciData of ogrencilerData) {
    const email = `${ogrenciData.email}@edura.com`;
    const ogrenciNumarasi = `BUK11A${String(ogrenciNo).padStart(3, '0')}`;
    
    const ogrenci = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword, sinifId: sinif.id },
      create: {
        email,
        password: hashedPassword,
        ad: ogrenciData.ad,
        soyad: ogrenciData.soyad,
        telefon: `0555 STU ${String(ogrenciNo).padStart(4, '0')}`,
        role: Role.ogrenci,
        kursId: kurs.id,
        sinifId: sinif.id,
        ogrenciNo: ogrenciNumarasi,
        aktif: true,
      },
    });
    
    ogrenciIds.push(ogrenci.id);
    console.log(`   ✅ ${email} (${ogrenciData.ad} ${ogrenciData.soyad})`);
    ogrenciNo++;
  }
  console.log(`   📊 Toplam: ${ogrencilerData.length} öğrenci\n`);

  // ==================== 7. DERSLER (Ders Programı) ====================
  console.log('📚 Dersler ve ders programı oluşturuluyor...');
  
  const dersIds: string[] = [];
  
  for (const dersData of dersProgrami) {
    const ogretmenId = ogretmenMap[dersData.brans];
    
    if (!ogretmenId) {
      console.log(`   ⚠️ ${dersData.brans} için öğretmen bulunamadı, atlanıyor...`);
      continue;
    }
    
    const dersAd = `${dersData.brans} (${dersData.gun} ${dersData.baslangic})`;
    
    // Mevcut dersi kontrol et (aynı ad ve sınıf için)
    const mevcutDers = await prisma.course.findFirst({
      where: {
        ad: dersAd,
        sinifId: sinif.id,
        ogretmenId: ogretmenId,
      }
    });
    
    let ders;
    if (mevcutDers) {
      ders = mevcutDers;
    } else {
      ders = await prisma.course.create({
        data: {
          ad: dersAd,
          aciklama: `11-A sınıfı ${dersData.brans} dersi`,
          sinifId: sinif.id,
          ogretmenId: ogretmenId,
          gun: dersData.gun,
          baslangicSaati: dersData.baslangic,
          bitisSaati: dersData.bitis,
          aktif: true,
        },
      });
    }
    
    dersIds.push(ders.id);
  }
  console.log(`   ✅ ${dersIds.length} ders oluşturuldu\n`);

  // ==================== 8. DERS KAYITLARI ====================
  console.log('📝 Öğrenciler derslere kaydediliyor...');
  
  let kayitSayisi = 0;
  
  for (const ogrenciId of ogrenciIds) {
    for (const dersId of dersIds) {
      // Mevcut kayıt var mı kontrol et
      const mevcutKayit = await prisma.courseEnrollment.findUnique({
        where: {
          ogrenciId_courseId: {
            ogrenciId: ogrenciId,
            courseId: dersId,
          }
        }
      });
      
      if (!mevcutKayit) {
        await prisma.courseEnrollment.create({
          data: {
            ogrenciId: ogrenciId,
            courseId: dersId,
            aktif: true,
          },
        });
        kayitSayisi++;
      }
    }
  }
  console.log(`   ✅ ${kayitSayisi} ders kaydı oluşturuldu\n`);

  // ==================== 9. SINIF GRUBU ====================
  console.log('💬 Sınıf grubu oluşturuluyor...');
  
  // Müdürleri bul
  const mudurler = await prisma.user.findMany({
    where: {
      kursId: kurs.id,
      role: Role.mudur,
    },
  });
  
  // Öğretmenleri bul
  const ogretmenler = await prisma.user.findMany({
    where: {
      kursId: kurs.id,
      role: Role.ogretmen,
    },
  });
  
  // Mevcut sınıf grubu var mı kontrol et
  const mevcutGrup = await prisma.conversation.findFirst({
    where: {
      tip: 'SINIF',
      sinifId: sinif.id,
    }
  });
  
  if (!mevcutGrup) {
    // Tüm üyeleri hazırla (öğrenciler + öğretmenler)
    const tumUyeler = [
      ...ogrenciIds.map(id => ({ userId: id, rolAd: 'uye' })),
      ...ogretmenler.map(o => ({ userId: o.id, rolAd: 'ogretmen' })),
      ...mudurler.map(m => ({ userId: m.id, rolAd: 'admin' })),
    ];
    
    await prisma.conversation.create({
      data: {
        tip: 'SINIF',
        ad: '11-A Sınıf Grubu',
        aciklama: 'Küçükyalı Buket Kurs 11-A sınıfı iletişim grubu',
        sinifId: sinif.id,
        olusturanId: mudurler[0]?.id,
        uyeler: {
          create: tumUyeler,
        },
      },
    });
    console.log(`   ✅ Sınıf grubu oluşturuldu (${tumUyeler.length} üye)\n`);
  } else {
    console.log(`   ⚠️ Sınıf grubu zaten mevcut\n`);
  }

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 KÜÇÜKYALI BUKET KURS SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 İSTATİSTİKLER:');
  console.log(`   🏫 Kurs:      ${kursData.ad}`);
  console.log(`   🏛️ Sınıf:     11-A`);
  console.log(`   👔 Müdür:     ${mudurlerData.length}`);
  console.log(`   👨‍🏫 Öğretmen: ${ogretmenlerData.length}`);
  console.log(`   👨‍🎓 Öğrenci: ${ogrencilerData.length}`);
  console.log(`   📚 Ders:      ${dersIds.length}`);
  console.log(`   📝 Ders Kaydı: ${kayitSayisi}\n`);
  
  console.log('🔐 GİRİŞ BİLGİLERİ (Tüm şifreler: Edura2025.!):');
  console.log('   ───────────────────────────────────────');
  console.log('   Müdürler:');
  for (const m of mudurlerData) {
    console.log(`     • ${m.email}@edura.com (${m.ad} ${m.soyad})`);
  }
  console.log('   ');
  console.log('   Öğretmenler:');
  for (const o of ogretmenlerData) {
    console.log(`     • ${o.email}@edura.com (${o.ad} ${o.soyad} - ${o.brans})`);
  }
  console.log('   ');
  console.log('   Öğrenciler (ilk 10):');
  for (let i = 0; i < Math.min(10, ogrencilerData.length); i++) {
    const ogr = ogrencilerData[i];
    console.log(`     • ${ogr.email}@edura.com (${ogr.ad} ${ogr.soyad})`);
  }
  console.log(`     ... ve ${ogrencilerData.length - 10} öğrenci daha`);
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

