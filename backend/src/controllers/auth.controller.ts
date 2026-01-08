import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'edura-secret-key';

// Personel rolleri (Personel girişinden giriş yapabilir)
const PERSONEL_ROLES = ['admin', 'kursSahibi', 'mudur', 'ogretmen', 'sekreter'];
// Öğrenci/Veli rolleri (Öğrenci girişinden giriş yapabilir)
const OGRENCI_ROLES = ['ogrenci', 'veli'];

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Frontend hem kullaniciAdi hem sifre gönderiyor
    const { kullaniciAdi, sifre, email, password, kullaniciTuru } = req.body;
    
    // Hem eski (email/password) hem yeni (kullaniciAdi/sifre) format desteği
    const loginEmail = kullaniciAdi || email;
    const loginPassword = sifre || password;

    if (!loginEmail || !loginPassword) {
      res.status(400).json({ success: false, error: 'Email ve şifre gerekli' });
      return;
    }

    // Kullanıcıyı email ile bul - önce tam olarak, sonra @edura.com ekleyerek
    let user = await prisma.user.findUnique({
      where: { email: loginEmail },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    // Bulunamadıysa ve @ yoksa, @edura.com ekleyerek tekrar dene
    if (!user && !loginEmail.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: `${loginEmail}@edura.com` },
        include: {
          kurs: true,
          sinif: true,
        },
      });
    }

    if (!user) {
      res.status(401).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    if (!user.aktif) {
      res.status(401).json({ success: false, error: 'Hesap devre dışı' });
      return;
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(loginPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Geçersiz şifre' });
      return;
    }

    // 🔒 Giriş türü kontrolü - Personel ve Öğrenci izolasyonu
    if (kullaniciTuru) {
      const isPersonelLogin = PERSONEL_ROLES.includes(kullaniciTuru) || kullaniciTuru === 'personel' || kullaniciTuru === 'kurs';
      const isOgrenciLogin = kullaniciTuru === 'ogrenci';
      
      // Personel girişi seçildiyse, sadece personel rolleri kabul edilir
      if (isPersonelLogin && !PERSONEL_ROLES.includes(user.role)) {
        res.status(401).json({ 
          success: false, 
          error: 'Bu hesap personel girişi için uygun değil. Lütfen Öğrenci girişini kullanın.' 
        });
        return;
      }
      
      // Öğrenci girişi seçildiyse, sadece öğrenci/veli rolleri kabul edilir
      if (isOgrenciLogin && !OGRENCI_ROLES.includes(user.role)) {
        res.status(401).json({ 
          success: false, 
          error: 'Bu hesap öğrenci girişi için uygun değil. Lütfen Personel girişini kullanın.' 
        });
        return;
      }
    }

    // Token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        kursId: user.kursId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          telefon: user.telefon,
          role: user.role,
          kurs: user.kurs,
          sinif: user.sinif,
          sifreDegistirildiMi: true, // Şimdilik her zaman true - şifre değiştirme zorunluluğunu kaldır
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Giriş işlemi başarısız' });
  }
};

// Şifre değiştir
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Frontend: yeniSifre, Backend eski format: currentPassword, newPassword
    const { currentPassword, newPassword, yeniSifre, mevcutSifre } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    const finalNewPassword = yeniSifre || newPassword;
    const finalCurrentPassword = mevcutSifre || currentPassword;

    if (!finalNewPassword) {
      res.status(400).json({ success: false, error: 'Yeni şifre gerekli' });
      return;
    }

    // Mevcut şifre verilmişse kontrol et (ilk giriş için verilmeyebilir)
    if (finalCurrentPassword) {
      const isValidPassword = await bcrypt.compare(finalCurrentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({ success: false, error: 'Mevcut şifre yanlış' });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(finalNewPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Şifre değiştirilemedi' });
  }
};

// Mevcut kullanıcı bilgisi
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          telefon: user.telefon,
          role: user.role,
          kurs: user.kurs,
          sinif: user.sinif,
        },
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı bilgisi alınamadı' });
  }
};

// Yeni kullanıcı kaydet
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, ad, soyad, telefon, role, kursId, sinifId, brans } = req.body;

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Bu email zaten kullanılıyor' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
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

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          ad: newUser.ad,
          soyad: newUser.soyad,
          role: newUser.role,
        },
      },
      message: 'Kullanıcı başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Kayıt işlemi başarısız' });
  }
};
