import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';

// Tüm kullanıcıları getir
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, kursId, aktif } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as Role }),
        ...(kursId && { kursId: kursId as string }),
        ...(aktif !== undefined && { aktif: aktif === 'true' }),
      },
      include: {
        kurs: true,
        sinif: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar getirilemedi' });
  }
};

// Tek kullanıcı getir
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı getirilemedi' });
  }
};

// Kullanıcı oluştur
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, ad, soyad, telefon, role, kursId, sinifId, brans } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Bu email zaten kullanılıyor' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ad,
        soyad,
        telefon,
        role,
        kursId,
        sinifId,
        brans,
      },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı oluşturulamadı' });
  }
};

// Kullanıcı güncelle
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ad, soyad, telefon, email, kursId, sinifId, brans, aktif } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(ad && { ad }),
        ...(soyad && { soyad }),
        ...(telefon && { telefon }),
        ...(email && { email }),
        ...(kursId && { kursId }),
        ...(sinifId && { sinifId }),
        ...(brans && { brans }),
        ...(aktif !== undefined && { aktif }),
      },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı güncellenemedi' });
  }
};

// Kullanıcı sil (soft delete) - Hiyerarşik yetki kontrolü ile
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Silinecek kullanıcıyı bul
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, ad: true, soyad: true }
    });

    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    // Kendi kendini silme engeli
    if (currentUser.id === id) {
      res.status(403).json({ success: false, error: 'Kendi hesabınızı silemezsiniz' });
      return;
    }

    // Hiyerarşik yetki kontrolü
    const roleHierarchy: Record<string, string[]> = {
      admin: ['mudur', 'ogretmen', 'sekreter', 'ogrenci', 'veli'],  // Admin herkesi silebilir (admin hariç)
      mudur: ['ogretmen', 'sekreter', 'ogrenci', 'veli'],           // Müdür: öğretmen, sekreter, öğrenci, veli
      sekreter: ['ogrenci', 'veli'],                                // Sekreter: sadece öğrenci ve veli
    };

    const allowedRoles = roleHierarchy[currentUser.role] || [];

    if (!allowedRoles.includes(targetUser.role)) {
      res.status(403).json({ 
        success: false, 
        error: `${targetUser.role} rolündeki kullanıcıyı silme yetkiniz yok` 
      });
      return;
    }

    // Soft delete uygula
    await prisma.user.update({
      where: { id },
      data: { aktif: false },
    });

    res.json({ 
      success: true, 
      message: `${targetUser.ad} ${targetUser.soyad} kullanıcısı silindi` 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı silinemedi' });
  }
};

// Kursları getir
export const getKurslar = async (req: Request, res: Response): Promise<void> => {
  try {
    const kurslar = await prisma.kurs.findMany({
      where: { aktif: true },
      include: {
        siniflar: true,
        _count: {
          select: { users: true },
        },
      },
    });

    res.json({ success: true, data: kurslar });
  } catch (error) {
    console.error('Get kurslar error:', error);
    res.status(500).json({ success: false, error: 'Kurslar getirilemedi' });
  }
};

// Kurs oluştur
export const createKurs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ad, adres, telefon } = req.body;

    const kurs = await prisma.kurs.create({
      data: {
        ad,
        adres,
        telefon,
      },
    });

    res.status(201).json({ success: true, data: kurs });
  } catch (error) {
    console.error('Create kurs error:', error);
    res.status(500).json({ success: false, error: 'Kurs oluşturulamadı' });
  }
};

// Sınıfları getir
export const getSiniflar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kursId } = req.query;

    const siniflar = await prisma.sinif.findMany({
      where: {
        ...(kursId && { kursId: kursId as string }),
        aktif: true,
      },
      include: {
        kurs: true,
        _count: {
          select: { ogrenciler: true },
        },
      },
      orderBy: [{ seviye: 'asc' }, { ad: 'asc' }],
    });

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Get siniflar error:', error);
    res.status(500).json({ success: false, error: 'Sınıflar getirilemedi' });
  }
};

// Tek sınıf getir
export const getSinif = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sinif = await prisma.sinif.findUnique({
      where: { id },
      include: {
        kurs: true,
        ogrenciler: {
          where: { aktif: true },
          select: { id: true, ad: true, soyad: true, email: true },
        },
        _count: {
          select: { ogrenciler: true },
        },
      },
    });

    if (!sinif) {
      res.status(404).json({ success: false, error: 'Sınıf bulunamadı' });
      return;
    }

    res.json({ success: true, data: sinif });
  } catch (error) {
    console.error('Get sinif error:', error);
    res.status(500).json({ success: false, error: 'Sınıf getirilemedi' });
  }
};

// Sınıf oluştur
export const createSinif = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ad, seviye, tip } = req.body;
    const kursId = req.user?.kursId;

    if (!ad || !kursId) {
      res.status(400).json({ success: false, error: 'Sınıf adı ve kurs bilgisi gerekli' });
      return;
    }

    // Seviye belirlenmemişse tip'e göre varsayılan ata
    const defaultSeviye = seviye || (tip === 'LISE' ? 9 : 5);
    const defaultTip = tip || (seviye >= 9 ? 'LISE' : 'ORTAOKUL');

    const sinif = await prisma.sinif.create({
      data: {
        ad,
        seviye: parseInt(defaultSeviye),
        tip: defaultTip,
        kursId,
      },
      include: {
        _count: {
          select: { ogrenciler: true },
        },
      },
    });

    res.status(201).json({ success: true, data: sinif });
  } catch (error) {
    console.error('Create sinif error:', error);
    res.status(500).json({ success: false, error: 'Sınıf oluşturulamadı' });
  }
};

// Sınıf güncelle
export const updateSinif = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ad, seviye, tip, aktif } = req.body;

    const sinif = await prisma.sinif.update({
      where: { id },
      data: {
        ...(ad && { ad }),
        ...(seviye !== undefined && { seviye: parseInt(seviye) }),
        ...(tip && { tip }),
        ...(aktif !== undefined && { aktif }),
      },
      include: {
        _count: {
          select: { ogrenciler: true },
        },
      },
    });

    res.json({ success: true, data: sinif });
  } catch (error) {
    console.error('Update sinif error:', error);
    res.status(500).json({ success: false, error: 'Sınıf güncellenemedi' });
  }
};

// Sınıf sil (soft delete)
export const deleteSinif = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Sınıftaki öğrenci sayısını kontrol et
    const sinif = await prisma.sinif.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ogrenciler: { where: { aktif: true } } },
        },
      },
    });

    if (!sinif) {
      res.status(404).json({ success: false, error: 'Sınıf bulunamadı' });
      return;
    }

    if (sinif._count.ogrenciler > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Bu sınıfta ${sinif._count.ogrenciler} aktif öğrenci var. Önce öğrencileri başka sınıfa taşıyın.` 
      });
      return;
    }

    await prisma.sinif.update({
      where: { id },
      data: { aktif: false },
    });

    res.json({ success: true, message: 'Sınıf silindi' });
  } catch (error) {
    console.error('Delete sinif error:', error);
    res.status(500).json({ success: false, error: 'Sınıf silinemedi' });
  }
};

// İstatistikler
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kursId = req.user?.kursId;

    const [
      toplamOgrenci,
      toplamOgretmen,
      toplamSekreter,
      toplamSinif,
      toplamKurs,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'ogrenci',
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.user.count({
        where: {
          role: 'ogretmen',
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.user.count({
        where: {
          role: 'sekreter',
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.sinif.count({
        where: {
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.kurs.count({
        where: { aktif: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        toplamOgrenci,
        toplamOgretmen,
        toplamSekreter,
        toplamSinif,
        toplamKurs,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'İstatistikler getirilemedi' });
  }
};

// FCM Token kaydet (Push notification için)
export const saveFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { fcmToken } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    if (!fcmToken) {
      res.status(400).json({ success: false, error: 'FCM token gerekli' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken }
    });

    res.json({ success: true, message: 'FCM token kaydedildi' });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ success: false, error: 'Token kaydedilemedi' });
  }
};

// FCM Token sil (Çıkış yapıldığında)
export const removeFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null }
    });

    res.json({ success: true, message: 'FCM token silindi' });
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({ success: false, error: 'Token silinemedi' });
  }
};