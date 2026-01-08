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
export const getSiniflar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId, ogretmenDersleri } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    console.log('📚 getSiniflar çağrıldı:', { userId, userRole, ogretmenDersleri });

    // Eğer öğretmen ve ogretmenDersleri=true ise, sadece kendi derslerindeki sınıfları getir
    if (userRole === 'ogretmen' && ogretmenDersleri === 'true') {
      const ogretmenDersler = await prisma.course.findMany({
        where: {
          ogretmenId: userId,
          aktif: true
        },
        select: {
          sinifId: true
        }
      });

      const sinifIds = [...new Set(ogretmenDersler.map(d => d.sinifId))];

      const siniflar = await prisma.sinif.findMany({
        where: {
          id: { in: sinifIds },
          aktif: true
        },
        include: {
          kurs: true,
          _count: {
            select: { ogrenciler: true }
          }
        },
        orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
      });

      res.json({ success: true, data: siniflar });
      return;
    }

    // Normal kullanıcılar için tüm sınıflar
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

// ==================== ŞİFRE POLİTİKASI ====================

// Şifre güçlülük kontrolü
interface PasswordStrength {
  score: number; // 0-4 arası
  level: 'cok_zayif' | 'zayif' | 'orta' | 'guclu' | 'cok_guclu';
  feedback: string[];
}

function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Uzunluk kontrolü
  if (password.length < 8) {
    feedback.push('Şifre en az 8 karakter olmalı');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Büyük harf kontrolü
  if (!/[A-Z]/.test(password)) {
    feedback.push('En az bir büyük harf içermeli');
  } else {
    score += 1;
  }

  // Küçük harf kontrolü
  if (!/[a-z]/.test(password)) {
    feedback.push('En az bir küçük harf içermeli');
  } else {
    score += 1;
  }

  // Rakam kontrolü
  if (!/[0-9]/.test(password)) {
    feedback.push('En az bir rakam içermeli');
  } else {
    score += 1;
  }

  // Özel karakter kontrolü
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('En az bir özel karakter içermeli (!@#$%^&*...)');
  } else {
    score += 1;
  }

  // Yaygın şifre kontrolü
  const commonPasswords = ['123456', 'password', 'qwerty', '123456789', '12345678', '12345', 'abc123', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('Bu şifre çok yaygın, başka bir şifre seçin');
  }

  // Seviye belirleme
  let level: PasswordStrength['level'];
  if (score <= 1) level = 'cok_zayif';
  else if (score <= 2) level = 'zayif';
  else if (score <= 3) level = 'orta';
  else if (score <= 4) level = 'guclu';
  else level = 'cok_guclu';

  return { score: Math.min(score, 5), level, feedback };
}

// Şifre güçlülük endpoint'i
export const validatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, error: 'Şifre gerekli' });
      return;
    }

    const strength = checkPasswordStrength(password);
    const isValid = strength.score >= 3 && strength.feedback.length === 0;

    res.json({
      success: true,
      data: {
        ...strength,
        isValid,
        minScore: 3
      }
    });
  } catch (error) {
    console.error('Şifre doğrulama hatası:', error);
    res.status(500).json({ success: false, error: 'Şifre kontrol edilemedi' });
  }
};

// Şifre değiştirme (güçlülük kontrolü ile)
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    // Mevcut şifreyi doğrula
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      res.status(400).json({ success: false, error: 'Mevcut şifre yanlış' });
      return;
    }

    // Yeni şifre güçlülük kontrolü
    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 3) {
      res.status(400).json({
        success: false,
        error: 'Şifre yeterince güçlü değil',
        feedback: strength.feedback
      });
      return;
    }

    // Şifreyi güncelle
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ success: false, error: 'Şifre değiştirilemedi' });
  }
};

// ==================== TOPLU KULLANICI IMPORT ====================

interface ImportUser {
  email: string;
  ad: string;
  soyad: string;
  telefon?: string;
  role: Role;
  sinifAd?: string;
  brans?: string;
  ogrenciNo?: string;
}

// Toplu kullanıcı import
export const bulkImportUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { users, kursId, defaultPassword = 'Edura2024!' } = req.body as {
      users: ImportUser[];
      kursId?: string;
      defaultPassword?: string;
    };

    if (!users || !Array.isArray(users) || users.length === 0) {
      res.status(400).json({ success: false, error: 'Kullanıcı listesi gerekli' });
      return;
    }

    // Şifre güçlülük kontrolü
    const passwordStrength = checkPasswordStrength(defaultPassword);
    if (passwordStrength.score < 3) {
      res.status(400).json({
        success: false,
        error: 'Varsayılan şifre yeterince güçlü değil',
        feedback: passwordStrength.feedback
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const results: { success: ImportUser[]; failed: { user: ImportUser; error: string }[] } = {
      success: [],
      failed: []
    };

    // Sınıf adlarını ID'ye çevir
    const sinifMap = new Map<string, string>();
    if (kursId) {
      const siniflar = await prisma.sinif.findMany({
        where: { kursId },
        select: { id: true, ad: true }
      });
      siniflar.forEach(s => sinifMap.set(s.ad.toLowerCase(), s.id));
    }

    // Her kullanıcıyı işle
    for (const userData of users) {
      try {
        // Email kontrolü
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          results.failed.push({ user: userData, error: 'Email zaten kullanılıyor' });
          continue;
        }

        // Sınıf ID'si bul
        let sinifId: string | undefined;
        if (userData.sinifAd && sinifMap.has(userData.sinifAd.toLowerCase())) {
          sinifId = sinifMap.get(userData.sinifAd.toLowerCase());
        }

        // Kullanıcıyı oluştur
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            ad: userData.ad,
            soyad: userData.soyad,
            telefon: userData.telefon,
            role: userData.role,
            kursId: kursId || undefined,
            sinifId: userData.role === 'ogrenci' ? sinifId : undefined,
            brans: userData.role === 'ogretmen' ? userData.brans : undefined,
            ogrenciNo: userData.role === 'ogrenci' ? userData.ogrenciNo : undefined
          }
        });

        results.success.push(userData);
      } catch (err) {
        results.failed.push({ user: userData, error: 'Oluşturma hatası' });
      }
    }

    res.json({
      success: true,
      data: {
        toplam: users.length,
        basarili: results.success.length,
        basarisiz: results.failed.length,
        basarililar: results.success,
        basarisizlar: results.failed
      }
    });
  } catch (error) {
    console.error('Toplu import hatası:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar import edilemedi' });
  }
};

// Import şablonu
export const getImportTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const template = {
      description: 'Toplu kullanıcı import şablonu',
      fields: [
        { name: 'email', required: true, type: 'string', example: 'ornek@email.com' },
        { name: 'ad', required: true, type: 'string', example: 'Ali' },
        { name: 'soyad', required: true, type: 'string', example: 'Yılmaz' },
        { name: 'telefon', required: false, type: 'string', example: '05551234567' },
        { name: 'role', required: true, type: 'enum', options: ['ogrenci', 'ogretmen', 'veli', 'sekreter'], example: 'ogrenci' },
        { name: 'sinifAd', required: false, type: 'string', description: 'Öğrenciler için sınıf adı', example: '8-A' },
        { name: 'brans', required: false, type: 'string', description: 'Öğretmenler için branş', example: 'Matematik' },
        { name: 'ogrenciNo', required: false, type: 'string', description: 'Öğrenciler için okul numarası', example: '2024001' }
      ],
      exampleData: [
        { email: 'ogrenci1@ornek.com', ad: 'Ahmet', soyad: 'Kaya', role: 'ogrenci', sinifAd: '8-A', ogrenciNo: '2024001' },
        { email: 'ogrenci2@ornek.com', ad: 'Ayşe', soyad: 'Demir', role: 'ogrenci', sinifAd: '8-B', ogrenciNo: '2024002' },
        { email: 'ogretmen1@ornek.com', ad: 'Mehmet', soyad: 'Yıldız', role: 'ogretmen', brans: 'Matematik' }
      ]
    };

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Şablon hatası:', error);
    res.status(500).json({ success: false, error: 'Şablon alınamadı' });
  }
};

// ==================== OTURUM YÖNETİMİ ====================

// Not: Gerçek oturum yönetimi için JWT blacklist veya session store gerekir
// Bu örnekte basit bir implementasyon sunuyoruz

// Kullanıcının profil bilgilerini getir
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        telefon: true,
        dogumTarihi: true,
        role: true,
        brans: true,
        ogrenciNo: true,
        xpPuani: true,
        xpSeviye: true,
        streak: true,
        kurs: { select: { id: true, ad: true } },
        sinif: { select: { id: true, ad: true, seviye: true } },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Profil hatası:', error);
    res.status(500).json({ success: false, error: 'Profil alınamadı' });
  }
};

// Profil güncelleme
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { ad, soyad, telefon, dogumTarihi } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(ad && { ad }),
        ...(soyad && { soyad }),
        ...(telefon && { telefon }),
        ...(dogumTarihi && { dogumTarihi: new Date(dogumTarihi) })
      },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        telefon: true,
        dogumTarihi: true,
        role: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ success: false, error: 'Profil güncellenemedi' });
  }
};

// Kullanıcı arama (admin/müdür için)
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, role, sinifId, limit = 20 } = req.query;
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const whereCondition: any = {
      aktif: true,
      ...(user?.kursId && { kursId: user.kursId }),
      ...(role && { role: role as Role }),
      ...(sinifId && { sinifId: sinifId as string })
    };

    if (q) {
      whereCondition.OR = [
        { ad: { contains: q as string } },
        { soyad: { contains: q as string } },
        { email: { contains: q as string } },
        { ogrenciNo: { contains: q as string } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        role: true,
        ogrenciNo: true,
        sinif: { select: { ad: true } }
      },
      take: parseInt(limit as string),
      orderBy: [{ ad: 'asc' }, { soyad: 'asc' }]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    res.status(500).json({ success: false, error: 'Arama yapılamadı' });
  }
};

// ==================== BİLDİRİMLER ====================

// Kullanıcının bildirimlerini getir
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = '20', unreadOnly } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    const whereCondition: any = { userId };
    if (unreadOnly === 'true') {
      whereCondition.okundu = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Okunmamış bildirim sayısı
    const unreadCount = await prisma.notification.count({
      where: { userId, okundu: false }
    });

    res.json({ 
      success: true, 
      data: notifications,
      unreadCount 
    });
  } catch (error) {
    console.error('Bildirim getirme hatası:', error);
    res.status(500).json({ success: false, error: 'Bildirimler getirilemedi' });
  }
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      res.status(404).json({ success: false, error: 'Bildirim bulunamadı' });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { okundu: true }
    });

    res.json({ success: true, message: 'Bildirim okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Bildirim okundu işaretleme hatası:', error);
    res.status(500).json({ success: false, error: 'İşlem başarısız' });
  }
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId, okundu: false },
      data: { okundu: true }
    });

    res.json({ success: true, message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Toplu bildirim okundu işaretleme hatası:', error);
    res.status(500).json({ success: false, error: 'İşlem başarısız' });
  }
};

// Bildirim sil
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
      return;
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      res.status(404).json({ success: false, error: 'Bildirim bulunamadı' });
      return;
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Bildirim silindi' });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    res.status(500).json({ success: false, error: 'Bildirim silinemedi' });
  }
};