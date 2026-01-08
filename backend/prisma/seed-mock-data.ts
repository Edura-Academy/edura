import { PrismaClient, Role, ExamType, OdevDurum, OdevTipi, YoklamaDurum, NotificationType, DuyuruHedef, DuyuruOncelik, CanliDersDurum, OnlineSinavDurum, SoruTipi, MateryalTipi, BirebirDersDurum, DestekTalebiDurum, DestekTalebiKategori, DestekTalebiOncelik, AdminDuyuruOncelik, ChangelogTip, FAQKategori, RozetTipi, GorevTipi, DenemeTuru, DenemeBrans, KurumIciDenemeDurum } from '@prisma/client';

const prisma = new PrismaClient();

// Yardımcı fonksiyonlar
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Şu anki tarih
const now = new Date();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Mock Data Seed Başlıyor...\n');

  // Mevcut verileri al
  const kurslar = await prisma.kurs.findMany({ where: { aktif: true } });
  const siniflar = await prisma.sinif.findMany({ where: { aktif: true } });
  const ogretmenler = await prisma.user.findMany({ where: { role: Role.ogretmen, aktif: true } });
  const ogrenciler = await prisma.user.findMany({ where: { role: Role.ogrenci, aktif: true } });
  const mudurler = await prisma.user.findMany({ where: { role: Role.mudur, aktif: true } });
  const dersler = await prisma.course.findMany({ where: { aktif: true } });

  console.log(`📊 Mevcut Veriler:`);
  console.log(`   Kurs: ${kurslar.length}, Sınıf: ${siniflar.length}`);
  console.log(`   Öğretmen: ${ogretmenler.length}, Öğrenci: ${ogrenciler.length}`);
  console.log(`   Müdür: ${mudurler.length}, Ders: ${dersler.length}\n`);

  if (kurslar.length === 0 || ogrenciler.length === 0 || ogretmenler.length === 0) {
    console.log('❌ Önce seed.ts çalıştırılmalı!');
    return;
  }

  // ==================== 1. FAQ (Yardım Merkezi) ====================
  console.log('📚 FAQ verileri oluşturuluyor...');
  
  const faqData = [
    { soru: 'Şifremi unuttum, ne yapmalıyım?', cevap: 'Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayarak e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.', kategori: FAQKategori.HESAP, anahtarKelimeler: 'şifre, unutma, sıfırlama' },
    { soru: 'Öğrenci nasıl eklenir?', cevap: 'Öğrenci Yönetimi > Yeni Öğrenci Ekle butonuna tıklayarak öğrenci bilgilerini girebilirsiniz. Toplu ekleme için Excel şablonunu kullanabilirsiniz.', kategori: FAQKategori.OGRENCI, anahtarKelimeler: 'öğrenci, ekleme, kayıt' },
    { soru: 'Ders programı nasıl oluşturulur?', cevap: 'Ders Yönetimi menüsünden sınıf ve öğretmen seçerek ders programını oluşturabilirsiniz. Çakışma kontrolü otomatik yapılır.', kategori: FAQKategori.DERS, anahtarKelimeler: 'ders, program, çizelge' },
    { soru: 'Yoklama nasıl alınır?', cevap: 'Öğretmen panelinden ilgili derse tıklayarak yoklama alabilirsiniz. Devamsızlık durumları otomatik kaydedilir.', kategori: FAQKategori.DERS, anahtarKelimeler: 'yoklama, devamsızlık, katılım' },
    { soru: 'Canlı ders nasıl başlatılır?', cevap: 'Canlı Dersler menüsünden yeni ders oluşturup tarih/saat belirleyin. Jitsi entegrasyonu ile ders otomatik başlar.', kategori: FAQKategori.CANLI_DERS, anahtarKelimeler: 'canlı, online, video' },
    { soru: 'Sınav sonuçları nasıl girilir?', cevap: 'Sınav Yönetimi > Sonuç Girişi bölümünden sınav seçerek sonuçları girebilirsiniz. Toplu giriş de yapılabilir.', kategori: FAQKategori.SINAV, anahtarKelimeler: 'sınav, sonuç, puan' },
    { soru: 'Mesaj gönderme limiti var mı?', cevap: 'Hayır, mesajlaşma sisteminde herhangi bir limit bulunmamaktadır.', kategori: FAQKategori.MESAJLASMA, anahtarKelimeler: 'mesaj, limit, sınır' },
    { soru: 'Ödeme takibi nasıl yapılır?', cevap: 'Ödeme Yönetimi menüsünden öğrenci bazlı ödeme planları oluşturabilir ve takip edebilirsiniz.', kategori: FAQKategori.ODEME, anahtarKelimeler: 'ödeme, taksit, fatura' },
    { soru: 'Öğretmen performansı nasıl görüntülenir?', cevap: 'Raporlar > Öğretmen Performans bölümünden detaylı istatistiklere ulaşabilirsiniz.', kategori: FAQKategori.OGRETMEN, anahtarKelimeler: 'performans, rapor, istatistik' },
    { soru: 'Sistem hangi tarayıcıları destekler?', cevap: 'Chrome, Firefox, Safari ve Edge tarayıcılarının güncel sürümlerini destekliyoruz.', kategori: FAQKategori.TEKNIK, anahtarKelimeler: 'tarayıcı, browser, uyumluluk' },
    { soru: 'Mobil uygulama var mı?', cevap: 'Evet, iOS ve Android için mobil uygulamalarımız mevcuttur. App Store ve Play Store\'dan indirilebilir.', kategori: FAQKategori.GENEL, anahtarKelimeler: 'mobil, uygulama, telefon' },
    { soru: 'Veri yedeği nasıl alınır?', cevap: 'Ayarlar > Yedekleme bölümünden manuel yedek alabilirsiniz. Sistem ayrıca günlük otomatik yedekleme yapmaktadır.', kategori: FAQKategori.TEKNIK, anahtarKelimeler: 'yedek, backup, veri' },
  ];

  let faqCount = 0;
  for (let i = 0; i < faqData.length; i++) {
    const faq = faqData[i];
    const existing = await prisma.fAQ.findFirst({ where: { soru: faq.soru } });
    if (!existing) {
      await prisma.fAQ.create({
        data: {
          ...faq,
          siraNo: i + 1,
          goruntulemeSayisi: randomInt(10, 500),
          faydaliSayisi: randomInt(5, 100),
          aktif: true,
        }
      });
      faqCount++;
    }
  }
  console.log(`   ✅ ${faqCount} FAQ kaydı oluşturuldu\n`);

  // ==================== 2. Changelog ====================
  console.log('📝 Changelog verileri oluşturuluyor...');
  
  const changelogData = [
    { versiyon: '1.0.0', baslik: 'İlk Sürüm', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'Edura Kurs Takip Sistemi ilk sürümü yayınlandı.', degisiklikler: JSON.stringify(['Öğrenci yönetimi', 'Öğretmen yönetimi', 'Ders programı', 'Mesajlaşma sistemi']) },
    { versiyon: '1.1.0', baslik: 'Canlı Ders Modülü', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'Jitsi entegrasyonu ile canlı ders özelliği eklendi.', degisiklikler: JSON.stringify(['Canlı ders oluşturma', 'Katılım takibi', 'Ders kaydı']) },
    { versiyon: '1.2.0', baslik: 'Online Sınav Sistemi', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'Online sınav oluşturma ve değerlendirme sistemi eklendi.', degisiklikler: JSON.stringify(['Sınav oluşturma', 'Otomatik değerlendirme', 'Sonuç raporları']) },
    { versiyon: '1.2.1', baslik: 'Performans İyileştirmesi', tip: ChangelogTip.PERFORMANS, aciklama: 'Sayfa yüklenme süreleri optimize edildi.', degisiklikler: JSON.stringify(['Lazy loading', 'Önbellekleme', 'Sorgu optimizasyonu']) },
    { versiyon: '1.3.0', baslik: 'Ödeme Modülü', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'Ödeme takip ve yönetim sistemi eklendi.', degisiklikler: JSON.stringify(['Ödeme planları', 'Taksit takibi', 'İyzico entegrasyonu']) },
    { versiyon: '1.3.1', baslik: 'Güvenlik Güncellemesi', tip: ChangelogTip.GUVENLIK, aciklama: 'Güvenlik açıkları giderildi ve şifreleme güçlendirildi.', degisiklikler: JSON.stringify(['JWT güncelleme', 'Rate limiting', 'XSS koruması']) },
    { versiyon: '1.4.0', baslik: 'Gamification', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'XP, rozet ve günlük görev sistemi eklendi.', degisiklikler: JSON.stringify(['XP sistemi', 'Rozetler', 'Günlük görevler', 'Günün sorusu']) },
    { versiyon: '1.4.1', baslik: 'Bug Düzeltmeleri', tip: ChangelogTip.HATA_DUZELTME, aciklama: 'Raporlanan hatalar düzeltildi.', degisiklikler: JSON.stringify(['Mesaj gönderme hatası', 'Tarih formatı', 'Mobil görünüm']) },
    { versiyon: '1.5.0', baslik: 'Deneme Sınavı Modülü', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'TYT/AYT/LGS deneme sınavı takip sistemi eklendi.', degisiklikler: JSON.stringify(['Branş bazlı sonuçlar', 'Sıralama', 'Trend analizi']) },
    { versiyon: '2.0.0', baslik: 'Büyük Güncelleme', tip: ChangelogTip.YENI_OZELLIK, aciklama: 'Arayüz yenilendi ve yeni özellikler eklendi.', degisiklikler: JSON.stringify(['Yeni UI tasarımı', 'Dark mode', 'Gelişmiş raporlar', 'API v2']) },
  ];

  let changelogCount = 0;
  for (let i = 0; i < changelogData.length; i++) {
    const cl = changelogData[i];
    const existing = await prisma.changelog.findFirst({ where: { versiyon: cl.versiyon } });
    if (!existing) {
      await prisma.changelog.create({
        data: {
          ...cl,
          yayinTarihi: new Date(2024, 0, 1 + i * 30),
          aktif: true,
        }
      });
      changelogCount++;
    }
  }
  console.log(`   ✅ ${changelogCount} Changelog kaydı oluşturuldu\n`);

  // ==================== 3. Admin Duyuruları ====================
  console.log('📢 Admin duyuruları oluşturuluyor...');
  
  const adminDuyuruData = [
    { baslik: 'Yeni Dönem Başlangıcı', icerik: 'Yeni eğitim dönemi 15 Ocak\'ta başlayacaktır. Tüm kayıtların bu tarihe kadar tamamlanması gerekmektedir.', oncelik: AdminDuyuruOncelik.ONEMLI },
    { baslik: 'Sistem Bakımı', icerik: 'Bu hafta sonu sistem bakım çalışması yapılacaktır. 23:00 - 03:00 arası erişim kesintisi olabilir.', oncelik: AdminDuyuruOncelik.NORMAL },
    { baslik: 'Yeni Özellik: Canlı Ders', icerik: 'Canlı ders modülü aktif edildi. Öğretmenler canlı ders oluşturabilir.', oncelik: AdminDuyuruOncelik.NORMAL },
    { baslik: 'Acil: Güvenlik Güncellemesi', icerik: 'Tüm kullanıcıların şifrelerini yenilemesi önerilmektedir.', oncelik: AdminDuyuruOncelik.ACIL },
    { baslik: 'Aylık Rapor Hatırlatması', icerik: 'Aylık performans raporlarının incelenmesi için giriş yapmanız gerekmektedir.', oncelik: AdminDuyuruOncelik.NORMAL },
  ];

  let adminDuyuruCount = 0;
  for (const duyuru of adminDuyuruData) {
    const existing = await prisma.adminDuyuru.findFirst({ where: { baslik: duyuru.baslik } });
    if (!existing) {
      const ad = await prisma.adminDuyuru.create({
        data: {
          ...duyuru,
          yayinTarihi: randomDate(oneMonthAgo, now),
          aktif: true,
        }
      });
      
      // Bazı müdürler tarafından okunmuş
      for (const mudur of mudurler.slice(0, randomInt(1, 3))) {
        await prisma.adminDuyuruOkuma.create({
          data: {
            adminDuyuruId: ad.id,
            userId: mudur.id,
            okunmaTarihi: randomDate(oneMonthAgo, now),
          }
        }).catch(() => {}); // Duplicate'leri atla
      }
      adminDuyuruCount++;
    }
  }
  console.log(`   ✅ ${adminDuyuruCount} Admin duyurusu oluşturuldu\n`);

  // ==================== 4. Kurs Duyuruları ====================
  console.log('📢 Kurs duyuruları oluşturuluyor...');
  
  const duyuruSablonlari = [
    { baslik: 'Veli Toplantısı', icerik: 'Bu Cumartesi saat 14:00\'de veli toplantımız yapılacaktır. Katılımınızı bekliyoruz.', hedef: DuyuruHedef.VELILER, oncelik: DuyuruOncelik.ONEMLI },
    { baslik: 'Sınav Takvimi Açıklandı', icerik: 'Dönem sonu sınav takvimi yayınlandı. Detaylar için paneli inceleyiniz.', hedef: DuyuruHedef.OGRENCILER, oncelik: DuyuruOncelik.ONEMLI },
    { baslik: 'Kütüphane Saatleri', icerik: 'Kütüphane yeni dönemde 08:00-20:00 arası açık olacaktır.', hedef: DuyuruHedef.HERKESE, oncelik: DuyuruOncelik.NORMAL },
    { baslik: 'Öğretmen Toplantısı', icerik: 'Haftalık öğretmen toplantımız Pazartesi 15:00\'de gerçekleşecektir.', hedef: DuyuruHedef.OGRETMENLER, oncelik: DuyuruOncelik.NORMAL },
    { baslik: 'Etüt Programı', icerik: 'Yeni etüt programı açıklandı. Başvurular başladı.', hedef: DuyuruHedef.OGRENCILER, oncelik: DuyuruOncelik.NORMAL },
    { baslik: 'Karne Dağıtımı', icerik: 'Karneler bu Cuma velilere teslim edilecektir.', hedef: DuyuruHedef.VELILER, oncelik: DuyuruOncelik.ONEMLI },
  ];

  let duyuruCount = 0;
  for (const kurs of kurslar) {
    const kursMudur = mudurler.find(m => m.kursId === kurs.id);
    if (!kursMudur) continue;

    for (const sablon of duyuruSablonlari) {
      const existing = await prisma.duyuru.findFirst({ 
        where: { baslik: `${kurs.ad} - ${sablon.baslik}`, kursId: kurs.id } 
      });
      
      if (!existing) {
        await prisma.duyuru.create({
          data: {
            baslik: `${kurs.ad} - ${sablon.baslik}`,
            icerik: sablon.icerik,
            hedef: sablon.hedef,
            oncelik: sablon.oncelik,
            olusturanId: kursMudur.id,
            kursId: kurs.id,
            yayinTarihi: randomDate(oneMonthAgo, now),
            aktif: true,
          }
        });
        duyuruCount++;
      }
    }
  }
  console.log(`   ✅ ${duyuruCount} Duyuru oluşturuldu\n`);

  // ==================== 5. Yoklama ve Devamsızlık ====================
  console.log('📋 Yoklama verileri oluşturuluyor...');
  
  let yoklamaCount = 0;
  let devamsizlikCount = 0;

  // Son 30 gün için yoklama
  for (const ders of dersler.slice(0, 50)) { // İlk 50 ders için
    const dersOgrencileri = await prisma.courseEnrollment.findMany({
      where: { courseId: ders.id, aktif: true },
      include: { ogrenci: true }
    });

    // Son 10 ders günü için
    for (let i = 0; i < 10; i++) {
      const tarih = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      tarih.setHours(9, 0, 0, 0);

      for (const kayit of dersOgrencileri.slice(0, 10)) {
        const existing = await prisma.yoklama.findUnique({
          where: {
            ogrenciId_courseId_tarih: {
              ogrenciId: kayit.ogrenciId,
              courseId: ders.id,
              tarih: tarih
            }
          }
        });

        if (!existing) {
          // %80 katılım oranı
          const durum = Math.random() > 0.2 
            ? YoklamaDurum.KATILDI 
            : randomElement([YoklamaDurum.KATILMADI, YoklamaDurum.GEC_KALDI, YoklamaDurum.IZINLI]);

          await prisma.yoklama.create({
            data: {
              ogrenciId: kayit.ogrenciId,
              courseId: ders.id,
              tarih: tarih,
              durum: durum,
              aciklama: durum === YoklamaDurum.IZINLI ? 'Sağlık raporu' : undefined,
            }
          });
          yoklamaCount++;

          // Devamsızlık kaydı
          if (durum === YoklamaDurum.KATILMADI) {
            const existingDev = await prisma.devamsizlik.findFirst({
              where: { ogrenciId: kayit.ogrenciId, courseId: ders.id, tarih: tarih }
            });
            if (!existingDev) {
              await prisma.devamsizlik.create({
                data: {
                  ogrenciId: kayit.ogrenciId,
                  courseId: ders.id,
                  tarih: tarih,
                  aciklama: 'Otomatik kaydedildi',
                }
              });
              devamsizlikCount++;
            }
          }
        }
      }
    }
  }
  console.log(`   ✅ ${yoklamaCount} Yoklama, ${devamsizlikCount} Devamsızlık kaydı oluşturuldu\n`);

  // ==================== 6. Sınavlar ve Sonuçlar ====================
  console.log('📝 Sınav verileri oluşturuluyor...');
  
  let sinavCount = 0;
  let sonucCount = 0;

  for (const ders of dersler.slice(0, 30)) { // İlk 30 ders için
    // Her ders için 2 sınav
    for (let i = 0; i < 2; i++) {
      const tip = randomElement([ExamType.SINAV, ExamType.QUIZ, ExamType.DENEME]);
      const sinavAd = `${ders.ad} - ${tip === ExamType.SINAV ? 'Vize' : tip === ExamType.QUIZ ? 'Quiz' : 'Deneme'} ${i + 1}`;
      
      const existing = await prisma.exam.findFirst({ where: { ad: sinavAd, courseId: ders.id } });
      if (existing) continue;

      const sinav = await prisma.exam.create({
        data: {
          ad: sinavAd,
          tip: tip,
          courseId: ders.id,
          tarih: randomDate(oneMonthAgo, now),
          sure: randomElement([30, 45, 60]),
          toplamPuan: 100,
          aciklama: `${ders.ad} dersi ${tip.toLowerCase()} sınavı`,
        }
      });
      sinavCount++;

      // Sınav sonuçları
      const dersOgrencileri = await prisma.courseEnrollment.findMany({
        where: { courseId: ders.id, aktif: true },
        take: 15
      });

      for (const kayit of dersOgrencileri) {
        const puan = randomInt(40, 100);
        const dogru = Math.floor(puan / 5);
        const yanlis = randomInt(0, 5);
        const bos = 20 - dogru - yanlis;

        await prisma.examResult.create({
          data: {
            examId: sinav.id,
            ogrenciId: kayit.ogrenciId,
            puan: puan,
            dogru: dogru,
            yanlis: yanlis,
            bos: bos > 0 ? bos : 0,
            yuzde: puan,
          }
        }).catch(() => {}); // Duplicate'leri atla
        sonucCount++;
      }
    }
  }
  console.log(`   ✅ ${sinavCount} Sınav, ${sonucCount} Sınav sonucu oluşturuldu\n`);

  // ==================== 7. Ödevler ====================
  console.log('📚 Ödev verileri oluşturuluyor...');
  
  let odevCount = 0;
  let teslimCount = 0;

  const odevSablonlari = [
    { baslik: 'Konu Tekrar Soruları', aciklama: 'İşlenen konularla ilgili 20 soru çözünüz.', odevTipi: OdevTipi.SORU_CEVAP },
    { baslik: 'Araştırma Ödevi', aciklama: 'Verilen konuyu araştırıp rapor hazırlayınız.', odevTipi: OdevTipi.DOSYA_YUKLE },
    { baslik: 'Çalışma Kağıdı', aciklama: 'Çalışma kağıdındaki soruları cevaplayınız.', odevTipi: OdevTipi.KLASIK },
    { baslik: 'Proje Ödevi', aciklama: 'Dönem projesi hazırlayınız.', odevTipi: OdevTipi.KARISIK },
  ];

  for (const ders of dersler.slice(0, 25)) {
    for (const sablon of odevSablonlari.slice(0, 2)) {
      const odevAd = `${ders.ad} - ${sablon.baslik}`;
      const existing = await prisma.odev.findFirst({ where: { baslik: odevAd, courseId: ders.id } });
      if (existing) continue;

      const baslangic = randomDate(oneMonthAgo, oneWeekAgo);
      const odev = await prisma.odev.create({
        data: {
          baslik: odevAd,
          aciklama: sablon.aciklama,
          courseId: ders.id,
          ogretmenId: ders.ogretmenId,
          baslangicTarihi: baslangic,
          sonTeslimTarihi: new Date(baslangic.getTime() + 14 * 24 * 60 * 60 * 1000),
          maxPuan: 100,
          odevTipi: sablon.odevTipi,
          aktif: true,
        }
      });
      odevCount++;

      // Ödev teslimleri
      const dersOgrencileri = await prisma.courseEnrollment.findMany({
        where: { courseId: ders.id, aktif: true },
        take: 10
      });

      for (const kayit of dersOgrencileri) {
        if (Math.random() > 0.3) { // %70 teslim oranı
          const durum = randomElement([OdevDurum.TESLIM_EDILDI, OdevDurum.DEGERLENDIRILDI]);
          
          await prisma.odevTeslim.create({
            data: {
              odevId: odev.id,
              ogrenciId: kayit.ogrenciId,
              teslimTarihi: randomDate(baslangic, now),
              aciklama: 'Ödevim ektedir.',
              durum: durum,
              puan: durum === OdevDurum.DEGERLENDIRILDI ? randomInt(60, 100) : undefined,
              ogretmenYorumu: durum === OdevDurum.DEGERLENDIRILDI ? 'İyi çalışma.' : undefined,
            }
          }).catch(() => {});
          teslimCount++;
        }
      }
    }
  }
  console.log(`   ✅ ${odevCount} Ödev, ${teslimCount} Teslim oluşturuldu\n`);

  // ==================== 8. Bildirimler ====================
  console.log('🔔 Bildirim verileri oluşturuluyor...');
  
  let bildirimCount = 0;

  const bildirimSablonlari = [
    { baslik: 'Yeni Ödev', mesaj: 'Yeni bir ödev eklendi.', tip: NotificationType.BILDIRIM },
    { baslik: 'Sınav Sonucu', mesaj: 'Sınav sonucunuz açıklandı.', tip: NotificationType.BILDIRIM },
    { baslik: 'Yoklama Uyarısı', mesaj: 'Devamsızlık sayınız artıyor.', tip: NotificationType.BILDIRIM },
    { baslik: 'Ödeme Hatırlatması', mesaj: 'Ödeme tarihiniz yaklaşıyor.', tip: NotificationType.SISTEM },
    { baslik: 'Yeni Duyuru', mesaj: 'Yeni bir duyuru yayınlandı.', tip: NotificationType.BILDIRIM },
  ];

  for (const ogrenci of ogrenciler.slice(0, 100)) {
    for (const sablon of bildirimSablonlari.slice(0, randomInt(2, 4))) {
      const existing = await prisma.notification.findFirst({
        where: { userId: ogrenci.id, baslik: sablon.baslik }
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: ogrenci.id,
            tip: sablon.tip,
            baslik: sablon.baslik,
            mesaj: sablon.mesaj,
            okundu: Math.random() > 0.3,
          }
        });
        bildirimCount++;
      }
    }
  }
  console.log(`   ✅ ${bildirimCount} Bildirim oluşturuldu\n`);

  // ==================== 9. Canlı Dersler ====================
  console.log('🎥 Canlı ders verileri oluşturuluyor...');
  
  let canliDersCount = 0;

  for (const ders of dersler.slice(0, 20)) {
    // Her ders için 2 canlı ders
    for (let i = 0; i < 2; i++) {
      const baslik = `${ders.ad} - Online Ders ${i + 1}`;
      const existing = await prisma.canliDers.findFirst({ where: { baslik: baslik, courseId: ders.id } });
      if (existing) continue;

      const baslangic = i === 0 
        ? randomDate(oneWeekAgo, now) // Geçmiş
        : randomDate(now, oneWeekLater); // Gelecek
      
      const bitis = new Date(baslangic.getTime() + 60 * 60 * 1000); // 1 saat

      await prisma.canliDers.create({
        data: {
          baslik: baslik,
          aciklama: `${ders.ad} dersi canlı yayını`,
          courseId: ders.id,
          ogretmenId: ders.ogretmenId,
          baslangicTarihi: baslangic,
          bitisTarihi: bitis,
          odaAdi: `edura-${ders.id.slice(0, 8)}-${i}`,
          kayitYapilsin: Math.random() > 0.5,
          mikrofonAcik: true,
          kameraAcik: true,
          sohbetAcik: true,
          durum: i === 0 ? CanliDersDurum.SONA_ERDI : CanliDersDurum.PLANLANMIS,
        }
      });
      canliDersCount++;
    }
  }
  console.log(`   ✅ ${canliDersCount} Canlı ders oluşturuldu\n`);

  // ==================== 10. Birebir Dersler ====================
  console.log('👤 Birebir ders verileri oluşturuluyor...');
  
  let birebirDersCount = 0;
  let birebirPaketCount = 0;

  // Bazı öğrencilere paket ata
  for (const ogrenci of ogrenciler.slice(0, 20)) {
    const existing = await prisma.birebirDersPaketi.findFirst({
      where: { ogrenciId: ogrenci.id, aktif: true }
    });
    if (!existing) {
      await prisma.birebirDersPaketi.create({
        data: {
          ogrenciId: ogrenci.id,
          toplamSaat: randomElement([10, 20, 30]),
          kullanilanSaat: randomInt(0, 10),
          kalanSaat: randomInt(5, 20),
          fiyat: randomElement([1500, 2500, 3500]),
          aktif: true,
        }
      });
      birebirPaketCount++;
    }
  }

  // Birebir ders randevuları
  for (const ogretmen of ogretmenler.slice(0, 10)) {
    for (let i = 0; i < 3; i++) {
      const ogrenci = randomElement(ogrenciler.slice(0, 20));
      const tarih = randomDate(oneWeekAgo, oneWeekLater);
      
      const existing = await prisma.birebirDers.findFirst({
        where: { 
          ogretmenId: ogretmen.id, 
          ogrenciId: ogrenci.id,
          tarih: tarih
        }
      });
      if (existing) continue;

      await prisma.birebirDers.create({
        data: {
          ogretmenId: ogretmen.id,
          ogrenciId: ogrenci.id,
          konu: `${ogretmen.brans || 'Genel'} Takviye`,
          aciklama: 'Konu tekrarı yapılacak',
          tarih: tarih,
          baslangicSaati: randomElement(['10:00', '14:00', '16:00']),
          bitisSaati: randomElement(['11:00', '15:00', '17:00']),
          sure: 60,
          durum: tarih < now ? BirebirDersDurum.TAMAMLANDI : BirebirDersDurum.PLANLANMIS,
        }
      });
      birebirDersCount++;
    }
  }
  console.log(`   ✅ ${birebirPaketCount} Paket, ${birebirDersCount} Birebir ders oluşturuldu\n`);

  // ==================== 11. Materyaller ====================
  console.log('📁 Materyal verileri oluşturuluyor...');
  
  let materyalCount = 0;

  const materyalSablonlari = [
    { baslik: 'Ders Notu', tip: MateryalTipi.PDF, dosyaAdi: 'ders-notu.pdf' },
    { baslik: 'Konu Anlatım Videosu', tip: MateryalTipi.VIDEO, dosyaAdi: 'konu-anlatim.mp4' },
    { baslik: 'Çalışma Kağıdı', tip: MateryalTipi.BELGE, dosyaAdi: 'calisma-kagidi.docx' },
    { baslik: 'Sunum', tip: MateryalTipi.SUNUM, dosyaAdi: 'sunum.pptx' },
  ];

  for (const ders of dersler.slice(0, 25)) {
    for (const sablon of materyalSablonlari.slice(0, 2)) {
      const baslik = `${ders.ad} - ${sablon.baslik}`;
      const existing = await prisma.materyal.findFirst({ where: { baslik: baslik, courseId: ders.id } });
      if (existing) continue;

      await prisma.materyal.create({
        data: {
          baslik: baslik,
          aciklama: `${ders.ad} dersi için ${sablon.baslik.toLowerCase()}`,
          courseId: ders.id,
          yukleyenId: ders.ogretmenId,
          tip: sablon.tip,
          dosyaUrl: `https://storage.edura.com/materyaller/${sablon.dosyaAdi}`,
          dosyaAdi: sablon.dosyaAdi,
          dosyaBoyutu: randomInt(100000, 5000000),
          indirmeSayisi: randomInt(5, 50),
          aktif: true,
        }
      });
      materyalCount++;
    }
  }
  console.log(`   ✅ ${materyalCount} Materyal oluşturuldu\n`);

  // ==================== 12. Günün Sorusu ====================
  console.log('❓ Günün sorusu verileri oluşturuluyor...');
  
  let gununSorusuCount = 0;

  const sorular = [
    { soruMetni: '2 + 2 × 3 işleminin sonucu kaçtır?', secenekler: ['6', '8', '10', '12'], dogruCevap: 'B', konu: 'Matematik', zorluk: 1 },
    { soruMetni: 'Atatürk hangi yılda doğmuştur?', secenekler: ['1879', '1880', '1881', '1882'], dogruCevap: 'C', konu: 'Tarih', zorluk: 1 },
    { soruMetni: 'Suyun kimyasal formülü nedir?', secenekler: ['CO2', 'H2O', 'NaCl', 'O2'], dogruCevap: 'B', konu: 'Fen Bilimleri', zorluk: 1 },
    { soruMetni: 'Türkiye\'nin başkenti neresidir?', secenekler: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], dogruCevap: 'B', konu: 'Coğrafya', zorluk: 1 },
    { soruMetni: '∫x dx ifadesinin sonucu nedir?', secenekler: ['x²', 'x²/2 + C', '2x', '1'], dogruCevap: 'B', konu: 'Matematik', zorluk: 3 },
    { soruMetni: 'Newton\'un ikinci hareket yasası nedir?', secenekler: ['F=ma', 'E=mc²', 'PV=nRT', 'V=IR'], dogruCevap: 'A', konu: 'Fizik', zorluk: 2 },
    { soruMetni: '1. Dünya Savaşı hangi yılda sona ermiştir?', secenekler: ['1916', '1917', '1918', '1919'], dogruCevap: 'C', konu: 'Tarih', zorluk: 2 },
    { soruMetni: 'DNA\'nın açılımı nedir?', secenekler: ['Deoksiribo Nükleik Asit', 'Diribo Nükleik Asit', 'Deoksi Nükleer Asit', 'Diazot Nükleik Asit'], dogruCevap: 'A', konu: 'Biyoloji', zorluk: 2 },
    { soruMetni: 'Hangisi bir asal sayı değildir?', secenekler: ['2', '3', '4', '5'], dogruCevap: 'C', konu: 'Matematik', zorluk: 1 },
    { soruMetni: 'Osmanlı İmparatorluğu kaç yılında kurulmuştur?', secenekler: ['1299', '1300', '1301', '1302'], dogruCevap: 'A', konu: 'Tarih', zorluk: 2 },
  ];

  for (let i = 0; i < 10; i++) {
    const tarih = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    tarih.setHours(0, 0, 0, 0);
    
    const existing = await prisma.gununSorusu.findUnique({ where: { tarih: tarih } });
    if (existing) continue;

    const soru = sorular[i % sorular.length];
    try {
      await prisma.gununSorusu.create({
        data: {
          tarih: tarih,
          soruMetni: soru.soruMetni,
          secenekler: JSON.stringify(soru.secenekler),
          dogruCevap: soru.dogruCevap,
          aciklama: 'Doğru cevap açıklaması',
          zorluk: soru.zorluk,
          xpOdulu: soru.zorluk * 10,
          konu: soru.konu,
        }
      });
      gununSorusuCount++;
    } catch (e) {
      // Duplicate hatası, atla
    }
  }
  console.log(`   ✅ ${gununSorusuCount} Günün sorusu oluşturuldu\n`);

  // ==================== 13. Günlük Görevler ====================
  console.log('✅ Günlük görev verileri oluşturuluyor...');
  
  let gorevCount = 0;

  const gorevTipleri = [
    { tip: GorevTipi.SORU_COZ, hedef: 10, xp: 20 },
    { tip: GorevTipi.ODEV_TESLIM, hedef: 1, xp: 30 },
    { tip: GorevTipi.GUN_SORUSU, hedef: 1, xp: 15 },
    { tip: GorevTipi.MATERYAL_INCELE, hedef: 2, xp: 10 },
  ];

  for (const ogrenci of ogrenciler.slice(0, 50)) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    for (const gorevSablon of gorevTipleri) {
      const existing = await prisma.gunlukGorev.findUnique({
        where: {
          userId_tarih_tip: {
            userId: ogrenci.id,
            tarih: bugun,
            tip: gorevSablon.tip
          }
        }
      });
      if (!existing) {
        const ilerleme = randomInt(0, gorevSablon.hedef);
        await prisma.gunlukGorev.create({
          data: {
            userId: ogrenci.id,
            tarih: bugun,
            tip: gorevSablon.tip,
            hedef: gorevSablon.hedef,
            ilerleme: ilerleme,
            tamamlandi: ilerleme >= gorevSablon.hedef,
            xpOdulu: gorevSablon.xp,
          }
        });
        gorevCount++;
      }
    }
  }
  console.log(`   ✅ ${gorevCount} Günlük görev oluşturuldu\n`);

  // ==================== 14. Rozetler ====================
  console.log('🏆 Rozet verileri oluşturuluyor...');
  
  let rozetCount = 0;

  const rozetTipleri = [RozetTipi.ILK_ODEV, RozetTipi.STREAK_7, RozetTipi.XP_1000, RozetTipi.ERKEN_KUS, RozetTipi.SOSYAL_KELEBEK];

  for (const ogrenci of ogrenciler.slice(0, 30)) {
    // Her öğrenciye 1-3 rozet
    const alinacakRozetSayisi = randomInt(1, 3);
    const secilenRozetler = rozetTipleri.slice(0, alinacakRozetSayisi);

    for (const rozetTipi of secilenRozetler) {
      const existing = await prisma.rozet.findUnique({
        where: { userId_tip: { userId: ogrenci.id, tip: rozetTipi } }
      });
      if (!existing) {
        await prisma.rozet.create({
          data: {
            userId: ogrenci.id,
            tip: rozetTipi,
            kazanilanTarih: randomDate(twoMonthsAgo, now),
          }
        });
        rozetCount++;
      }
    }

    // XP güncelle
    await prisma.user.update({
      where: { id: ogrenci.id },
      data: {
        xpPuani: randomInt(100, 5000),
        streak: randomInt(0, 30),
        sonAktiviteTarihi: randomDate(oneWeekAgo, now),
      }
    });
  }
  console.log(`   ✅ ${rozetCount} Rozet oluşturuldu\n`);

  // ==================== 15. Ödeme Planları ====================
  console.log('💰 Ödeme verileri oluşturuluyor...');
  
  let odemePlaniCount = 0;
  let odemeCount = 0;

  for (const ogrenci of ogrenciler.slice(0, 40)) {
    const mudur = mudurler.find(m => m.kursId === ogrenci.kursId);
    if (!mudur) continue;

    const existing = await prisma.odemePlani.findFirst({
      where: { ogrenciId: ogrenci.id, aktif: true }
    });
    if (existing) continue;

    const toplamTutar = randomElement([15000, 20000, 25000, 30000]);
    const taksitSayisi = randomElement([1, 4, 8, 12]);

    const plan = await prisma.odemePlani.create({
      data: {
        ogrenciId: ogrenci.id,
        donemAd: '2024-2025 Güz Dönemi',
        toplamTutar: toplamTutar,
        taksitSayisi: taksitSayisi,
        taksitTutari: toplamTutar / taksitSayisi,
        indirimOrani: randomElement([0, 5, 10]),
        olusturanId: mudur.id,
        aktif: true,
      }
    });
    odemePlaniCount++;

    // Ödemeler
    for (let i = 0; i < taksitSayisi; i++) {
      const vadeTarihi = new Date(2024, 8 + i, 1); // Eylül'den itibaren
      const odenmis = vadeTarihi < now;

      await prisma.odeme.create({
        data: {
          odemePlaniId: plan.id,
          ogrenciId: ogrenci.id,
          tip: 'TAKSIT',
          tutar: toplamTutar / taksitSayisi,
          durum: odenmis ? 'ODENDI' : 'BEKLEMEDE',
          taksitNo: i + 1,
          vadeTarihi: vadeTarihi,
          odemeYontemi: odenmis ? randomElement(['KREDI_KARTI', 'HAVALE', 'NAKIT']) : undefined,
          odemeTarihi: odenmis ? vadeTarihi : undefined,
        }
      });
      odemeCount++;
    }
  }
  console.log(`   ✅ ${odemePlaniCount} Ödeme planı, ${odemeCount} Ödeme oluşturuldu\n`);

  // ==================== 16. Destek Talepleri ====================
  console.log('🎫 Destek talebi verileri oluşturuluyor...');
  
  let destekCount = 0;

  const destekSablonlari = [
    { baslik: 'Şifre sıfırlama sorunu', aciklama: 'Şifre sıfırlama e-postası gelmiyor.', kategori: DestekTalebiKategori.HESAP },
    { baslik: 'Canlı ders bağlantı hatası', aciklama: 'Canlı derse bağlanamıyorum.', kategori: DestekTalebiKategori.TEKNIK },
    { baslik: 'Yeni özellik talebi', aciklama: 'Toplu mesaj gönderme özelliği eklenebilir mi?', kategori: DestekTalebiKategori.OZELLIK_TALEBI },
    { baslik: 'Fatura sorunu', aciklama: 'Faturamda hata var.', kategori: DestekTalebiKategori.FATURA },
    { baslik: 'Rapor indirilemiyor', aciklama: 'PDF rapor indirme çalışmıyor.', kategori: DestekTalebiKategori.TEKNIK },
  ];

  for (const mudur of mudurler.slice(0, 5)) {
    for (const sablon of destekSablonlari.slice(0, randomInt(1, 3))) {
      const existing = await prisma.destekTalebi.findFirst({
        where: { baslik: sablon.baslik, acanId: mudur.id }
      });
      if (existing) continue;

      const durum = randomElement([
        DestekTalebiDurum.ACIK, 
        DestekTalebiDurum.CEVAPLANDI, 
        DestekTalebiDurum.COZULDU
      ]);

      await prisma.destekTalebi.create({
        data: {
          baslik: sablon.baslik,
          aciklama: sablon.aciklama,
          kategori: sablon.kategori,
          oncelik: randomElement([DestekTalebiOncelik.DUSUK, DestekTalebiOncelik.NORMAL, DestekTalebiOncelik.YUKSEK]),
          durum: durum,
          acanId: mudur.id,
          kursId: mudur.kursId,
          cozumNotu: durum === DestekTalebiDurum.COZULDU ? 'Sorun giderildi.' : undefined,
        }
      });
      destekCount++;
    }
  }
  console.log(`   ✅ ${destekCount} Destek talebi oluşturuldu\n`);

  // ==================== 17. Deneme Sınavları ====================
  console.log('📊 Deneme sınavı verileri oluşturuluyor...');
  
  let denemeSinavCount = 0;
  let denemeSonucCount = 0;

  // LGS deneme sınavı
  for (const kurs of kurslar.slice(0, 2)) {
    const mudur = mudurler.find(m => m.kursId === kurs.id);
    if (!mudur) continue;

    const existing = await prisma.denemeSinavi.findFirst({
      where: { ad: `${kurs.ad} LGS Deneme 1` }
    });
    if (existing) continue;

    const sinav = await prisma.denemeSinavi.create({
      data: {
        ad: `${kurs.ad} LGS Deneme 1`,
        tur: DenemeTuru.LGS,
        kurum: 'Bilgi Sarmal',
        tarih: randomDate(oneMonthAgo, oneWeekAgo),
        branslarVeSoruSayilari: JSON.stringify({
          LGS_TURKCE: 20,
          LGS_MATEMATIK: 20,
          LGS_FEN: 20,
          LGS_INKILAP: 10,
          LGS_DIN: 10,
          LGS_INGILIZCE: 10
        }),
        olusturanId: mudur.id,
        kursId: kurs.id,
        aktif: true,
      }
    });
    denemeSinavCount++;

    // Sonuçlar
    const kursOgrencileri = ogrenciler.filter(o => o.kursId === kurs.id).slice(0, 15);
    for (const ogrenci of kursOgrencileri) {
      const turkce = { dogru: randomInt(10, 20), yanlis: randomInt(0, 5), bos: 0, net: 0, soruSayisi: 20 };
      turkce.bos = 20 - turkce.dogru - turkce.yanlis;
      turkce.net = turkce.dogru - turkce.yanlis * 0.25;

      const mat = { dogru: randomInt(8, 18), yanlis: randomInt(0, 6), bos: 0, net: 0, soruSayisi: 20 };
      mat.bos = 20 - mat.dogru - mat.yanlis;
      mat.net = mat.dogru - mat.yanlis * 0.25;

      const fen = { dogru: randomInt(10, 18), yanlis: randomInt(0, 5), bos: 0, net: 0, soruSayisi: 20 };
      fen.bos = 20 - fen.dogru - fen.yanlis;
      fen.net = fen.dogru - fen.yanlis * 0.25;

      const inkilap = { dogru: randomInt(5, 10), yanlis: randomInt(0, 3), bos: 0, net: 0, soruSayisi: 10 };
      inkilap.bos = 10 - inkilap.dogru - inkilap.yanlis;
      inkilap.net = inkilap.dogru - inkilap.yanlis * 0.25;

      const din = { dogru: randomInt(5, 10), yanlis: randomInt(0, 3), bos: 0, net: 0, soruSayisi: 10 };
      din.bos = 10 - din.dogru - din.yanlis;
      din.net = din.dogru - din.yanlis * 0.25;

      const ing = { dogru: randomInt(5, 10), yanlis: randomInt(0, 3), bos: 0, net: 0, soruSayisi: 10 };
      ing.bos = 10 - ing.dogru - ing.yanlis;
      ing.net = ing.dogru - ing.yanlis * 0.25;

      const toplamDogru = turkce.dogru + mat.dogru + fen.dogru + inkilap.dogru + din.dogru + ing.dogru;
      const toplamYanlis = turkce.yanlis + mat.yanlis + fen.yanlis + inkilap.yanlis + din.yanlis + ing.yanlis;
      const toplamBos = turkce.bos + mat.bos + fen.bos + inkilap.bos + din.bos + ing.bos;
      const toplamNet = turkce.net + mat.net + fen.net + inkilap.net + din.net + ing.net;

      await prisma.denemeSonucu.create({
        data: {
          sinavId: sinav.id,
          ogrenciId: ogrenci.id,
          branslarVeSonuclar: JSON.stringify({
            LGS_TURKCE: turkce,
            LGS_MATEMATIK: mat,
            LGS_FEN: fen,
            LGS_INKILAP: inkilap,
            LGS_DIN: din,
            LGS_INGILIZCE: ing
          }),
          toplamDogru: toplamDogru,
          toplamYanlis: toplamYanlis,
          toplamBos: toplamBos,
          toplamNet: toplamNet,
          genelPuan: 200 + (toplamNet * 3.5),
          girenId: mudur.id,
        }
      }).catch(() => {});
      denemeSonucCount++;
    }
  }
  console.log(`   ✅ ${denemeSinavCount} Deneme sınavı, ${denemeSonucCount} Sonuç oluşturuldu\n`);

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 MOCK DATA SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Son durum kontrolü
  const finalCounts = {
    faq: await prisma.fAQ.count(),
    changelog: await prisma.changelog.count(),
    adminDuyuru: await prisma.adminDuyuru.count(),
    duyuru: await prisma.duyuru.count(),
    yoklama: await prisma.yoklama.count(),
    devamsizlik: await prisma.devamsizlik.count(),
    exam: await prisma.exam.count(),
    examResult: await prisma.examResult.count(),
    odev: await prisma.odev.count(),
    odevTeslim: await prisma.odevTeslim.count(),
    notification: await prisma.notification.count(),
    canliDers: await prisma.canliDers.count(),
    birebirDers: await prisma.birebirDers.count(),
    birebirDersPaketi: await prisma.birebirDersPaketi.count(),
    materyal: await prisma.materyal.count(),
    gununSorusu: await prisma.gununSorusu.count(),
    gunlukGorev: await prisma.gunlukGorev.count(),
    rozet: await prisma.rozet.count(),
    odemePlani: await prisma.odemePlani.count(),
    odeme: await prisma.odeme.count(),
    destekTalebi: await prisma.destekTalebi.count(),
    denemeSinavi: await prisma.denemeSinavi.count(),
    denemeSonucu: await prisma.denemeSonucu.count(),
  };

  console.log('📊 TABLO DURUMLARI:');
  Object.entries(finalCounts).forEach(([tablo, sayi]) => {
    console.log(`   ${sayi > 0 ? '✅' : '❌'} ${tablo}: ${sayi}`);
  });
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

