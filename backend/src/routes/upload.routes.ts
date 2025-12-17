import { Router } from 'express';
import multer from 'multer';
import { uploadProfilePhoto, deleteProfilePhoto, getProfilePhoto } from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Multer konfigürasyonu - memory storage (dosya buffer'da tutulur)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
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

// Profil fotoğrafı yükle
// POST /api/upload/profile/:userType/:userId
router.post(
  '/profile/:userType/:userId',
  authenticateToken,
  upload.single('photo'),
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

export default router;
