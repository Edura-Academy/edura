import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AdminDuyuruOncelik, ChangelogTip, DestekTalebiDurum, DestekTalebiKategori, DestekTalebiOncelik, FAQKategori } from '@prisma/client';

const prisma = new PrismaClient();

// ================== ADMİN DUYURULARI ==================

// Tüm admin duyurularını getir
export const getAdminDuyurular = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { aktif, oncelik, limit = '20', offset = '0' } = req.query;

    const where: any = {};
    if (aktif !== undefined) where.aktif = aktif === 'true';
    if (oncelik) where.oncelik = oncelik as AdminDuyuruOncelik;

    const [duyurular, total] = await Promise.all([
      prisma.adminDuyuru.findMany({
        where,
        orderBy: { yayinTarihi: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          _count: {
            select: { okuyanlar: true }
          }
        }
      }),
      prisma.adminDuyuru.count({ where })
    ]);

    res.json({
      success: true,
      data: { duyurular, total }
    });
  } catch (error) {
    next(error);
  }
};

// Admin duyurusu oluştur
export const createAdminDuyuru = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { baslik, icerik, oncelik, dosyaUrl, dosyaAd, bitisTarihi } = req.body;

    if (!baslik || !icerik) {
      res.status(400).json({ success: false, error: 'Başlık ve içerik zorunludur' });
      return;
    }

    const duyuru = await prisma.adminDuyuru.create({
      data: {
        baslik,
        icerik,
        oncelik: oncelik || 'NORMAL',
        dosyaUrl,
        dosyaAd,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null
      }
    });

    res.status(201).json({
      success: true,
      data: { duyuru }
    });
  } catch (error) {
    next(error);
  }
};

// Admin duyurusu güncelle
export const updateAdminDuyuru = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { baslik, icerik, oncelik, dosyaUrl, dosyaAd, bitisTarihi, aktif } = req.body;

    const duyuru = await prisma.adminDuyuru.update({
      where: { id },
      data: {
        baslik,
        icerik,
        oncelik,
        dosyaUrl,
        dosyaAd,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
        aktif
      }
    });

    res.json({
      success: true,
      data: { duyuru }
    });
  } catch (error) {
    next(error);
  }
};

// Admin duyurusu sil
export const deleteAdminDuyuru = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.adminDuyuru.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Duyuru silindi'
    });
  } catch (error) {
    next(error);
  }
};

// Müdür için duyuruları getir
export const getMudurDuyurular = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    const duyurular = await prisma.adminDuyuru.findMany({
      where: {
        aktif: true,
        OR: [
          { bitisTarihi: null },
          { bitisTarihi: { gte: new Date() } }
        ]
      },
      orderBy: [
        { oncelik: 'desc' },
        { yayinTarihi: 'desc' }
      ],
      include: {
        okuyanlar: {
          where: { userId },
          select: { okunmaTarihi: true }
        }
      }
    });

    // Okundu bilgisi ekle
    const duyurularWithStatus = duyurular.map(d => ({
      ...d,
      okundu: d.okuyanlar.length > 0,
      okuyanlar: undefined
    }));

    res.json({
      success: true,
      data: { duyurular: duyurularWithStatus }
    });
  } catch (error) {
    next(error);
  }
};

// Duyuruyu okundu işaretle
export const markDuyuruAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    await prisma.adminDuyuruOkuma.upsert({
      where: {
        adminDuyuruId_userId: { adminDuyuruId: id, userId }
      },
      create: {
        adminDuyuruId: id,
        userId
      },
      update: {
        okunmaTarihi: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Duyuru okundu olarak işaretlendi'
    });
  } catch (error) {
    next(error);
  }
};

// ================== CHANGELOG ==================

// Tüm changelog kayıtlarını getir
export const getChangelogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tip, limit = '20', offset = '0' } = req.query;

    const where: any = { aktif: true };
    if (tip) where.tip = tip as ChangelogTip;

    const [changelogs, total] = await Promise.all([
      prisma.changelog.findMany({
        where,
        orderBy: { yayinTarihi: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.changelog.count({ where })
    ]);

    res.json({
      success: true,
      data: { changelogs, total }
    });
  } catch (error) {
    next(error);
  }
};

// Changelog oluştur
export const createChangelog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { versiyon, baslik, aciklama, tip, degisiklikler } = req.body;

    if (!versiyon || !baslik || !aciklama) {
      res.status(400).json({ success: false, error: 'Versiyon, başlık ve açıklama zorunludur' });
      return;
    }

    const changelog = await prisma.changelog.create({
      data: {
        versiyon,
        baslik,
        aciklama,
        tip: tip || 'YENI_OZELLIK',
        degisiklikler: degisiklikler ? JSON.stringify(degisiklikler) : null
      }
    });

    res.status(201).json({
      success: true,
      data: { changelog }
    });
  } catch (error) {
    next(error);
  }
};

// Changelog güncelle
export const updateChangelog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { versiyon, baslik, aciklama, tip, degisiklikler, aktif } = req.body;

    const changelog = await prisma.changelog.update({
      where: { id },
      data: {
        versiyon,
        baslik,
        aciklama,
        tip,
        degisiklikler: degisiklikler ? JSON.stringify(degisiklikler) : undefined,
        aktif
      }
    });

    res.json({
      success: true,
      data: { changelog }
    });
  } catch (error) {
    next(error);
  }
};

// Changelog sil
export const deleteChangelog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.changelog.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Changelog silindi'
    });
  } catch (error) {
    next(error);
  }
};

// ================== DESTEK TALEPLERİ ==================

// Tüm destek taleplerini getir (Admin için)
export const getDestekTalepleri = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { durum, kategori, oncelik, limit = '20', offset = '0' } = req.query;

    const where: any = {};
    if (durum) where.durum = durum as DestekTalebiDurum;
    if (kategori) where.kategori = kategori as DestekTalebiKategori;
    if (oncelik) where.oncelik = oncelik as DestekTalebiOncelik;

    const [talepler, total] = await Promise.all([
      prisma.destekTalebi.findMany({
        where,
        orderBy: [
          { oncelik: 'desc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          _count: {
            select: { cevaplar: true }
          }
        }
      }),
      prisma.destekTalebi.count({ where })
    ]);

    // Acan kullanıcı bilgilerini al
    const acanIds = [...new Set(talepler.map(t => t.acanId))];
    const users = await prisma.user.findMany({
      where: { id: { in: acanIds } },
      select: { id: true, ad: true, soyad: true, email: true, role: true }
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    const taleplerWithUser = talepler.map(t => ({
      ...t,
      acan: usersMap.get(t.acanId)
    }));

    res.json({
      success: true,
      data: { talepler: taleplerWithUser, total }
    });
  } catch (error) {
    next(error);
  }
};

// Tek destek talebini getir
export const getDestekTalebi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const talep = await prisma.destekTalebi.findUnique({
      where: { id },
      include: {
        cevaplar: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!talep) {
      res.status(404).json({ success: false, error: 'Talep bulunamadı' });
      return;
    }

    // Acan ve cevaplayan kullanıcı bilgilerini al
    const userIds = [talep.acanId, ...talep.cevaplar.map(c => c.cevaplayanId)];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, ad: true, soyad: true, email: true, role: true }
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    const talepWithUsers = {
      ...talep,
      acan: usersMap.get(talep.acanId),
      cevaplar: talep.cevaplar.map(c => ({
        ...c,
        cevaplayan: usersMap.get(c.cevaplayanId)
      }))
    };

    res.json({
      success: true,
      data: { talep: talepWithUsers }
    });
  } catch (error) {
    next(error);
  }
};

// Destek talebi oluştur (Müdür için)
export const createDestekTalebi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { baslik, aciklama, kategori, oncelik, dosyaUrl, dosyaAd, kursId } = req.body;
    const userId = (req as any).user?.userId;

    if (!baslik || !aciklama) {
      res.status(400).json({ success: false, error: 'Başlık ve açıklama zorunludur' });
      return;
    }

    const talep = await prisma.destekTalebi.create({
      data: {
        baslik,
        aciklama,
        kategori: kategori || 'TEKNIK',
        oncelik: oncelik || 'NORMAL',
        acanId: userId,
        kursId,
        dosyaUrl,
        dosyaAd
      }
    });

    res.status(201).json({
      success: true,
      data: { talep }
    });
  } catch (error) {
    next(error);
  }
};

// Destek talebine cevap ekle
export const addDestekCevap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { icerik, dosyaUrl, dosyaAd } = req.body;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    if (!icerik) {
      res.status(400).json({ success: false, error: 'Cevap içeriği zorunludur' });
      return;
    }

    const adminYazdiMi = userRole === 'admin';

    // Cevap ekle ve talep durumunu güncelle
    const [cevap] = await prisma.$transaction([
      prisma.destekTalebiCevap.create({
        data: {
          talepId: id,
          cevaplayanId: userId,
          icerik,
          dosyaUrl,
          dosyaAd,
          adminYazdiMi
        }
      }),
      prisma.destekTalebi.update({
        where: { id },
        data: {
          durum: adminYazdiMi ? 'CEVAPLANDI' : 'BEKLEMEDE'
        }
      })
    ]);

    res.status(201).json({
      success: true,
      data: { cevap }
    });
  } catch (error) {
    next(error);
  }
};

// Destek talebi durumunu güncelle (Admin için)
export const updateDestekTalebiDurum = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { durum, cozumNotu } = req.body;

    const updateData: any = { durum };
    if (durum === 'COZULDU' || durum === 'KAPATILDI') {
      updateData.kapatmaTarihi = new Date();
      if (cozumNotu) updateData.cozumNotu = cozumNotu;
    }

    const talep = await prisma.destekTalebi.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: { talep }
    });
  } catch (error) {
    next(error);
  }
};

// Müdürün kendi taleplerini getir
export const getMudurDestekTalepleri = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { durum } = req.query;

    const where: any = { acanId: userId };
    if (durum) where.durum = durum as DestekTalebiDurum;

    const talepler = await prisma.destekTalebi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { cevaplar: true }
        }
      }
    });

    res.json({
      success: true,
      data: { talepler }
    });
  } catch (error) {
    next(error);
  }
};

// ================== FAQ ==================

// Tüm FAQ'leri getir
export const getFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { kategori, search, aktif = 'true' } = req.query;

    const where: any = {};
    if (aktif !== undefined) where.aktif = aktif === 'true';
    if (kategori) where.kategori = kategori as FAQKategori;
    if (search) {
      where.OR = [
        { soru: { contains: search as string } },
        { cevap: { contains: search as string } },
        { anahtarKelimeler: { contains: search as string } }
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { kategori: 'asc' },
        { siraNo: 'asc' }
      ]
    });

    // Kategorilere göre grupla
    const kategoriler = [...new Set(faqs.map(f => f.kategori))];
    const grupluFaqs = kategoriler.map(k => ({
      kategori: k,
      sorular: faqs.filter(f => f.kategori === k)
    }));

    res.json({
      success: true,
      data: { faqs, grupluFaqs }
    });
  } catch (error) {
    next(error);
  }
};

// FAQ oluştur
export const createFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { soru, cevap, kategori, siraNo, anahtarKelimeler } = req.body;

    if (!soru || !cevap) {
      res.status(400).json({ success: false, error: 'Soru ve cevap zorunludur' });
      return;
    }

    const faq = await prisma.fAQ.create({
      data: {
        soru,
        cevap,
        kategori: kategori || 'GENEL',
        siraNo: siraNo || 0,
        anahtarKelimeler
      }
    });

    res.status(201).json({
      success: true,
      data: { faq }
    });
  } catch (error) {
    next(error);
  }
};

// FAQ güncelle
export const updateFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { soru, cevap, kategori, siraNo, anahtarKelimeler, aktif } = req.body;

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        soru,
        cevap,
        kategori,
        siraNo,
        anahtarKelimeler,
        aktif
      }
    });

    res.json({
      success: true,
      data: { faq }
    });
  } catch (error) {
    next(error);
  }
};

// FAQ sil
export const deleteFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.fAQ.delete({ where: { id } });

    res.json({
      success: true,
      message: 'FAQ silindi'
    });
  } catch (error) {
    next(error);
  }
};

// FAQ görüntüleme sayısını artır
export const incrementFAQView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.fAQ.update({
      where: { id },
      data: { goruntulemeSayisi: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// FAQ faydalı bulundu
export const markFAQHelpful = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.fAQ.update({
      where: { id },
      data: { faydaliSayisi: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ================== DASHBOARD İSTATİSTİKLERİ ==================

// Admin sistem istatistikleri
export const getSystemStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      aktifDuyuruSayisi,
      acikTalepSayisi,
      bekleyenTalepSayisi,
      faqSayisi,
      changelogSayisi
    ] = await Promise.all([
      prisma.adminDuyuru.count({ where: { aktif: true } }),
      prisma.destekTalebi.count({ where: { durum: 'ACIK' } }),
      prisma.destekTalebi.count({ where: { durum: 'BEKLEMEDE' } }),
      prisma.fAQ.count({ where: { aktif: true } }),
      prisma.changelog.count({ where: { aktif: true } })
    ]);

    // Son 7 gün destek talepleri
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);

    const sonTalepler = await prisma.destekTalebi.groupBy({
      by: ['durum'],
      _count: true,
      where: {
        createdAt: { gte: yediGunOnce }
      }
    });

    res.json({
      success: true,
      data: {
        aktifDuyuruSayisi,
        acikTalepSayisi,
        bekleyenTalepSayisi,
        faqSayisi,
        changelogSayisi,
        sonHaftaTalepler: sonTalepler
      }
    });
  } catch (error) {
    next(error);
  }
};

