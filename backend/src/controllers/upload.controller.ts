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

    // Dosya boyutu kontrolü (8MB)
    if (file.size > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu 8MB\'dan büyük olamaz',
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

/**
 * Belge yükle (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { documentType, userId, userType } = req.body;

    // Dosya kontrolü
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Dosya bulunamadı',
      });
    }

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu 10MB\'dan büyük olamaz',
      });
    }

    // Dosya türü kontrolü
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Sadece PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX dosyaları yüklenebilir',
      });
    }

    // Firebase'e yükle
    const folder = documentType ? `documents/${documentType}` : 'documents';
    const uploadResult = await uploadToFirebase(file, folder);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error,
      });
    }

    return res.json({
      success: true,
      message: 'Belge başarıyla yüklendi',
      data: {
        url: uploadResult.url,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({
      success: false,
      error: 'Belge yüklenirken bir hata oluştu',
    });
  }
};

/**
 * Grup fotoğrafı yükle
 */
export const uploadGroupPhoto = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { groupId } = req.params;

    // Dosya kontrolü
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Dosya bulunamadı',
      });
    }

    // Dosya boyutu kontrolü (8MB)
    if (file.size > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu 8MB\'dan büyük olamaz',
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

    // Firebase'e yükle
    const uploadResult = await uploadToFirebase(file, 'group-photos');

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error,
      });
    }

    return res.json({
      success: true,
      message: 'Grup fotoğrafı başarıyla yüklendi',
      data: {
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Upload group photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Grup fotoğrafı yüklenirken bir hata oluştu',
    });
  }
};
