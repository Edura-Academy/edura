import { Response } from 'express';
import prisma from '../lib/prisma';
import { OdevDurum, OdevTipi, Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { emailService } from '../services/email.service';
import { pushService } from '../services/push.service';
import { uploadToFirebase, deleteFromFirebase } from '../services/upload.service';

// ==================== BRANŞ KONTROLÜ ====================

// Öğretmen branşı ile ders adı eşleştirme
const bransEslestirme: Record<string, string[]> = {
  'turkce': ['türkçe', 'turkce'],
  'türkçe': ['türkçe', 'turkce'],
  'matematik': ['matematik', 'geometri'],
  'fizik': ['fizik', 'fen bilimleri', 'fen'],
  'kimya': ['kimya', 'fen bilimleri', 'fen'],
  'biyoloji': ['biyoloji', 'fen bilimleri', 'fen'],
  'fen bilimleri': ['fen bilimleri', 'fen', 'fizik', 'kimya', 'biyoloji'],
  'fen': ['fen bilimleri', 'fen', 'fizik', 'kimya', 'biyoloji'],
  'tarih': ['tarih', 'sosyal bilgiler', 'sosyal'],
  'cografya': ['coğrafya', 'cografya', 'sosyal bilgiler', 'sosyal'],
  'coğrafya': ['coğrafya', 'cografya', 'sosyal bilgiler', 'sosyal'],
  'sosyal bilgiler': ['sosyal bilgiler', 'sosyal', 'tarih', 'coğrafya', 'cografya'],
  'sosyal': ['sosyal bilgiler', 'sosyal', 'tarih', 'coğrafya', 'cografya'],
  'felsefe': ['felsefe'],
  'din kültürü': ['din kültürü', 'din', 'dkab'],
  'din': ['din kültürü', 'din', 'dkab'],
  'ingilizce': ['ingilizce', 'yabancı dil', 'foreign language'],
  'almanca': ['almanca'],
  'edebiyat': ['edebiyat', 'türk dili ve edebiyatı'],
  'türk dili ve edebiyatı': ['türk dili ve edebiyatı', 'edebiyat', 'türkçe'],
};

// Öğretmenin branşı ile ders adının uyumlu olup olmadığını kontrol et
const bransUyumluMu = (ogretmenBrans: string | null, dersAdi: string): boolean => {
  if (!ogretmenBrans) return false;
  
  const normalizedBrans = ogretmenBrans.toLowerCase().trim();
  const normalizedDersAdi = dersAdi.toLowerCase().trim();
  
  // Direkt eşleşme
  if (normalizedBrans === normalizedDersAdi) return true;
  
  // Eşleştirme tablosundan kontrol
  const uygunDersler = bransEslestirme[normalizedBrans];
  if (uygunDersler) {
    return uygunDersler.some(d => normalizedDersAdi.includes(d) || d.includes(normalizedDersAdi));
  }
  
  // Kısmi eşleşme
  return normalizedDersAdi.includes(normalizedBrans) || normalizedBrans.includes(normalizedDersAdi);
};

// ==================== ÖDEV YÖNETİMİ (Öğretmen) ====================

// Öğretmenin derslerini getir (ödev oluştururken seçmek için)
export const getTeacherCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Öğretmenin bilgilerini al (branş ve kurs)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kursId: true, brans: true }
    });

    // Müdür ise tüm kursu derslerini görebilir
    if (userRole === 'mudur') {
      const courses = await prisma.course.findMany({
        where: { 
          aktif: true,
          sinif: { kursId: user?.kursId || undefined }
        },
        include: {
          sinif: { select: { id: true, ad: true, seviye: true } },
          ogretmen: { select: { id: true, ad: true, soyad: true, brans: true } }
        },
        orderBy: { ad: 'asc' }
      });

      return res.json({ success: true, data: courses });
    }

    // Öğretmen ise branşına uygun dersleri görebilir
    const ogretmenBrans = user?.brans?.toLowerCase() || '';
    
    // Branş eşleştirme haritası (ders adı -> branşlar)
    const bransEslestirme: Record<string, string[]> = {
      'matematik': ['matematik', 'mat'],
      'türkçe': ['türkçe', 'turkce', 'edebiyat'],
      'fizik': ['fizik', 'fiz'],
      'kimya': ['kimya', 'kim'],
      'biyoloji': ['biyoloji', 'biyo'],
      'tarih': ['tarih', 'sosyal'],
      'coğrafya': ['coğrafya', 'cografya', 'sosyal'],
      'ingilizce': ['ingilizce', 'yabancı dil', 'yabanci dil', 'ing'],
      'almanca': ['almanca', 'yabancı dil'],
      'fen': ['fen', 'fen bilimleri', 'fizik', 'kimya', 'biyoloji'],
      'sosyal': ['sosyal', 'sosyal bilgiler', 'tarih', 'coğrafya'],
    };

    // Öğretmenin branşına uygun anahtar kelimeleri bul
    let uygunAnahtarlar: string[] = [];
    for (const [anahtar, branslar] of Object.entries(bransEslestirme)) {
      if (branslar.some(b => ogretmenBrans.includes(b))) {
        uygunAnahtarlar.push(anahtar);
        uygunAnahtarlar.push(...branslar);
      }
    }
    // Direkt branş adını da ekle
    if (ogretmenBrans) {
      uygunAnahtarlar.push(ogretmenBrans);
    }
    uygunAnahtarlar = [...new Set(uygunAnahtarlar)]; // Tekrarları kaldır

    // Kursa ait tüm dersleri al
    const tumDersler = await prisma.course.findMany({
      where: { 
        aktif: true,
        sinif: { kursId: user?.kursId || undefined }
      },
      include: {
        sinif: { select: { id: true, ad: true, seviye: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true, brans: true } }
      },
      orderBy: [{ sinif: { seviye: 'asc' } }, { ad: 'asc' }]
    });

    // Branşa uygun dersleri filtrele
    const courses = tumDersler.filter(ders => {
      const dersAdi = ders.ad.toLowerCase();
      
      // 1. Kendi atanmış dersleri her zaman göster
      if (ders.ogretmenId === userId) {
        return true;
      }
      
      // 2. Branşa uygun dersleri göster
      if (uygunAnahtarlar.length > 0) {
        return uygunAnahtarlar.some(anahtar => dersAdi.includes(anahtar));
      }
      
      // 3. Branş belirtilmemişse sadece kendi derslerini göster
      return false;
    });

    console.log(`📚 Öğretmen branşı: ${ogretmenBrans}, Bulunan ders sayısı: ${courses.length}`);

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Dersler alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Öğretmenin sınıflarını getir (hedef sınıf seçimi için)
export const getTeacherClasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kursId: true, brans: true }
    });

    // Öğretmenin derslerinin bulunduğu sınıfları getir
    let siniflar;
    
    if (userRole === 'mudur') {
      // Müdür tüm sınıfları görebilir
      siniflar = await prisma.sinif.findMany({
        where: { 
          kursId: user?.kursId || undefined,
          aktif: true 
        },
        select: { id: true, ad: true, seviye: true },
        orderBy: { seviye: 'asc' }
      });
    } else {
      // Öğretmen sadece ders verdiği sınıfları görebilir
      const courses = await prisma.course.findMany({
        where: { ogretmenId: userId, aktif: true },
        select: { sinifId: true }
      });
      
      const sinifIds = [...new Set(courses.map(c => c.sinifId))];
      
      siniflar = await prisma.sinif.findMany({
        where: { 
          id: { in: sinifIds },
          aktif: true 
        },
        select: { id: true, ad: true, seviye: true },
        orderBy: { seviye: 'asc' }
      });
    }

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Sınıflar alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Öğretmenin tüm ödevlerini getir
export const getTeacherHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const odevler = await prisma.odev.findMany({
      where: { ogretmenId: userId },
      include: {
        course: {
          include: {
            sinif: { select: { id: true, ad: true } }
          }
        },
        sorular: {
          orderBy: { siraNo: 'asc' }
        },
        teslimler: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // İstatistikleri hesapla
    const odevlerWithStats = odevler.map(odev => {
      // Resimler ve dosyalar JSON parse
      let resimler: string[] = [];
      let dosyalar: any[] = [];
      try {
        if (odev.resimler) resimler = JSON.parse(odev.resimler);
        if (odev.dosyalar) dosyalar = JSON.parse(odev.dosyalar);
      } catch (e) {}

      return {
        ...odev,
        resimler,
        dosyalar,
        stats: {
          toplamOgrenci: odev.teslimler.length,
          teslimEdilen: odev.teslimler.filter(t => t.durum !== OdevDurum.BEKLEMEDE).length,
          degerlendirilen: odev.teslimler.filter(t => t.durum === OdevDurum.DEGERLENDIRILDI).length,
          bekleyen: odev.teslimler.filter(t => t.durum === OdevDurum.TESLIM_EDILDI).length
        }
      };
    });

    res.json({ success: true, data: odevlerWithStats });
  } catch (error) {
    console.error('Ödevler alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Yeni ödev oluştur
export const createHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { 
      baslik, 
      aciklama, 
      courseId, 
      hedefSiniflar,
      baslangicTarihi,
      sonTeslimTarihi, 
      maxPuan = 100,
      odevTipi = 'KARISIK',
      konuBasligi,
      icerik,
      resimler,
      dosyalar,
      sorular
    } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!baslik || !sonTeslimTarihi) {
      return res.status(400).json({ success: false, error: 'Başlık ve son teslim tarihi gerekli' });
    }

    // En az bir hedef seçilmeli (course veya hedefSiniflar)
    if (!courseId && (!hedefSiniflar || hedefSiniflar.length === 0)) {
      return res.status(400).json({ success: false, error: 'En az bir ders veya sınıf seçmelisiniz' });
    }

    // Öğretmenin bilgilerini al
    const ogretmen = await prisma.user.findUnique({
      where: { id: userId },
      select: { ad: true, soyad: true, brans: true, kursId: true }
    });

    // Branş kontrolü (sadece öğretmenler için)
    if (userRole === 'ogretmen' && courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId },
        select: { ad: true, ogretmenId: true }
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Ders bulunamadı' });
      }

      // Öğretmenin bu derse erişimi var mı?
      if (course.ogretmenId !== userId) {
        return res.status(403).json({ success: false, error: 'Bu derse ödev ekleme yetkiniz yok' });
      }

      // Branş kontrolü
      if (ogretmen?.brans && !bransUyumluMu(ogretmen.brans, course.ad)) {
        return res.status(403).json({ 
          success: false, 
          error: `Branşınız (${ogretmen.brans}) ile seçilen ders (${course.ad}) uyumlu değil. Sadece kendi branşınızda ödev oluşturabilirsiniz.` 
        });
      }
    }

    // Hedef sınıflar kontrolü
    if (hedefSiniflar && hedefSiniflar.length > 0) {
      // Öğretmenin bu sınıflara erişimi var mı kontrol et
      if (userRole === 'ogretmen') {
        const courses = await prisma.course.findMany({
          where: { ogretmenId: userId, aktif: true },
          select: { sinifId: true }
        });
        
        const erisilebilenSiniflar = courses.map(c => c.sinifId);
        const yetkisizSiniflar = hedefSiniflar.filter((s: string) => !erisilebilenSiniflar.includes(s));
        
        if (yetkisizSiniflar.length > 0) {
          return res.status(403).json({ 
            success: false, 
            error: 'Seçilen bazı sınıflara ders vermediğiniz için ödev oluşturamazsınız' 
          });
        }
      }
    }

    // Ödevi oluştur
    const odev = await prisma.odev.create({
      data: {
        baslik,
        aciklama,
        courseId: courseId || null,
        ogretmenId: userId,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null,
        sonTeslimTarihi: new Date(sonTeslimTarihi),
        maxPuan,
        odevTipi: odevTipi as OdevTipi,
        konuBasligi,
        icerik,
        resimler: resimler ? JSON.stringify(resimler) : null,
        dosyalar: dosyalar ? JSON.stringify(dosyalar) : null,
        hedefSiniflar: hedefSiniflar ? JSON.stringify(hedefSiniflar) : null
      },
      include: {
        course: { include: { sinif: true } }
      }
    });

    // Soruları ekle (varsa)
    if (sorular && sorular.length > 0) {
      const soruData = sorular.map((soru: any, index: number) => ({
        odevId: odev.id,
        soruMetni: soru.soruMetni,
        resimUrl: soru.resimUrl || null,
        puan: soru.puan || 10,
        siraNo: index + 1
      }));

      await prisma.odevSoru.createMany({ data: soruData });
    }

    // Hedef öğrencileri bul ve bildirim gönder
    let ogrenciler: { id: string; ad: string; soyad: string; email: string }[] = [];

    if (courseId) {
      // Course'a kayıtlı öğrenciler
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sinif: {
            include: {
              ogrenciler: { 
                where: { role: 'ogrenci', aktif: true },
                select: { id: true, ad: true, soyad: true, email: true } 
              }
            }
          }
        }
      });
      ogrenciler = course?.sinif?.ogrenciler || [];
    } else if (hedefSiniflar && hedefSiniflar.length > 0) {
      // Hedef sınıflardaki öğrenciler
      const siniflar = await prisma.sinif.findMany({
        where: { id: { in: hedefSiniflar } },
        include: {
          ogrenciler: { 
            where: { role: 'ogrenci', aktif: true },
            select: { id: true, ad: true, soyad: true, email: true } 
          }
        }
      });
      ogrenciler = siniflar.flatMap(s => s.ogrenciler);
    }

    // Öğrencilere bildirim gönder
    if (ogrenciler.length > 0) {
      // Uygulama içi bildirim
      await prisma.notification.createMany({
        data: ogrenciler.map(ogrenci => ({
          userId: ogrenci.id,
          tip: 'BILDIRIM',
          baslik: '📝 Yeni Ödev',
          mesaj: `${odev.baslik} ödevi oluşturuldu. Son teslim: ${new Date(sonTeslimTarihi).toLocaleDateString('tr-TR')}`
        }))
      });

      // E-posta bildirimi (arka planda)
      const ogretmenAd = `${ogretmen?.ad} ${ogretmen?.soyad}`;
      const sonTeslimFormatli = new Date(sonTeslimTarihi).toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      Promise.all(
        ogrenciler.map(ogrenci =>
          emailService.sendNewHomeworkNotification(ogrenci.email, {
            ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`,
            dersAd: odev.course?.ad || 'Genel',
            odevBaslik: baslik,
            sonTeslimTarihi: sonTeslimFormatli,
            ogretmenAd
          })
        )
      ).catch(err => console.error('E-posta gönderme hatası:', err));

      // Push notification
      pushService.notifyNewHomework(
        ogrenciler.map(o => o.id),
        {
          dersAd: odev.course?.ad || 'Genel',
          odevBaslik: baslik,
          sonTeslimTarihi: sonTeslimFormatli
        }
      ).catch(err => console.error('Push notification hatası:', err));
    }

    // Sonucu döndür
    const createdOdev = await prisma.odev.findUnique({
      where: { id: odev.id },
      include: {
        course: { include: { sinif: true } },
        sorular: { orderBy: { siraNo: 'asc' } }
      }
    });

    res.status(201).json({ success: true, data: createdOdev });
  } catch (error) {
    console.error('Ödev oluşturulurken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Tek bir ödevi getir
export const getHomeworkById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const odev = await prisma.odev.findUnique({
      where: { id: odevId },
      include: {
        course: {
          include: {
            sinif: { select: { id: true, ad: true } }
          }
        },
        ogretmen: { select: { id: true, ad: true, soyad: true } },
        sorular: { orderBy: { siraNo: 'asc' } },
        teslimler: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } },
            soruCevaplari: true
          },
          orderBy: { teslimTarihi: 'desc' }
        }
      }
    });

    if (!odev) {
      return res.status(404).json({ success: false, error: 'Ödev bulunamadı' });
    }

    // JSON alanları parse et
    let resimler: string[] = [];
    let dosyalar: any[] = [];
    let hedefSiniflar: string[] = [];
    try {
      if (odev.resimler) resimler = JSON.parse(odev.resimler);
      if (odev.dosyalar) dosyalar = JSON.parse(odev.dosyalar);
      if (odev.hedefSiniflar) hedefSiniflar = JSON.parse(odev.hedefSiniflar);
    } catch (e) {}

    // Teslimler için de JSON parse
    const teslimlerParsed = odev.teslimler.map(t => {
      let teslimResimler: string[] = [];
      let teslimDosyalar: any[] = [];
      try {
        if (t.resimler) teslimResimler = JSON.parse(t.resimler);
        if (t.dosyalar) teslimDosyalar = JSON.parse(t.dosyalar);
      } catch (e) {}
      return { ...t, resimler: teslimResimler, dosyalar: teslimDosyalar };
    });

    // İstatistikleri hesapla
    const stats = {
      toplamOgrenci: odev.teslimler.length,
      teslimEdilen: odev.teslimler.filter(t => t.durum !== OdevDurum.BEKLEMEDE).length,
      degerlendirilen: odev.teslimler.filter(t => t.durum === OdevDurum.DEGERLENDIRILDI).length,
      bekleyen: odev.teslimler.filter(t => t.durum === OdevDurum.TESLIM_EDILDI).length
    };

    res.json({ 
      success: true, 
      data: { 
        ...odev, 
        resimler, 
        dosyalar, 
        hedefSiniflar,
        teslimler: teslimlerParsed,
        stats 
      } 
    });
  } catch (error) {
    console.error('Ödev alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Ödevi güncelle
export const updateHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const { 
      baslik, 
      aciklama, 
      baslangicTarihi,
      sonTeslimTarihi, 
      maxPuan, 
      aktif,
      odevTipi,
      konuBasligi,
      icerik,
      resimler,
      dosyalar,
      hedefSiniflar
    } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Ödevin öğretmene ait olduğunu kontrol et
    const existingOdev = await prisma.odev.findFirst({
      where: { id: odevId, ogretmenId: userId }
    });

    if (!existingOdev) {
      return res.status(403).json({ success: false, error: 'Bu ödevi düzenleme yetkiniz yok' });
    }

    const updatedOdev = await prisma.odev.update({
      where: { id: odevId },
      data: {
        ...(baslik && { baslik }),
        ...(aciklama !== undefined && { aciklama }),
        ...(baslangicTarihi !== undefined && { baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null }),
        ...(sonTeslimTarihi && { sonTeslimTarihi: new Date(sonTeslimTarihi) }),
        ...(maxPuan && { maxPuan }),
        ...(aktif !== undefined && { aktif }),
        ...(odevTipi && { odevTipi: odevTipi as OdevTipi }),
        ...(konuBasligi !== undefined && { konuBasligi }),
        ...(icerik !== undefined && { icerik }),
        ...(resimler !== undefined && { resimler: resimler ? JSON.stringify(resimler) : null }),
        ...(dosyalar !== undefined && { dosyalar: dosyalar ? JSON.stringify(dosyalar) : null }),
        ...(hedefSiniflar !== undefined && { hedefSiniflar: hedefSiniflar ? JSON.stringify(hedefSiniflar) : null })
      },
      include: {
        course: { include: { sinif: true } },
        sorular: { orderBy: { siraNo: 'asc' } }
      }
    });

    res.json({ success: true, data: updatedOdev });
  } catch (error) {
    console.error('Ödev güncellenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Ödevi sil
export const deleteHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Ödevin öğretmene ait olduğunu kontrol et
    const existingOdev = await prisma.odev.findFirst({
      where: { id: odevId, ogretmenId: userId }
    });

    if (!existingOdev) {
      return res.status(403).json({ success: false, error: 'Bu ödevi silme yetkiniz yok' });
    }

    // Cascade delete - sorular ve teslimler otomatik silinecek
    await prisma.odev.delete({
      where: { id: odevId }
    });

    res.json({ success: true, message: 'Ödev başarıyla silindi' });
  } catch (error) {
    console.error('Ödev silinirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== ÖDEV SORULARI ====================

// Ödevde soru ekle
export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const { soruMetni, resimUrl, puan = 10 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Ödevin öğretmene ait olduğunu kontrol et
    const odev = await prisma.odev.findFirst({
      where: { id: odevId, ogretmenId: userId }
    });

    if (!odev) {
      return res.status(404).json({ success: false, error: 'Ödev bulunamadı veya yetkiniz yok' });
    }

    // Son sıra numarasını bul
    const sonSoru = await prisma.odevSoru.findFirst({
      where: { odevId },
      orderBy: { siraNo: 'desc' }
    });

    const soru = await prisma.odevSoru.create({
      data: {
        odevId,
        soruMetni,
        resimUrl,
        puan,
        siraNo: (sonSoru?.siraNo || 0) + 1
      }
    });

    res.json({ success: true, data: soru });
  } catch (error) {
    console.error('Soru eklenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Soruyu güncelle
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { soruId } = req.params;
    const { soruMetni, resimUrl, puan } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Sorunun ödevinin öğretmene ait olduğunu kontrol et
    const soru = await prisma.odevSoru.findFirst({
      where: { id: soruId },
      include: { odev: { select: { ogretmenId: true } } }
    });

    if (!soru || soru.odev.ogretmenId !== userId) {
      return res.status(404).json({ success: false, error: 'Soru bulunamadı veya yetkiniz yok' });
    }

    const updatedSoru = await prisma.odevSoru.update({
      where: { id: soruId },
      data: {
        ...(soruMetni && { soruMetni }),
        ...(resimUrl !== undefined && { resimUrl }),
        ...(puan && { puan })
      }
    });

    res.json({ success: true, data: updatedSoru });
  } catch (error) {
    console.error('Soru güncellenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Soruyu sil
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { soruId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const soru = await prisma.odevSoru.findFirst({
      where: { id: soruId },
      include: { odev: { select: { ogretmenId: true } } }
    });

    if (!soru || soru.odev.ogretmenId !== userId) {
      return res.status(404).json({ success: false, error: 'Soru bulunamadı veya yetkiniz yok' });
    }

    await prisma.odevSoru.delete({ where: { id: soruId } });

    res.json({ success: true, message: 'Soru silindi' });
  } catch (error) {
    console.error('Soru silinirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== RESİM YÜKLEME ====================

// Ödev için resim yükle (max 8MB)
export const uploadOdevImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'Dosya gerekli' });
    }

    // Dosya boyutu kontrolü (8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, error: 'Dosya boyutu 8MB\'dan büyük olamaz' });
    }

    // Sadece resim dosyaları
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)' });
    }

    // Ödevin kontrolü (varsa)
    if (odevId && odevId !== 'new') {
      const odev = await prisma.odev.findFirst({
        where: { id: odevId, ogretmenId: userId }
      });

      if (!odev) {
        return res.status(404).json({ success: false, error: 'Ödev bulunamadı veya yetkiniz yok' });
      }
    }

    // Firebase'e yükle
    const folder = `odevler/${odevId || 'temp'}`;
    const result = await uploadToFirebase(file, folder);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'Yükleme başarısız' });
    }

    res.json({ 
      success: true, 
      data: { url: result.url }
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Soru için resim yükle (max 8MB)
export const uploadSoruImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId, soruId } = req.params;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'Dosya gerekli' });
    }

    // Dosya boyutu kontrolü (8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, error: 'Dosya boyutu 8MB\'dan büyük olamaz' });
    }

    // Sadece resim dosyaları
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Sadece resim dosyaları yüklenebilir' });
    }

    // Firebase'e yükle
    const folder = `odevler/${odevId}/sorular/${soruId || 'new'}`;
    const result = await uploadToFirebase(file, folder);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'Yükleme başarısız' });
    }

    res.json({ 
      success: true, 
      data: { url: result.url }
    });
  } catch (error) {
    console.error('Soru resmi yükleme hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== ÖDEV DEĞERLENDİRME ====================

// Ödev değerlendir (puan ver)
export const gradeHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teslimId } = req.params;
    const { puan, ogretmenYorumu, soruPuanlari } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (puan === undefined || puan === null) {
      return res.status(400).json({ success: false, error: 'Puan gerekli' });
    }

    // Teslimi bul ve öğretmenin yetkisini kontrol et
    const teslim = await prisma.odevTeslim.findFirst({
      where: { id: teslimId },
      include: {
        odev: { include: { course: true, sorular: true } },
        ogrenci: { select: { id: true, ad: true, soyad: true, email: true } },
        soruCevaplari: true
      }
    });

    if (!teslim) {
      return res.status(404).json({ success: false, error: 'Teslim bulunamadı' });
    }

    if (teslim.odev.ogretmenId !== userId) {
      return res.status(403).json({ success: false, error: 'Bu ödevi değerlendirme yetkiniz yok' });
    }

    // Puanı kontrol et
    if (puan < 0 || puan > teslim.odev.maxPuan) {
      return res.status(400).json({ success: false, error: `Puan 0 ile ${teslim.odev.maxPuan} arasında olmalı` });
    }

    // Soru puanlarını güncelle (varsa)
    if (soruPuanlari && Array.isArray(soruPuanlari)) {
      for (const sp of soruPuanlari) {
        await prisma.odevSoruCevap.updateMany({
          where: { 
            teslimId,
            soruId: sp.soruId 
          },
          data: {
            puan: sp.puan,
            yorum: sp.yorum
          }
        });
      }
    }

    // Teslimi güncelle
    const updatedTeslim = await prisma.odevTeslim.update({
      where: { id: teslimId },
      data: {
        puan,
        ogretmenYorumu,
        durum: OdevDurum.DEGERLENDIRILDI
      },
      include: {
        odev: true,
        ogrenci: { select: { id: true, ad: true, soyad: true, email: true } }
      }
    });

    // Öğrenciye bildirim gönder
    await prisma.notification.create({
      data: {
        userId: teslim.ogrenciId,
        tip: 'BILDIRIM',
        baslik: '📊 Ödev Değerlendirildi',
        mesaj: `"${teslim.odev.baslik}" ödeviniz değerlendirildi. Puanınız: ${puan}/${teslim.odev.maxPuan}`
      }
    });

    // E-posta bildirimi
    emailService.sendHomeworkGradedNotification(updatedTeslim.ogrenci.email, {
      ogrenciAd: `${updatedTeslim.ogrenci.ad} ${updatedTeslim.ogrenci.soyad}`,
      odevBaslik: teslim.odev.baslik,
      puan,
      maxPuan: teslim.odev.maxPuan,
      ogretmenYorumu
    }).catch(err => console.error('E-posta gönderme hatası:', err));

    // Push notification
    pushService.notifyHomeworkGraded(teslim.ogrenciId, {
      odevBaslik: teslim.odev.baslik,
      puan,
      maxPuan: teslim.odev.maxPuan
    }).catch(err => console.error('Push notification hatası:', err));

    res.json({ success: true, data: updatedTeslim });
  } catch (error) {
    console.error('Ödev değerlendirilirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ ÖDEVLERİ ====================

// Öğrencinin ödevlerini getir
export const getStudentHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Öğrencinin sınıfını bul
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { sinifId: true }
    });

    if (!student?.sinifId) {
      return res.status(400).json({ success: false, error: 'Öğrenci sınıfı bulunamadı' });
    }

    const now = new Date();

    // Sınıfın derslerine ait ödevleri getir
    const odevler = await prisma.odev.findMany({
      where: {
        aktif: true,
        AND: [
          // Sınıf veya hedef sınıf kontrolü
          {
            OR: [
              { course: { sinifId: student.sinifId } },
              { hedefSiniflar: { contains: student.sinifId } }
            ]
          },
          // Başlangıç tarihi kontrolü
          {
            OR: [
              { baslangicTarihi: null },
              { baslangicTarihi: { lte: now } }
            ]
          }
        ]
      },
      include: {
        course: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } },
        sorular: { orderBy: { siraNo: 'asc' } },
        teslimler: {
          where: { ogrenciId: userId },
          include: { soruCevaplari: true }
        }
      },
      orderBy: { sonTeslimTarihi: 'asc' }
    });

    // Ödevleri durumlarıyla birlikte döndür
    const odevlerWithStatus = odevler.map(odev => {
      let resimler: string[] = [];
      let dosyalar: any[] = [];
      try {
        if (odev.resimler) resimler = JSON.parse(odev.resimler);
        if (odev.dosyalar) dosyalar = JSON.parse(odev.dosyalar);
      } catch (e) {}

      return {
        ...odev,
        resimler,
        dosyalar,
        teslim: odev.teslimler[0] || null,
        gecikmisMi: now > odev.sonTeslimTarihi && !odev.teslimler[0]
      };
    });

    res.json({ success: true, data: odevlerWithStatus });
  } catch (error) {
    console.error('Öğrenci ödevleri alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Ödev teslim et
export const submitHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const { aciklama, dosyaUrl, dosyalar, resimler, soruCevaplari } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Ödevi kontrol et
    const odev = await prisma.odev.findUnique({
      where: { id: odevId },
      include: { 
        course: { include: { sinif: true } },
        sorular: true
      }
    });

    if (!odev) {
      return res.status(404).json({ success: false, error: 'Ödev bulunamadı' });
    }

    // Öğrencinin bu sınıfta olup olmadığını kontrol et
    const student = await prisma.user.findFirst({
      where: { id: userId, role: 'ogrenci' },
      select: { sinifId: true, ad: true, soyad: true }
    });

    if (!student) {
      return res.status(403).json({ success: false, error: 'Öğrenci bulunamadı' });
    }

    // Hedef sınıf kontrolü
    let hedefSiniflar: string[] = [];
    try {
      if (odev.hedefSiniflar) hedefSiniflar = JSON.parse(odev.hedefSiniflar);
    } catch (e) {}

    const sinifErisimi = (odev.course?.sinifId === student.sinifId) || 
                         hedefSiniflar.includes(student.sinifId || '');

    if (!sinifErisimi) {
      return res.status(403).json({ success: false, error: 'Bu ödevi teslim etme yetkiniz yok' });
    }

    // Son teslim tarihi kontrolü
    const now = new Date();
    if (now > odev.sonTeslimTarihi) {
      return res.status(400).json({ success: false, error: 'Son teslim tarihi geçmiş' });
    }

    // Mevcut teslimi kontrol et
    const existingTeslim = await prisma.odevTeslim.findUnique({
      where: { odevId_ogrenciId: { odevId, ogrenciId: userId } }
    });

    if (existingTeslim && existingTeslim.durum === OdevDurum.DEGERLENDIRILDI) {
      return res.status(400).json({ success: false, error: 'Bu ödev zaten değerlendirilmiş' });
    }

    // Teslimi oluştur veya güncelle
    const teslim = await prisma.odevTeslim.upsert({
      where: { odevId_ogrenciId: { odevId, ogrenciId: userId } },
      update: {
        aciklama,
        dosyaUrl,
        dosyalar: dosyalar ? JSON.stringify(dosyalar) : null,
        resimler: resimler ? JSON.stringify(resimler) : null,
        teslimTarihi: new Date(),
        durum: OdevDurum.TESLIM_EDILDI
      },
      create: {
        odevId,
        ogrenciId: userId,
        aciklama,
        dosyaUrl,
        dosyalar: dosyalar ? JSON.stringify(dosyalar) : null,
        resimler: resimler ? JSON.stringify(resimler) : null,
        durum: OdevDurum.TESLIM_EDILDI
      }
    });

    // Soru cevaplarını kaydet (varsa)
    if (soruCevaplari && Array.isArray(soruCevaplari) && soruCevaplari.length > 0) {
      for (const cevap of soruCevaplari) {
        await prisma.odevSoruCevap.upsert({
          where: { soruId_teslimId: { soruId: cevap.soruId, teslimId: teslim.id } },
          update: {
            cevapMetni: cevap.cevapMetni,
            resimUrl: cevap.resimUrl
          },
          create: {
            soruId: cevap.soruId,
            teslimId: teslim.id,
            cevapMetni: cevap.cevapMetni,
            resimUrl: cevap.resimUrl
          }
        });
      }
    }

    // Öğretmene bildirim gönder
    await prisma.notification.create({
      data: {
        userId: odev.ogretmenId,
        tip: 'BILDIRIM',
        baslik: '📥 Yeni Ödev Teslimi',
        mesaj: `${student.ad} ${student.soyad} "${odev.baslik}" ödevini teslim etti.`
      }
    });

    // Push notification
    pushService.notifyHomeworkSubmitted(odev.ogretmenId, {
      ogrenciAd: `${student.ad} ${student.soyad}`,
      odevBaslik: odev.baslik
    }).catch(err => console.error('Push notification hatası:', err));

    res.status(201).json({ success: true, data: teslim });
  } catch (error) {
    console.error('Ödev teslim edilirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Öğrenci teslim resmi yükle (max 8MB)
export const uploadTeslimImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'Dosya gerekli' });
    }

    // Dosya boyutu kontrolü (8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, error: 'Dosya boyutu 8MB\'dan büyük olamaz' });
    }

    // Sadece resim dosyaları
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Sadece resim dosyaları yüklenebilir' });
    }

    // Firebase'e yükle
    const folder = `odevler/${odevId}/teslimler/${userId}`;
    const result = await uploadToFirebase(file, folder);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'Yükleme başarısız' });
    }

    res.json({ 
      success: true, 
      data: { url: result.url }
    });
  } catch (error) {
    console.error('Teslim resmi yükleme hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};
