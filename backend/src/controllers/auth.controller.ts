import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
const JWT_SECRET = process.env.JWT_SECRET || 'edura-secret-key';

// Admin Giriş
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kullaniciAdi, sifre, kullaniciTuru } = req.body;

    let user = null;
    let role = '';

    // Kullanıcı türüne göre ara
    switch (kullaniciTuru) {
      case 'admin':
        user = await prisma.admin.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'ADMIN';
        break;
      case 'mudur':
        user = await prisma.mudur.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'MUDUR';
        break;
      case 'ogretmen':
        user = await prisma.ogretmen.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'OGRETMEN';
        break;
      case 'sekreter':
        user = await prisma.sekreter.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'SEKRETER';
        break;
      case 'ogrenci':
        user = await prisma.ogrenci.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'OGRENCI';
        break;
      case 'kurs':
        user = await prisma.kurs.findUnique({ where: { KullaniciAdi: kullaniciAdi } });
        role = 'KURS';
        break;
      default:
        res.status(400).json({ success: false, error: 'Geçersiz kullanıcı türü' });
        return;
    }

    if (!user) {
      res.status(401).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    // Şifre kontrolü
    if (!user.Sifre) {
      res.status(401).json({ success: false, error: 'Şifre tanımlanmamış' });
      return;
    }
    const isValidPassword = await bcrypt.compare(sifre, user.Sifre);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Geçersiz şifre' });
      return;
    }

    // ID alanını bul (her tabloda farklı isim)
    const userId = (user as Record<string, unknown>).AdminID || 
                   (user as Record<string, unknown>).MudurID || 
                   (user as Record<string, unknown>).OgretmenID || 
                   (user as Record<string, unknown>).SekreterID || 
                   (user as Record<string, unknown>).OgrenciID || 
                   (user as Record<string, unknown>).KursID;

    // Token oluştur
    const token = jwt.sign(
      { 
        userId, 
        kullaniciAdi: user.KullaniciAdi, 
        role,
        kursId: (user as Record<string, unknown>).KursID || null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Şifre değiştirilmeli mi kontrol et
    const sifreDegistirildiMi = (user as Record<string, unknown>).SifreDegistirildiMi;

    // Profil fotoğrafı (kurs için Logo)
    const profilFoto = kullaniciTuru === 'kurs' 
      ? (user as Record<string, unknown>).Logo 
      : (user as Record<string, unknown>).ProfilFoto;

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          kullaniciAdi: user.KullaniciAdi,
          ad: (user as Record<string, unknown>).Ad || (user as Record<string, unknown>).KursAdi,
          soyad: (user as Record<string, unknown>).Soyad || null,
          email: (user as Record<string, unknown>).Email || null,
          telefon: (user as Record<string, unknown>).Telefon || null,
          role: kullaniciTuru,
          profilFoto: profilFoto || null,
          sifreDegistirildiMi,
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
    const { yeniSifre, kullaniciTuru } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const hashedPassword = await bcrypt.hash(yeniSifre, 10);

    switch (kullaniciTuru) {
      case 'admin':
        await prisma.admin.update({
          where: { AdminID: userId as number },
          data: { Sifre: hashedPassword },
        });
        break;
      case 'mudur':
        await prisma.mudur.update({
          where: { MudurID: userId as number },
          data: { Sifre: hashedPassword, SifreDegistirildiMi: true },
        });
        break;
      case 'ogretmen':
        await prisma.ogretmen.update({
          where: { OgretmenID: userId as number },
          data: { Sifre: hashedPassword, SifreDegistirildiMi: true },
        });
        break;
      case 'sekreter':
        await prisma.sekreter.update({
          where: { SekreterID: userId as number },
          data: { Sifre: hashedPassword, SifreDegistirildiMi: true },
        });
        break;
      case 'ogrenci':
        await prisma.ogrenci.update({
          where: { OgrenciID: userId as number },
          data: { Sifre: hashedPassword, SifreDegistirildiMi: true },
        });
        break;
      case 'kurs':
        await prisma.kurs.update({
          where: { KursID: userId as number },
          data: { Sifre: hashedPassword, SifreDegistirildiMi: true },
        });
        break;
    }

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

    res.json({ 
      success: true, 
      data: { 
        user: req.user 
      } 
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı bilgisi alınamadı' });
  }
};

// Yeni kullanıcı kaydet (Admin tarafından)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kullaniciTuru, kullaniciAdi, sifre, ad, soyad, email, telefon, kursId, bransId } = req.body;

    const hashedPassword = await bcrypt.hash(sifre, 10);

    let newUser;

    switch (kullaniciTuru) {
      case 'mudur':
        newUser = await prisma.mudur.create({
          data: {
            KursID: kursId,
            Ad: ad,
            Soyad: soyad,
            Email: email,
            Telefon: telefon,
            KullaniciAdi: kullaniciAdi,
            Sifre: hashedPassword,
            SifreDegistirildiMi: false,
          },
        });
        break;
      case 'ogretmen':
        newUser = await prisma.ogretmen.create({
          data: {
            KursID: kursId,
            BransID: bransId,
            Ad: ad,
            Soyad: soyad,
            Email: email,
            Telefon: telefon,
            KullaniciAdi: kullaniciAdi,
            Sifre: hashedPassword,
            SifreDegistirildiMi: false,
          },
        });
        break;
      case 'sekreter':
        newUser = await prisma.sekreter.create({
          data: {
            KursID: kursId,
            Ad: ad,
            Soyad: soyad,
            Email: email,
            Telefon: telefon,
            KullaniciAdi: kullaniciAdi,
            Sifre: hashedPassword,
            SifreDegistirildiMi: false,
          },
        });
        break;
      case 'kurs':
        newUser = await prisma.kurs.create({
          data: {
            KursAdi: ad,
            Email: email,
            Telefon: telefon,
            KullaniciAdi: kullaniciAdi,
            Sifre: hashedPassword,
            SifreDegistirildiMi: false,
          },
        });
        break;
      default:
        res.status(400).json({ success: false, error: 'Geçersiz kullanıcı türü' });
        return;
    }

    res.status(201).json({
      success: true,
      data: { user: newUser },
      message: 'Kullanıcı başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Kayıt işlemi başarısız' });
  }
};
