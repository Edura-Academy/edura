import { PrismaClient, OdevTipi, OdevDurum } from '@prisma/client';

const prisma = new PrismaClient();

// 5-A ve 5-B için ödevler
const odevlerData = [
  // ======================== MATEMATİK ÖDEVLERİ ========================
  {
    baslik: 'Doğal Sayılarla İşlemler',
    aciklama: 'Doğal sayılarla toplama, çıkarma, çarpma ve bölme işlemlerini içeren alıştırmalar.',
    konuBasligi: '1. Ünite - Doğal Sayılar',
    brans: 'Matematik',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 7, // 7 gün sonra teslim
    sorular: [
      {
        soruMetni: '345 + 678 işleminin sonucu kaçtır?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['1013', '1023', '1033', '1123'],
        dogruCevap: 1
      },
      {
        soruMetni: '1000 - 456 işleminin sonucu kaçtır?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['544', '554', '444', '654'],
        dogruCevap: 0
      },
      {
        soruMetni: '25 × 16 işleminin sonucu kaçtır?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['300', '350', '400', '450'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Bir çiftçinin 1250 elması var. Bunları 25 kasaya eşit olarak paylaştırırsa her kasaya kaç elma düşer? Çözümünü adım adım yazınız.',
        puan: 20,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Ali\'nin 350 TL parası var. 125 TL\'lik bir kitap ve 75 TL\'lik bir defter aldı. Ali\'nin kaç TL parası kaldı? İşlemleri göstererek çözünüz.',
        puan: 20,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '144 ÷ 12 işleminin sonucu aşağıdakilerden hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['10', '11', '12', '13'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Aşağıdaki sayıları küçükten büyüğe sıralayınız: 456, 465, 546, 564, 654',
        puan: 20,
        soruTipi: 'klasik'
      }
    ]
  },
  {
    baslik: 'Kesirler ve Ondalık Sayılar',
    aciklama: 'Kesirlerin gösterimi, karşılaştırılması ve ondalık sayılara dönüşümü.',
    konuBasligi: '2. Ünite - Kesirler',
    brans: 'Matematik',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.SORU_CEVAP,
    maxPuan: 100,
    gunSonra: 5,
    sorular: [
      {
        soruMetni: '3/4 kesrini ondalık sayı olarak yazınız ve açıklayınız.',
        puan: 20,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Bir pizzanın 2/8\'i yenildi. Geriye kalan kısım kaçtır? Şekil üzerinde gösteriniz.',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '1/2, 3/4, 2/3 kesirlerini büyükten küçüğe sıralayınız. Nasıl karşılaştırdığınızı açıklayınız.',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '5/10 kesrini sadeleştiriniz ve sonucu açıklayınız.',
        puan: 15,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Günlük hayattan kesir kullanılan 3 örnek veriniz ve bunları şekil üzerinde gösteriniz.',
        puan: 15,
        soruTipi: 'klasik'
      }
    ]
  },

  // ======================== TÜRKÇE ÖDEVLERİ ========================
  {
    baslik: 'Hikaye Yazma - Hayal Gücü',
    aciklama: 'Verilen başlangıç cümlesini kullanarak özgün bir hikaye yazınız.',
    konuBasligi: 'Yaratıcı Yazarlık',
    brans: 'Türkçe',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.SORU_CEVAP,
    maxPuan: 100,
    gunSonra: 10,
    sorular: [
      {
        soruMetni: '"O sabah uyandığımda odamda garip bir ışık gördüm..." cümlesiyle başlayan bir hikaye yazınız. Hikayenizde giriş, gelişme ve sonuç bölümleri olmalıdır. (En az 150 kelime)',
        puan: 50,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Yazdığınız hikayedeki ana karakteri tanıtınız. Fiziksel ve kişilik özellikleri nelerdir?',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Hikayenizde hangi duyguları hissettiniz? Neden bu şekilde bir son tercih ettiniz?',
        puan: 25,
        soruTipi: 'klasik'
      }
    ]
  },
  {
    baslik: 'Dil Bilgisi - Sözcük Türleri',
    aciklama: 'İsim, sıfat, fiil ve zarfları tanıyalım.',
    konuBasligi: '3. Ünite - Sözcük Türleri',
    brans: 'Türkçe',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 4,
    sorular: [
      {
        soruMetni: '"Güzel çiçekler bahçede açtı." cümlesindeki sıfat aşağıdakilerden hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['çiçekler', 'güzel', 'bahçede', 'açtı'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Aşağıdakilerden hangisi fiildir (eylem)?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['kitap', 'güzel', 'koşmak', 'hızlı'],
        dogruCevap: 2
      },
      {
        soruMetni: '"Küçük kedi hızlıca koştu." cümlesindeki zarf hangi kelimedir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['küçük', 'kedi', 'hızlıca', 'koştu'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Aşağıdaki cümlede altı çizili kelimelerin türlerini yazınız: "BÜYÜK ev, HIZLI araba, YAVAŞÇA yürüdü."',
        puan: 20,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '5 isim, 5 sıfat ve 5 fiil yazınız. Her biri için bir cümle kurunuz.',
        puan: 30,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '"Annem bugün lezzetli yemekler pişirdi." cümlesinde kaç tane isim vardır?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['1', '2', '3', '4'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Kendi cümlelerinizde isim, sıfat, fiil ve zarf kullanarak 3 farklı cümle yazınız. Her cümlede bu sözcük türlerini işaretleyiniz.',
        puan: 10,
        soruTipi: 'klasik'
      }
    ]
  },

  // ======================== İNGİLİZCE ÖDEVLERİ ========================
  {
    baslik: 'My Family - Ailem',
    aciklama: 'Aile üyelerini İngilizce olarak tanıyalım ve ailemizi tanıtalım.',
    konuBasligi: 'Unit 2 - Family',
    brans: 'İngilizce',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 6,
    sorular: [
      {
        soruMetni: '"Mother" kelimesinin Türkçe karşılığı nedir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Baba', 'Anne', 'Kardeş', 'Amca'],
        dogruCevap: 1
      },
      {
        soruMetni: '"My _____ is a doctor." cümlesinde boşluğa hangisi gelmelidir? (Babam doktor)',
        puan: 10,
        soruTipi: 'test',
        siklar: ['mother', 'father', 'sister', 'brother'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Write 5 sentences about your family in English. (Aileniz hakkında 5 İngilizce cümle yazınız.)',
        puan: 30,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '"Grandmother" ne demektir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Büyükanne', 'Büyükbaba', 'Teyze', 'Hala'],
        dogruCevap: 0
      },
      {
        soruMetni: 'Draw your family tree and label each member in English. (Aile ağacınızı çizin ve her üyeyi İngilizce etiketleyin.)',
        puan: 20,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Answer: How many people are there in your family? Who are they? (Ailenizde kaç kişi var? Kimler?)',
        puan: 20,
        soruTipi: 'klasik'
      }
    ]
  },
  {
    baslik: 'Daily Routines - Günlük Rutinler',
    aciklama: 'Present Simple tense ile günlük aktivitelerimizi anlatıyoruz.',
    konuBasligi: 'Unit 4 - Daily Life',
    brans: 'İngilizce',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 5,
    sorular: [
      {
        soruMetni: '"I _____ up at 7 o\'clock." boşluğa ne gelmelidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['wake', 'wakes', 'waking', 'waked'],
        dogruCevap: 0
      },
      {
        soruMetni: '"She _____ breakfast every morning." boşluğa ne gelmelidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['eat', 'eats', 'eating', 'ate'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Write your daily routine using at least 8 sentences. Use time expressions (at, in the morning, etc.)',
        puan: 40,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '"brush teeth" ne demektir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['saç taramak', 'diş fırçalamak', 'yüz yıkamak', 'duş almak'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Match the activities with the correct times and write 5 sentences. (Aktiviteleri doğru saatlerle eşleştirin ve 5 cümle yazın.)',
        puan: 30,
        soruTipi: 'klasik'
      }
    ]
  },

  // ======================== FEN BİLİMLERİ ÖDEVLERİ ========================
  {
    baslik: 'Canlıların Dünyası - Hücre',
    aciklama: 'Hücre yapısı, organelleri ve görevlerini öğreniyoruz.',
    konuBasligi: '1. Ünite - Canlılar Dünyası',
    brans: 'Fen Bilimleri',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 8,
    sorular: [
      {
        soruMetni: 'Hücrenin enerji üretiminden sorumlu organeli hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Ribozom', 'Mitokondri', 'Golgi cisimciği', 'Lizozom'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Bitki hücresinde bulunup hayvan hücresinde bulunmayan yapı hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Çekirdek', 'Hücre zarı', 'Kloroplast', 'Sitoplazma'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Bir bitki hücresi çiziniz ve 5 organeli işaretleyip görevlerini yazınız.',
        puan: 30,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Hücre zarının görevi nedir? Açıklayınız.',
        puan: 15,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Çekirdeğin hücre için önemi nedir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Enerji üretir', 'Kalıtım bilgisini taşır', 'Fotosentez yapar', 'Sindirim yapar'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Bitki ve hayvan hücresi arasındaki 3 farkı yazınız ve nedenlerini açıklayınız.',
        puan: 25,
        soruTipi: 'klasik'
      }
    ]
  },
  {
    baslik: 'Madde ve Değişim',
    aciklama: 'Maddenin halleri, fiziksel ve kimyasal değişimler.',
    konuBasligi: '3. Ünite - Madde ve Değişim',
    brans: 'Fen Bilimleri',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 6,
    sorular: [
      {
        soruMetni: 'Aşağıdakilerden hangisi fiziksel değişimdir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Kağıdın yanması', 'Suyun buharlaşması', 'Demirin paslanması', 'Ekmeğin küflenmesi'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Buzun erimesi hangi hal değişimidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Donma', 'Buharlaşma', 'Erime', 'Yoğuşma'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Fiziksel ve kimyasal değişim arasındaki farkları 3 örnek üzerinden açıklayınız.',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Günlük hayattan 5 fiziksel ve 5 kimyasal değişim örneği yazınız.',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Aşağıdakilerden hangisi kimyasal değişimdir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Cam kırılması', 'Şekerin suda erimesi', 'Yumurtanın pişmesi', 'Buz eritme'],
        dogruCevap: 2
      },
      {
        soruMetni: 'Maddenin üç halini (katı, sıvı, gaz) tanımlayınız ve her biri için 2 örnek veriniz.',
        puan: 20,
        soruTipi: 'klasik'
      }
    ]
  },

  // ======================== SOSYAL BİLGİLER ÖDEVLERİ ========================
  {
    baslik: 'Türkiye\'nin Coğrafi Bölgeleri',
    aciklama: 'Türkiye\'nin 7 coğrafi bölgesini ve özelliklerini öğreniyoruz.',
    konuBasligi: '2. Ünite - Güzel Yurdum Türkiye',
    brans: 'Sosyal Bilgiler',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.KARISIK,
    maxPuan: 100,
    gunSonra: 7,
    sorular: [
      {
        soruMetni: 'Türkiye\'nin en kalabalık bölgesi hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Karadeniz Bölgesi', 'Marmara Bölgesi', 'İç Anadolu Bölgesi', 'Ege Bölgesi'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Doğu Anadolu Bölgesi\'nin en önemli özelliği hangisidir?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Sanayi gelişmiştir', 'En yüksek dağlar burada bulunur', 'Denize kıyısı vardır', 'En kalabalık bölgedir'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Türkiye\'nin 7 coğrafi bölgesini bir harita üzerinde gösteriniz ve her birinin 2 özelliğini yazınız.',
        puan: 35,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Karadeniz Bölgesi\'nde tarım ürünleri nelerdir? Neden bu ürünler yetişir?',
        puan: 15,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Akdeniz Bölgesi\'nin iklimi nasıldır?',
        puan: 10,
        soruTipi: 'test',
        siklar: ['Soğuk ve yağışlı', 'Sıcak ve kurak yazlar', 'Ilıman ve yağışlı', 'Çok soğuk kışlar'],
        dogruCevap: 1
      },
      {
        soruMetni: 'Yaşadığınız bölgenin özelliklerini (iklim, tarım, turizm, sanayi) 10 cümle ile anlatınız.',
        puan: 20,
        soruTipi: 'klasik'
      }
    ]
  },
  {
    baslik: 'Atatürk ve Cumhuriyet',
    aciklama: 'Atatürk\'ün hayatı, ilkeleri ve Cumhuriyet\'in kuruluşu.',
    konuBasligi: '4. Ünite - Milli Mücadele',
    brans: 'Sosyal Bilgiler',
    siniflar: ['5-A', '5-B'],
    odevTipi: OdevTipi.SORU_CEVAP,
    maxPuan: 100,
    gunSonra: 10,
    sorular: [
      {
        soruMetni: 'Atatürk\'ün hayatını kronolojik sırayla anlatınız. (Doğumu, eğitimi, askeri başarıları, Cumhuriyet\'in ilanı)',
        puan: 30,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Atatürk ilkelerinden 3 tanesini seçerek açıklayınız ve günümüzde nasıl uygulandığını örneklerle gösteriniz.',
        puan: 30,
        soruTipi: 'klasik'
      },
      {
        soruMetni: '29 Ekim 1923\'te ne olmuştur? Bu günün önemi nedir? Detaylı anlatınız.',
        puan: 25,
        soruTipi: 'klasik'
      },
      {
        soruMetni: 'Atatürk\'ün eğitime verdiği önemi gösteren 3 örnek veriniz ve yorumlayınız.',
        puan: 15,
        soruTipi: 'klasik'
      }
    ]
  }
];

async function main() {
  console.log('📚 Ödev seed işlemi başlıyor...\n');

  // Zambak kursu için işlem yapacağız
  const kurs = await prisma.kurs.findFirst({
    where: { ad: 'Maltepe Zambak' }
  });

  if (!kurs) {
    console.log('❌ Maltepe Zambak kursu bulunamadı!');
    return;
  }

  console.log(`✅ Kurs: ${kurs.ad}\n`);

  // Sınıfları al
  const siniflar = await prisma.sinif.findMany({
    where: {
      kursId: kurs.id,
      ad: { in: ['5-A', '5-B'] }
    }
  });

  if (siniflar.length === 0) {
    console.log('❌ 5-A ve 5-B sınıfları bulunamadı!');
    return;
  }

  console.log(`✅ Sınıflar: ${siniflar.map(s => s.ad).join(', ')}\n`);

  // Öğretmenleri al (branşa göre)
  const ogretmenler = await prisma.user.findMany({
    where: {
      kursId: kurs.id,
      role: 'ogretmen',
      brans: { in: ['Matematik', 'Türkçe', 'İngilizce', 'Fen Bilimleri', 'Sosyal Bilgiler'] }
    }
  });

  console.log(`✅ Öğretmenler: ${ogretmenler.length} kişi\n`);

  // Her sınıf için dersleri al veya oluştur
  for (const sinif of siniflar) {
    console.log(`\n📁 ${sinif.ad} sınıfı için dersler ve ödevler oluşturuluyor...`);

    for (const odevData of odevlerData) {
      // Bu sınıf bu ödev için hedeflenmiş mi?
      if (!odevData.siniflar.includes(sinif.ad)) continue;

      // Branşa uygun öğretmeni bul
      const ogretmen = ogretmenler.find(o => o.brans === odevData.brans);
      if (!ogretmen) {
        console.log(`   ⚠️ ${odevData.brans} öğretmeni bulunamadı, atlanıyor...`);
        continue;
      }

      // Bu sınıf için bu öğretmenin dersi var mı?
      let course = await prisma.course.findFirst({
        where: {
          sinifId: sinif.id,
          ogretmenId: ogretmen.id,
        }
      });

      // Ders yoksa oluştur
      if (!course) {
        course = await prisma.course.create({
          data: {
            ad: `${odevData.brans} - ${sinif.ad}`,
            sinifId: sinif.id,
            ogretmenId: ogretmen.id,
            gun: 'Pazartesi',
            baslangicSaati: '09:00',
            bitisSaati: '09:40',
            aktif: true
          }
        });
        console.log(`   ➕ Ders oluşturuldu: ${course.ad}`);
      }

      // Son teslim tarihini hesapla
      const sonTeslim = new Date();
      sonTeslim.setDate(sonTeslim.getDate() + odevData.gunSonra);
      sonTeslim.setHours(23, 59, 59, 999);

      // Ödevin zaten var olup olmadığını kontrol et
      const mevcutOdev = await prisma.odev.findFirst({
        where: {
          baslik: `${odevData.baslik} - ${sinif.ad}`,
          courseId: course.id
        }
      });

      if (mevcutOdev) {
        console.log(`   ⏭️ Ödev zaten mevcut: ${odevData.baslik} - ${sinif.ad}`);
        continue;
      }

      // Ödevi oluştur
      const odev = await prisma.odev.create({
        data: {
          baslik: `${odevData.baslik} - ${sinif.ad}`,
          aciklama: odevData.aciklama,
          konuBasligi: odevData.konuBasligi,
          courseId: course.id,
          ogretmenId: ogretmen.id,
          odevTipi: odevData.odevTipi,
          maxPuan: odevData.maxPuan,
          sonTeslimTarihi: sonTeslim,
          baslangicTarihi: new Date(),
          aktif: true,
          taslak: false,
          hedefSiniflar: JSON.stringify([sinif.id])
        }
      });

      console.log(`   ✅ Ödev: ${odev.baslik}`);

      // Soruları ekle
      for (let i = 0; i < odevData.sorular.length; i++) {
        const soruData = odevData.sorular[i] as any;
        await prisma.odevSoru.create({
          data: {
            odevId: odev.id,
            soruMetni: soruData.soruMetni,
            puan: soruData.puan,
            siraNo: i + 1,
            soruTipi: soruData.soruTipi,
            siklar: soruData.siklar ? soruData.siklar : undefined,
            dogruCevap: soruData.dogruCevap !== undefined ? soruData.dogruCevap : null
          }
        });
      }
      console.log(`      📝 ${odevData.sorular.length} soru eklendi`);
    }
  }

  // İstatistikler
  const toplamOdev = await prisma.odev.count({
    where: {
      course: {
        sinif: {
          kursId: kurs.id,
          ad: { in: ['5-A', '5-B'] }
        }
      }
    }
  });

  const toplamSoru = await prisma.odevSoru.count({
    where: {
      odev: {
        course: {
          sinif: {
            kursId: kurs.id,
            ad: { in: ['5-A', '5-B'] }
          }
        }
      }
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎉 ÖDEV SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 İSTATİSTİKLER:');
  console.log(`   📚 Toplam Ödev: ${toplamOdev}`);
  console.log(`   📝 Toplam Soru: ${toplamSoru}`);
  console.log('');
  console.log('📋 OLUŞTURULAN ÖDEVLER:');
  console.log('   ─────────────────────────────────────────');
  console.log('   5-A ve 5-B sınıfları için:');
  console.log('   • Matematik - Doğal Sayılarla İşlemler');
  console.log('   • Matematik - Kesirler ve Ondalık Sayılar');
  console.log('   • Türkçe - Hikaye Yazma');
  console.log('   • Türkçe - Dil Bilgisi - Sözcük Türleri');
  console.log('   • İngilizce - My Family');
  console.log('   • İngilizce - Daily Routines');
  console.log('   • Fen Bilimleri - Hücre');
  console.log('   • Fen Bilimleri - Madde ve Değişim');
  console.log('   • Sosyal Bilgiler - Türkiye\'nin Coğrafi Bölgeleri');
  console.log('   • Sosyal Bilgiler - Atatürk ve Cumhuriyet');
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

