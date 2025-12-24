import { Router } from 'express';
import multer from 'multer';
import { 
  uploadProfilePhoto, 
  deleteProfilePhoto, 
  getProfilePhoto,
  uploadDocument,
  uploadGroupPhoto
} from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

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

// ==================== PROFİL FOTOĞRAFI ====================

// Profil fotoğrafı yükle
// POST /api/upload/profile/:userType/:userId
router.post(
  '/profile/:userType/:userId',
  authenticateToken,
  uploadImage.single('photo'),
  uploadProfilePhoto
);

// Profil fotoğrafını sil
// DELETE /api/upload/profile/:userType/:userId
router.delete(
  '/profile/:userType/:userId',
  authenticateToken,
  deleteProfilePhoto
);

// Profil fotoğrafını getir
// GET /api/upload/profile/:userType/:userId
router.get(
  '/profile/:userType/:userId',
  getProfilePhoto
);

// ==================== GRUP FOTOĞRAFI ====================

// Grup fotoğrafı yükle
// POST /api/upload/group/:groupId
router.post(
  '/group/:groupId',
  authenticateToken,
  uploadImage.single('photo'),
  uploadGroupPhoto
);

// ==================== BELGE YÜKLEME ====================

// Belge yükle (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
// POST /api/upload/document
// Body: { documentType: 'odev' | 'sinav' | 'rapor' | 'diger' }
router.post(
  '/document',
  authenticateToken,
  uploadDoc.single('document'),
  uploadDocument
);

export default router;
