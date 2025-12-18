import { Response } from 'express';
import prisma from '../lib/prisma';
import { OdevDurum, Role } from '@prisma/client';
import { AuthRequest } from '../types';

// ==================== ÖDEV YÖNETİMİ (Öğretmen) ====================

// Öğretmenin tüm ödevlerini getir
export const getTeacherHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
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

    res.json(odevlerWithStats);
  } catch (error) {
    console.error('Ödevler alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Yeni ödev oluştur
export const createHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { baslik, aciklama, courseId, sonTeslimTarihi, maxPuan = 100 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    if (!baslik || !courseId || !sonTeslimTarihi) {
      return res.status(400).json({ error: 'Başlık, ders ve son teslim tarihi gerekli' });
    }

    // Dersi kontrol et ve öğretmenin bu derse erişimi var mı
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId },
      include: {
        sinif: {
          include: {
            ogrenciler: { select: { id: true } }
          }
        }
      }
    });

    if (!course) {
      return res.status(403).json({ error: 'Bu derse ödev ekleme yetkiniz yok' });
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
    const ogrenciIds = course.sinif.ogrenciler.map(o => o.id);
    if (ogrenciIds.length > 0) {
      await prisma.notification.createMany({
        data: ogrenciIds.map(ogrenciId => ({
          userId: ogrenciId,
          tip: 'BILDIRIM',
          baslik: '📝 Yeni Ödev',
          mesaj: `${course.ad} dersi için yeni ödev: "${baslik}". Son teslim: ${new Date(sonTeslimTarihi).toLocaleDateString('tr-TR')}`
        }))
      });
    }

    res.status(201).json(odev);
  } catch (error) {
    console.error('Ödev oluşturulurken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Ödev değerlendir (puan ver)
export const gradeHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teslimId } = req.params;
    const { puan, ogretmenYorumu } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    if (puan === undefined || puan === null) {
      return res.status(400).json({ error: 'Puan gerekli' });
    }

    // Teslimi bul ve öğretmenin yetkisini kontrol et
    const teslim = await prisma.odevTeslim.findFirst({
      where: { id: teslimId },
      include: {
        odev: { include: { course: true } },
        ogrenci: { select: { id: true, ad: true, soyad: true } }
      }
    });

    if (!teslim) {
      return res.status(404).json({ error: 'Teslim bulunamadı' });
    }

    if (teslim.odev.ogretmenId !== userId) {
      return res.status(403).json({ error: 'Bu ödevi değerlendirme yetkiniz yok' });
    }

    // Puanı kontrol et
    if (puan < 0 || puan > teslim.odev.maxPuan) {
      return res.status(400).json({ error: `Puan 0 ile ${teslim.odev.maxPuan} arasında olmalı` });
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
        ogrenci: { select: { id: true, ad: true, soyad: true } }
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

    res.json(updatedTeslim);
  } catch (error) {
    console.error('Ödev değerlendirilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ ÖDEVLERİ ====================

// Öğrencinin ödevlerini getir
export const getStudentHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    // Öğrencinin sınıfını bul
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { sinifId: true }
    });

    if (!student?.sinifId) {
      return res.status(400).json({ error: 'Öğrenci sınıfı bulunamadı' });
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

    res.json(odevlerWithStatus);
  } catch (error) {
    console.error('Öğrenci ödevleri alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Ödev teslim et
export const submitHomework = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odevId } = req.params;
    const { aciklama, dosyaUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    // Ödevi kontrol et
    const odev = await prisma.odev.findUnique({
      where: { id: odevId },
      include: { course: { include: { sinif: true } } }
    });

    if (!odev) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }

    // Öğrencinin bu sınıfta olup olmadığını kontrol et
    const student = await prisma.user.findFirst({
      where: { id: userId, sinifId: odev.course.sinifId }
    });

    if (!student) {
      return res.status(403).json({ error: 'Bu ödevi teslim etme yetkiniz yok' });
    }

    // Mevcut teslimi kontrol et
    const existingTeslim = await prisma.odevTeslim.findUnique({
      where: { odevId_ogrenciId: { odevId, ogrenciId: userId } }
    });

    if (existingTeslim && existingTeslim.durum === OdevDurum.DEGERLENDIRILDI) {
      return res.status(400).json({ error: 'Bu ödev zaten değerlendirilmiş' });
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

    res.status(201).json(teslim);
  } catch (error) {
    console.error('Ödev teslim edilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};
