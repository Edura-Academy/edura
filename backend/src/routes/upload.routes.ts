import { Router } from 'express';
import multer from 'multer';
import { 
  uploadProfilePhoto, 
  deleteProfilePhoto, 
  getProfilePhoto,
  uploadDocument,
  uploadGroupPhoto,
  uploadHomeworkDocument,
  uploadCourseDocument,
  uploadStudentDocument,
  uploadStudentHomeworkFile,
  uploadSinavSoruResmi
} from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// ==================== MULTER KONFİGÜRASYONLARI ====================

// Multer konfigürasyonu - Resimler için (profil, grup fotoğrafları)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim dosyalarına izin ver
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'));
    }
  },
});

// Multer konfigürasyonu - Belgeler için (PDF, DOC, XLS, vb.)
const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Belge dosya türlerini kontrol et
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX dosyaları yüklenebilir'));
    }
  },
});

// Multer konfigürasyonu - Tüm dosyalar için (öğrenci belgeleri vb.)
const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ==================== PROFİL FOTOĞRAFI ====================

/**
 * Profil fotoğrafı yükle
 * POST /api/upload/profile/:userType/:userId
 * userType: admin | mudur | sekreter | ogretmen | ogrenci | kurs
 */
router.post(
  '/profile/:userType/:userId',
  authenticateToken,
  uploadImage.single('photo'),
  uploadProfilePhoto
);

/**
 * Profil fotoğrafını sil
 * DELETE /api/upload/profile/:userType/:userId
 */
router.delete(
  '/profile/:userType/:userId',
  authenticateToken,
  deleteProfilePhoto
);

/**
 * Profil fotoğrafını getir
 * GET /api/upload/profile/:userType/:userId
 */
router.get(
  '/profile/:userType/:userId',
  getProfilePhoto
);

// ==================== GRUP FOTOĞRAFI ====================

/**
 * Grup fotoğrafı yükle
 * POST /api/upload/group/:groupId
 * Klasör: groups/{groupId}/
 */
router.post(
  '/group/:groupId',
  authenticateToken,
  uploadImage.single('photo'),
  uploadGroupPhoto
);

// ==================== ÖDEV BELGELERİ ====================

/**
 * Ödev belgesi yükle (ödevId olmadan - genel)
 * POST /api/upload/homework/:kursId
 * Klasör: courses/{kursId}/odevler/
 */
router.post(
  '/homework/:kursId',
  authenticateToken,
  uploadAny.single('document'),
  uploadHomeworkDocument
);

/**
 * Ödev belgesi yükle (ödevId ile - spesifik ödev için)
 * POST /api/upload/homework/:kursId/:odevId
 * Klasör: courses/{kursId}/odevler/{odevId}/
 */
router.post(
  '/homework/:kursId/:odevId',
  authenticateToken,
  uploadAny.single('document'),
  uploadHomeworkDocument
);

// ==================== KURS BELGELERİ ====================

/**
 * Kurs belgesi yükle
 * POST /api/upload/course/:kursId/document
 * Klasör: courses/{kursId}/belgeler/
 */
router.post(
  '/course/:kursId/document',
  authenticateToken,
  uploadAny.single('document'),
  uploadCourseDocument
);

// ==================== ÖĞRENCİ BELGELERİ ====================

/**
 * Öğrenci belgesi yükle
 * POST /api/upload/student/:ogrenciId/document
 * Klasör: students/{ogrenciId}/belgeler/
 */
router.post(
  '/student/:ogrenciId/document',
  authenticateToken,
  uploadAny.single('document'),
  uploadStudentDocument
);

/**
 * Öğrenci ödev teslim dosyası yükle (PDF, DOC, DOCX, resim vb.)
 * POST /api/upload/student/:ogrenciId/homework/:odevId
 * Klasör: students/{ogrenciId}/odevler/{odevId}/
 */
router.post(
  '/student/:ogrenciId/homework/:odevId',
  authenticateToken,
  uploadAny.single('file'),
  uploadStudentHomeworkFile
);

// ==================== GENEL BELGE YÜKLEME ====================

/**
 * Genel belge yükle (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
 * POST /api/upload/document
 * Body: { documentType: 'odev' | 'sinav' | 'rapor' | 'diger' }
 * Klasör: documents/{documentType}/
 */
router.post(
  '/document',
  authenticateToken,
  uploadDoc.single('document'),
  uploadDocument
);

// ==================== SINAV SORU RESMİ ====================

/**
 * Online sınav soru resmi yükle
 * POST /api/upload/sinav/soru-resmi
 * Klasör: sinavlar/{year}/sorular/
 */
router.post(
  '/sinav/soru-resmi',
  authenticateToken,
  uploadImage.single('image'),
  uploadSinavSoruResmi
);

// ==================== MATERYAL YÜKLEME ====================

/**
 * Materyal dosyası yükle (öğretmen materyalleri için)
 * POST /api/upload/materyal
 * Klasör: materyaller/{year}/
 * Desteklenen türler: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, resimler, videolar
 */
router.post(
  '/materyal',
  authenticateToken,
  uploadAny.single('file'),
  async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Dosya bulunamadı',
        });
      }

      // Boyut kontrolü (50MB)
      if (file.size > 50 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Dosya boyutu 50MB\'dan küçük olmalıdır.',
        });
      }

      // Firebase'e yükle
      const { uploadToFirebase } = require('../services/upload.service');
      const currentYear = new Date().getFullYear();
      const folder = `materyaller/${currentYear}`;
      
      const uploadResult = await uploadToFirebase(file, folder);

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          error: uploadResult.error,
        });
      }

      return res.json({
        success: true,
        message: 'Dosya başarıyla yüklendi',
        url: uploadResult.url,
        data: {
          url: uploadResult.url,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
      });
    } catch (error) {
      console.error('Materyal upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Dosya yüklenirken bir hata oluştu',
      });
    }
  }
);

export default router;
