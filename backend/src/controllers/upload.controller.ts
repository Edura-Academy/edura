import { Request, Response } from 'express';
import { uploadToFirebase, deleteFromFirebase } from '../services/upload.service';
import prisma from '../lib/prisma';

// Kullanıcı türüne göre tablo ve ID alanı eşlemesi
const userTableMap: Record<string, { table: string; idField: string; photoField: string }> = {
  admin: { table: 'admin', idField: 'AdminID', photoField: 'ProfilFoto' },
  mudur: { table: 'mudur', idField: 'MudurID', photoField: 'ProfilFoto' },
  sekreter: { table: 'sekreter', idField: 'SekreterID', photoField: 'ProfilFoto' },
  ogretmen: { table: 'ogretmen', idField: 'OgretmenID', photoField: 'ProfilFoto' },
  ogrenci: { table: 'ogrenci', idField: 'OgrenciID', photoField: 'ProfilFoto' },
  kurs: { table: 'kurs', idField: 'KursID', photoField: 'Logo' },
};

/**
 * Profil fotoğrafı yükle
 */
export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const { userType, userId } = req.params;
    const file = req.file;

    // Dosya kontrolü
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Dosya bulunamadı',
      });
    }

    // Kullanıcı türü kontrolü
    const tableInfo = userTableMap[userType.toLowerCase()];
    if (!tableInfo) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kullanıcı türü',
      });
    }

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu 2MB\'dan büyük olamaz',
      });
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Sadece JPG ve PNG dosyaları yüklenebilir',
      });
    }

    // Mevcut kullanıcıyı bul
    const existingUser = await (prisma as any)[tableInfo.table].findUnique({
      where: { [tableInfo.idField]: parseInt(userId) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    // Eski fotoğrafı sil (varsa)
    if (existingUser[tableInfo.photoField]) {
      await deleteFromFirebase(existingUser[tableInfo.photoField]);
    }

    // Yeni fotoğrafı Firebase'e yükle
    const folder = userType === 'kurs' ? 'logos' : 'profiles';
    const uploadResult = await uploadToFirebase(file, folder);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error,
      });
    }

    // Veritabanını güncelle
    const updatedUser = await (prisma as any)[tableInfo.table].update({
      where: { [tableInfo.idField]: parseInt(userId) },
      data: { [tableInfo.photoField]: uploadResult.url },
    });

    return res.json({
      success: true,
      message: 'Fotoğraf başarıyla yüklendi',
      data: {
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fotoğraf yüklenirken bir hata oluştu',
    });
  }
};

/**
 * Profil fotoğrafını sil
 */
export const deleteProfilePhoto = async (req: Request, res: Response) => {
  try {
    const { userType, userId } = req.params;

    // Kullanıcı türü kontrolü
    const tableInfo = userTableMap[userType.toLowerCase()];
    if (!tableInfo) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kullanıcı türü',
      });
    }

    // Mevcut kullanıcıyı bul
    const existingUser = await (prisma as any)[tableInfo.table].findUnique({
      where: { [tableInfo.idField]: parseInt(userId) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    // Fotoğraf yoksa
    if (!existingUser[tableInfo.photoField]) {
      return res.status(400).json({
        success: false,
        error: 'Silinecek fotoğraf bulunamadı',
      });
    }

    // Firebase'den sil
    await deleteFromFirebase(existingUser[tableInfo.photoField]);

    // Veritabanını güncelle
    await (prisma as any)[tableInfo.table].update({
      where: { [tableInfo.idField]: parseInt(userId) },
      data: { [tableInfo.photoField]: null },
    });

    return res.json({
      success: true,
      message: 'Fotoğraf başarıyla silindi',
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fotoğraf silinirken bir hata oluştu',
    });
  }
};

/**
 * Profil fotoğrafını getir
 */
export const getProfilePhoto = async (req: Request, res: Response) => {
  try {
    const { userType, userId } = req.params;

    // Kullanıcı türü kontrolü
    const tableInfo = userTableMap[userType.toLowerCase()];
    if (!tableInfo) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kullanıcı türü',
      });
    }

    // Kullanıcıyı bul
    const user = await (prisma as any)[tableInfo.table].findUnique({
      where: { [tableInfo.idField]: parseInt(userId) },
      select: { [tableInfo.photoField]: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    return res.json({
      success: true,
      data: {
        url: user[tableInfo.photoField] || null,
      },
    });
  } catch (error) {
    console.error('Get profile photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fotoğraf alınırken bir hata oluştu',
    });
  }
};
