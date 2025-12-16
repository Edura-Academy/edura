import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

// Tüm adminleri getir
export const getAllAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        AdminID: true,
        Ad: true,
        Soyad: true,
        Email: true,
        KullaniciAdi: true,
        Telefon: true,
        AktifMi: true,
        OlusturmaTarihi: true,
      },
    });
    res.json({ success: true, data: { admins } });
  } catch (error) {
    console.error('GetAllAdmins error:', error);
    res.status(500).json({ success: false, error: 'Adminler alınamadı' });
  }
};

// Tüm kursları getir
export const getAllKurslar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kurslar = await prisma.kurs.findMany({
      select: {
        KursID: true,
        KursAdi: true,
        Adres: true,
        Telefon: true,
        Email: true,
        KullaniciAdi: true,
        AktifMi: true,
        KayitTarihi: true,
      },
    });
    res.json({ success: true, data: { kurslar } });
  } catch (error) {
    console.error('GetAllKurslar error:', error);
    res.status(500).json({ success: false, error: 'Kurslar alınamadı' });
  }
};

// Kurs detayı
export const getKursById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const kurs = await prisma.kurs.findUnique({
      where: { KursID: parseInt(id) },
    });

    if (!kurs) {
      res.status(404).json({ success: false, error: 'Kurs bulunamadı' });
      return;
    }

    res.json({ success: true, data: { kurs } });
  } catch (error) {
    console.error('GetKursById error:', error);
    res.status(500).json({ success: false, error: 'Kurs bilgisi alınamadı' });
  }
};

// Kursa ait öğretmenler
export const getOgretmenlerByKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;
    const ogretmenler = await prisma.ogretmen.findMany({
      where: { KursID: parseInt(kursId) },
      select: {
        OgretmenID: true,
        Ad: true,
        Soyad: true,
        Email: true,
        Telefon: true,
        BransID: true,
        EgitimKocuMu: true,
        AktifMi: true,
      },
    });
    res.json({ success: true, data: { ogretmenler } });
  } catch (error) {
    console.error('GetOgretmenlerByKurs error:', error);
    res.status(500).json({ success: false, error: 'Öğretmenler alınamadı' });
  }
};

// Kursa ait öğrenciler
export const getOgrencilerByKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;
    const ogrenciler = await prisma.ogrenci.findMany({
      where: { KursID: parseInt(kursId) },
      select: {
        OgrenciID: true,
        Ad: true,
        Soyad: true,
        SinifID: true,
        Seviye: true,
        OkulTuru: true,
        AktifMi: true,
      },
    });
    res.json({ success: true, data: { ogrenciler } });
  } catch (error) {
    console.error('GetOgrencilerByKurs error:', error);
    res.status(500).json({ success: false, error: 'Öğrenciler alınamadı' });
  }
};

// Yeni kurs oluştur
export const createKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursAdi, adres, telefon, email, kullaniciAdi, sifre } = req.body;

    // Kullanıcı adı kontrolü
    const existingKurs = await prisma.kurs.findUnique({
      where: { KullaniciAdi: kullaniciAdi }
    });

    if (existingKurs) {
      res.status(400).json({ success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' });
      return;
    }

    const hashedPassword = await bcrypt.hash(sifre, 10);

    const kurs = await prisma.kurs.create({
      data: {
        KursAdi: kursAdi,
        Adres: adres,
        Telefon: telefon,
        Email: email,
        KullaniciAdi: kullaniciAdi,
        Sifre: hashedPassword,
        SifreDegistirildiMi: false,
        AktifMi: true,
      },
    });

    res.status(201).json({ success: true, data: { kurs }, message: 'Kurs başarıyla oluşturuldu' });
  } catch (error) {
    console.error('CreateKurs error:', error);
    res.status(500).json({ success: false, error: 'Kurs oluşturulamadı' });
  }
};

// Kurs güncelle
export const updateKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { kursAdi, adres, telefon, email, aktifMi } = req.body;

    const kurs = await prisma.kurs.update({
      where: { KursID: parseInt(id) },
      data: {
        KursAdi: kursAdi,
        Adres: adres,
        Telefon: telefon,
        Email: email,
        AktifMi: aktifMi,
      },
    });

    res.json({ success: true, data: { kurs }, message: 'Kurs başarıyla güncellendi' });
  } catch (error) {
    console.error('UpdateKurs error:', error);
    res.status(500).json({ success: false, error: 'Kurs güncellenemedi' });
  }
};

// Kurs istatistikleri
export const getKursStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;

    const [ogrenciCount, ogretmenCount, sinifCount, mudurCount, sekreterCount] = await Promise.all([
      prisma.ogrenci.count({ where: { KursID: parseInt(kursId), AktifMi: true } }),
      prisma.ogretmen.count({ where: { KursID: parseInt(kursId), AktifMi: true } }),
      prisma.sinif.count({ where: { KursID: parseInt(kursId) } }),
      prisma.mudur.count({ where: { KursID: parseInt(kursId), AktifMi: true } }),
      prisma.sekreter.count({ where: { KursID: parseInt(kursId), AktifMi: true } }),
    ]);

    res.json({
      success: true,
      data: {
        ogrenciSayisi: ogrenciCount,
        ogretmenSayisi: ogretmenCount,
        sinifSayisi: sinifCount,
        mudurSayisi: mudurCount,
        sekreterSayisi: sekreterCount,
      },
    });
  } catch (error) {
    console.error('GetKursStats error:', error);
    res.status(500).json({ success: false, error: 'Kurs istatistikleri alınamadı' });
  }
};

// Genel sistem istatistikleri (Admin için)
export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [kursCount, toplamOgrenci, toplamOgretmen, toplamMudur] = await Promise.all([
      prisma.kurs.count({ where: { AktifMi: true } }),
      prisma.ogrenci.count({ where: { AktifMi: true } }),
      prisma.ogretmen.count({ where: { AktifMi: true } }),
      prisma.mudur.count({ where: { AktifMi: true } }),
    ]);

    res.json({
      success: true,
      data: {
        kursSayisi: kursCount,
        toplamOgrenci,
        toplamOgretmen,
        toplamMudur,
      },
    });
  } catch (error) {
    console.error('GetSystemStats error:', error);
    res.status(500).json({ success: false, error: 'Sistem istatistikleri alınamadı' });
  }
};

// Tüm branşları getir
export const getAllBranslar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branslar = await prisma.brans.findMany({
      orderBy: { BransAdi: 'asc' }
    });
    res.json({ success: true, data: { branslar } });
  } catch (error) {
    console.error('GetAllBranslar error:', error);
    res.status(500).json({ success: false, error: 'Branşlar alınamadı' });
  }
};

// Tüm müdürleri getir
export const getAllMudurler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mudurler = await prisma.mudur.findMany({
      select: {
        MudurID: true,
        KursID: true,
        Ad: true,
        Soyad: true,
        Email: true,
        Telefon: true,
        KullaniciAdi: true,
        AktifMi: true,
        KayitTarihi: true,
      },
      orderBy: { KayitTarihi: 'desc' }
    });
    res.json({ success: true, data: { mudurler } });
  } catch (error) {
    console.error('GetAllMudurler error:', error);
    res.status(500).json({ success: false, error: 'Müdürler alınamadı' });
  }
};

// Tüm öğretmenleri getir
export const getAllOgretmenler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ogretmenler = await prisma.ogretmen.findMany({
      select: {
        OgretmenID: true,
        KursID: true,
        BransID: true,
        Ad: true,
        Soyad: true,
        Email: true,
        Telefon: true,
        EgitimKocuMu: true,
        KullaniciAdi: true,
        AktifMi: true,
        KayitTarihi: true,
      },
      orderBy: { KayitTarihi: 'desc' }
    });
    res.json({ success: true, data: { ogretmenler } });
  } catch (error) {
    console.error('GetAllOgretmenler error:', error);
    res.status(500).json({ success: false, error: 'Öğretmenler alınamadı' });
  }
};

// Tüm sekreterleri getir
export const getAllSekreterler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sekreterler = await prisma.sekreter.findMany({
      select: {
        SekreterID: true,
        KursID: true,
        Ad: true,
        Soyad: true,
        Email: true,
        Telefon: true,
        KullaniciAdi: true,
        AktifMi: true,
        KayitTarihi: true,
      },
      orderBy: { KayitTarihi: 'desc' }
    });
    res.json({ success: true, data: { sekreterler } });
  } catch (error) {
    console.error('GetAllSekreterler error:', error);
    res.status(500).json({ success: false, error: 'Sekreterler alınamadı' });
  }
};

// Placeholder fonksiyonlar (eski route'lar için)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

// Profil güncelle (Admin)
export const updateProfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { ad, soyad, email, telefon, profilFoto } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    if (userRole === 'ADMIN') {
      await prisma.admin.update({
        where: { AdminID: userId },
        data: {
          Ad: ad,
          Soyad: soyad,
          Email: email,
          Telefon: telefon,
        },
      });
    } else if (userRole === 'KURS') {
      await prisma.kurs.update({
        where: { KursID: userId },
        data: {
          Email: email,
          Telefon: telefon,
        },
      });
    } else if (userRole === 'MUDUR') {
      await prisma.mudur.update({
        where: { MudurID: userId },
        data: {
          Ad: ad,
          Soyad: soyad,
          Email: email,
          Telefon: telefon,
        },
      });
    } else if (userRole === 'OGRETMEN') {
      await prisma.ogretmen.update({
        where: { OgretmenID: userId },
        data: {
          Ad: ad,
          Soyad: soyad,
          Email: email,
          Telefon: telefon,
        },
      });
    } else if (userRole === 'SEKRETER') {
      await prisma.sekreter.update({
        where: { SekreterID: userId },
        data: {
          Ad: ad,
          Soyad: soyad,
          Email: email,
          Telefon: telefon,
        },
      });
    }

    res.json({ success: true, message: 'Profil başarıyla güncellendi' });
  } catch (error) {
    console.error('UpdateProfil error:', error);
    res.status(500).json({ success: false, error: 'Profil güncellenemedi' });
  }
};
