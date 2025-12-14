import { Response } from 'express';
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
