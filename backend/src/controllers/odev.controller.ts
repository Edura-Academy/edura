import { Response } from 'express';
import prisma from '../lib/prisma';
import { OdevDurum, Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { emailService } from '../services/email.service';
import { pushService } from '../services/push.service';

// ==================== ÖDEV YÖNETİMİ (Öğretmen) ====================

// Öğretmenin derslerini getir (ödev oluştururken seçmek için)
export const getTeacherCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const courses = await prisma.course.findMany({
      where: { ogretmenId: userId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true, seviye: true } }
      },
      orderBy: { ad: 'asc' }
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Dersler alınırken hata:', error);
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
        teslimler: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // İstatistikleri hesapla
    const odevlerWithStats = odevler.map(odev => ({
      ...odev,
      stats: {
        toplamOgrenci: odev.teslimler.length,
        teslimEdilen: odev.teslimler.filter(t => t.durum !== OdevDurum.BEKLEMEDE).length,
        degerlendirilen: odev.teslimler.filter(t => t.durum === OdevDurum.DEGERLENDIRILDI).length,
        bekleyen: odev.teslimler.filter(t => t.durum === OdevDurum.TESLIM_EDILDI).length
      }
    }));

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
    const { baslik, aciklama, courseId, sonTeslimTarihi, maxPuan = 100 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!baslik || !courseId || !sonTeslimTarihi) {
      return res.status(400).json({ success: false, error: 'Başlık, ders ve son teslim tarihi gerekli' });
    }

    // Dersi kontrol et ve öğretmenin bu derse erişimi var mı
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId },
      include: {
        sinif: {
          include: {
            ogrenciler: { select: { id: true, ad: true, soyad: true, email: true } }
          }
        },
        ogretmen: { select: { ad: true, soyad: true } }
      }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse ödev ekleme yetkiniz yok' });
    }

    // Ödevi oluştur
    const odev = await prisma.odev.create({
      data: {
        baslik,
        aciklama,
        courseId,
        ogretmenId: userId,
        sonTeslimTarihi: new Date(sonTeslimTarihi),
        maxPuan
      },
      include: {
        course: { include: { sinif: true } }
      }
    });

    // Sınıftaki tüm öğrencilere bildirim gönder
    const ogrenciler = course.sinif.ogrenciler;
    if (ogrenciler.length > 0) {
      // Uygulama içi bildirim
      await prisma.notification.createMany({
        data: ogrenciler.map(ogrenci => ({
          userId: ogrenci.id,
          tip: 'BILDIRIM',
          baslik: '📝 Yeni Ödev',
          mesaj: `${course.ad} dersi için yeni ödev: "${baslik}". Son teslim: ${new Date(sonTeslimTarihi).toLocaleDateString('tr-TR')}`
        }))
      });

      // E-posta bildirimi (async - response'u bekletmez)
      const ogretmenAd = `${course.ogretmen.ad} ${course.ogretmen.soyad}`;
      const sonTeslimFormatli = new Date(sonTeslimTarihi).toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Her öğrenciye e-posta gönder (arka planda)
      Promise.all(
        ogrenciler.map(ogrenci =>
          emailService.sendNewHomeworkNotification(ogrenci.email, {
            ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`,
            dersAd: course.ad,
            odevBaslik: baslik,
            sonTeslimTarihi: sonTeslimFormatli,
            ogretmenAd
          })
        )
      ).catch(err => console.error('E-posta gönderme hatası:', err));

      // Push notification gönder (arka planda)
      pushService.notifyNewHomework(
        ogrenciler.map(o => o.id),
        {
          dersAd: course.ad,
          odevBaslik: baslik,
          sonTeslimTarihi: sonTeslimFormatli
        }
      ).catch(err => console.error('Push notification hatası:', err));
    }

    res.status(201).json({ success: true, data: odev });
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
        teslimler: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
          },
          orderBy: { teslimTarihi: 'desc' }
        }
      }
    });

    if (!odev) {
      return res.status(404).json({ success: false, error: 'Ödev bulunamadı' });
    }

    // İstatistikleri hesapla
    const stats = {
      toplamOgrenci: odev.teslimler.length,
      teslimEdilen: odev.teslimler.filter(t => t.durum !== OdevDurum.BEKLEMEDE).length,
      degerlendirilen: odev.teslimler.filter(t => t.durum === OdevDurum.DEGERLENDIRILDI).length,
      bekleyen: odev.teslimler.filter(t => t.durum === OdevDurum.TESLIM_EDILDI).length
    };

    res.json({ success: true, data: { ...odev, stats } });
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
    const { baslik, aciklama, sonTeslimTarihi, maxPuan, aktif } = req.body;

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
        ...(sonTeslimTarihi && { sonTeslimTarihi: new Date(sonTeslimTarihi) }),
        ...(maxPuan && { maxPuan }),
        ...(aktif !== undefined && { aktif })
      },
      include: {
        course: { include: { sinif: true } }
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

    // Önce teslimleri sil, sonra ödevi
    await prisma.odevTeslim.deleteMany({
      where: { odevId }
    });

    await prisma.odev.delete({
      where: { id: odevId }
    });

    res.json({ success: true, message: 'Ödev başarıyla silindi' });
  } catch (error) {
    console.error('Ödev silinirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Ödev değerlendir (puan ver)
export const gradeHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teslimId } = req.params;
    const { puan, ogretmenYorumu } = req.body;

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
        odev: { include: { course: true } },
        ogrenci: { select: { id: true, ad: true, soyad: true, email: true } }
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

    // Öğrenciye uygulama içi bildirim gönder
    await prisma.notification.create({
      data: {
        userId: teslim.ogrenciId,
        tip: 'BILDIRIM',
        baslik: '📊 Ödev Değerlendirildi',
        mesaj: `"${teslim.odev.baslik}" ödeviniz değerlendirildi. Puanınız: ${puan}/${teslim.odev.maxPuan}`
      }
    });

    // E-posta bildirimi gönder (arka planda)
    emailService.sendHomeworkGradedNotification(updatedTeslim.ogrenci.email, {
      ogrenciAd: `${updatedTeslim.ogrenci.ad} ${updatedTeslim.ogrenci.soyad}`,
      odevBaslik: teslim.odev.baslik,
      puan,
      maxPuan: teslim.odev.maxPuan,
      ogretmenYorumu
    }).catch(err => console.error('E-posta gönderme hatası:', err));

    // Push notification gönder (arka planda)
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

    // Sınıfın derslerine ait ödevleri getir
    const odevler = await prisma.odev.findMany({
      where: {
        course: { sinifId: student.sinifId },
        aktif: true
      },
      include: {
        course: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } },
        teslimler: {
          where: { ogrenciId: userId }
        }
      },
      orderBy: { sonTeslimTarihi: 'asc' }
    });

    // Ödevleri durumlarıyla birlikte döndür
    const odevlerWithStatus = odevler.map(odev => ({
      ...odev,
      teslim: odev.teslimler[0] || null,
      gecikmisMi: new Date() > odev.sonTeslimTarihi && !odev.teslimler[0]
    }));

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
    const { aciklama, dosyaUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Ödevi kontrol et
    const odev = await prisma.odev.findUnique({
      where: { id: odevId },
      include: { course: { include: { sinif: true } } }
    });

    if (!odev) {
      return res.status(404).json({ success: false, error: 'Ödev bulunamadı' });
    }

    // Öğrencinin bu sınıfta olup olmadığını kontrol et
    const student = await prisma.user.findFirst({
      where: { id: userId, sinifId: odev.course.sinifId }
    });

    if (!student) {
      return res.status(403).json({ success: false, error: 'Bu ödevi teslim etme yetkiniz yok' });
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
        teslimTarihi: new Date(),
        durum: OdevDurum.TESLIM_EDILDI
      },
      create: {
        odevId,
        ogrenciId: userId,
        aciklama,
        dosyaUrl,
        durum: OdevDurum.TESLIM_EDILDI
      }
    });

    // Öğretmene bildirim gönder
    await prisma.notification.create({
      data: {
        userId: odev.ogretmenId,
        tip: 'BILDIRIM',
        baslik: '📥 Yeni Ödev Teslimi',
        mesaj: `${student.ad} ${student.soyad} "${odev.baslik}" ödevini teslim etti.`
      }
    });

    // Öğretmene push notification gönder (arka planda)
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
