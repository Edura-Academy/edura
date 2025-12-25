import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Haftalık ders programını getir (öğretmen için)
export const getOgretmenDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.userId;

    const dersler = await prisma.course.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true } }
      },
      orderBy: [
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    // FullCalendar formatına dönüştür
    const events = dersler.map(ders => ({
      id: ders.id,
      title: `${ders.ad} - ${ders.sinif.ad}`,
      daysOfWeek: [gunToNumber(ders.gun)],
      startTime: ders.baslangicSaati,
      endTime: ders.bitisSaati,
      extendedProps: {
        dersAd: ders.ad,
        sinifAd: ders.sinif.ad,
        sinifId: ders.sinifId,
        aciklama: ders.aciklama
      },
      backgroundColor: getDersColor(ders.ad),
      borderColor: getDersColor(ders.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Öğretmen ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğrenci ders programı
export const getOgrenciDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.userId;

    // Öğrencinin kayıtlı olduğu dersler
    const kayitlar = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            sinif: { select: { id: true, ad: true } },
            ogretmen: { select: { id: true, ad: true, soyad: true } }
          }
        }
      }
    });

    const events = kayitlar.map(kayit => ({
      id: kayit.course.id,
      title: kayit.course.ad,
      daysOfWeek: [gunToNumber(kayit.course.gun)],
      startTime: kayit.course.baslangicSaati,
      endTime: kayit.course.bitisSaati,
      extendedProps: {
        dersAd: kayit.course.ad,
        sinifAd: kayit.course.sinif.ad,
        ogretmenAd: `${kayit.course.ogretmen.ad} ${kayit.course.ogretmen.soyad}`,
        aciklama: kayit.course.aciklama
      },
      backgroundColor: getDersColor(kayit.course.ad),
      borderColor: getDersColor(kayit.course.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Öğrenci ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınıf bazlı ders programı (personel görüntülemesi için)
export const getSinifDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const { sinifId } = req.params;

    const dersler = await prisma.course.findMany({
      where: { sinifId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      },
      orderBy: [
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    const events = dersler.map(ders => ({
      id: ders.id,
      title: ders.ad,
      daysOfWeek: [gunToNumber(ders.gun)],
      startTime: ders.baslangicSaati,
      endTime: ders.bitisSaati,
      extendedProps: {
        dersAd: ders.ad,
        ogretmenAd: `${ders.ogretmen.ad} ${ders.ogretmen.soyad}`,
        aciklama: ders.aciklama
      },
      backgroundColor: getDersColor(ders.ad),
      borderColor: getDersColor(ders.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Sınıf ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Tüm sınıfları listele
export const getSiniflar = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { kursId: true }
    });

    const siniflar = await prisma.sinif.findMany({
      where: user?.kursId ? { kursId: user.kursId } : {},
      select: { id: true, ad: true, seviye: true },
      orderBy: { seviye: 'asc' }
    });

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Sınıflar listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Yeni ders ekle (personel)
export const createDers = async (req: AuthRequest, res: Response) => {
  try {
    const { ad, aciklama, sinifId, ogretmenId, gun, baslangicSaati, bitisSaati } = req.body;

    // Çakışma kontrolü
    const cakisma = await prisma.course.findFirst({
      where: {
        sinifId,
        gun,
        aktif: true,
        OR: [
          {
            AND: [
              { baslangicSaati: { lte: baslangicSaati } },
              { bitisSaati: { gt: baslangicSaati } }
            ]
          },
          {
            AND: [
              { baslangicSaati: { lt: bitisSaati } },
              { bitisSaati: { gte: bitisSaati } }
            ]
          }
        ]
      }
    });

    if (cakisma) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu saatte zaten ders var' 
      });
    }

    const ders = await prisma.course.create({
      data: {
        ad,
        aciklama,
        sinifId,
        ogretmenId,
        gun,
        baslangicSaati,
        bitisSaati
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.json({ success: true, data: ders });
  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ders güncelle
export const updateDers = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;
    const { ad, aciklama, gun, baslangicSaati, bitisSaati, ogretmenId } = req.body;

    const ders = await prisma.course.update({
      where: { id: dersId },
      data: {
        ...(ad && { ad }),
        ...(aciklama !== undefined && { aciklama }),
        ...(gun && { gun }),
        ...(baslangicSaati && { baslangicSaati }),
        ...(bitisSaati && { bitisSaati }),
        ...(ogretmenId && { ogretmenId })
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.json({ success: true, data: ders });
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ders sil
export const deleteDers = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;

    await prisma.course.update({
      where: { id: dersId },
      data: { aktif: false }
    });

    res.json({ success: true, message: 'Ders silindi' });
  } catch (error) {
    console.error('Ders silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğretmenleri listele
export const getOgretmenler = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { kursId: true }
    });

    const ogretmenler = await prisma.user.findMany({
      where: { 
        role: 'ogretmen',
        ...(user?.kursId ? { kursId: user.kursId } : {})
      },
      select: { 
        id: true, 
        ad: true, 
        soyad: true,
        brans: true
      },
      orderBy: { ad: 'asc' }
    });

    res.json({ success: true, data: ogretmenler });
  } catch (error) {
    console.error('Öğretmenler listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Yardımcı fonksiyonlar
function gunToNumber(gun: string): number {
  const gunler: Record<string, number> = {
    'Pazartesi': 1,
    'Salı': 2,
    'Çarşamba': 3,
    'Perşembe': 4,
    'Cuma': 5,
    'Cumartesi': 6,
    'Pazar': 0
  };
  return gunler[gun] ?? 1;
}

function getDersColor(dersAd: string): string {
  const colors: Record<string, string> = {
    'Matematik': '#3b82f6',
    'Türkçe': '#ef4444',
    'Fizik': '#8b5cf6',
    'Kimya': '#f59e0b',
    'Biyoloji': '#10b981',
    'Tarih': '#6366f1',
    'Coğrafya': '#14b8a6',
    'İngilizce': '#ec4899',
    'Almanca': '#f97316',
    'Felsefe': '#8b5cf6',
    'Din Kültürü': '#22c55e',
    'Geometri': '#0ea5e9'
  };
  
  // Ders adında anahtar kelime ara
  for (const [key, color] of Object.entries(colors)) {
    if (dersAd.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Varsayılan renk (hash based)
  let hash = 0;
  for (let i = 0; i < dersAd.length; i++) {
    hash = dersAd.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

