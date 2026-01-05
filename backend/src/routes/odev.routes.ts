import { Router } from 'express';
import multer from 'multer';
import {
  getTeacherHomeworks,
  getTeacherCourses,
  getTeacherClasses,
  createHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadOdevImage,
  uploadSoruImage,
  gradeHomework,
  getStudentHomeworks,
  submitHomework,
  uploadTeslimImage,
} from '../controllers/odev.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Multer config for image uploads (max 8MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// ==================== ÖĞRETMEN ROUTE'LARI ====================

// Öğretmen ödevlerini listele
router.get('/ogretmen', authorizeRoles('ogretmen', 'mudur'), getTeacherHomeworks);

// Öğretmenin derslerini getir (ödev oluştururken seçim için)
router.get('/ogretmen/dersler', authorizeRoles('ogretmen', 'mudur'), getTeacherCourses);

// Öğretmenin sınıflarını getir (hedef sınıf seçimi için)
router.get('/ogretmen/siniflar', authorizeRoles('ogretmen', 'mudur'), getTeacherClasses);

// Yeni ödev oluştur
router.post('/', authorizeRoles('ogretmen', 'mudur'), createHomework);

// Ödev güncelle
router.put('/:odevId', authorizeRoles('ogretmen', 'mudur'), updateHomework);

// Ödev sil
router.delete('/:odevId', authorizeRoles('ogretmen', 'mudur'), deleteHomework);

// ==================== SORU YÖNETİMİ ====================

// Ödevde soru ekle
router.post('/:odevId/sorular', authorizeRoles('ogretmen', 'mudur'), addQuestion);

// Soru güncelle
router.put('/sorular/:soruId', authorizeRoles('ogretmen', 'mudur'), updateQuestion);

// Soru sil
router.delete('/sorular/:soruId', authorizeRoles('ogretmen', 'mudur'), deleteQuestion);

// ==================== RESİM YÜKLEME ====================

// Ödev için resim yükle (max 8MB)
router.post('/:odevId/resim', authorizeRoles('ogretmen', 'mudur'), upload.single('resim'), uploadOdevImage);

// Soru için resim yükle (max 8MB)
router.post('/:odevId/sorular/:soruId/resim', authorizeRoles('ogretmen', 'mudur'), upload.single('resim'), uploadSoruImage);

// ==================== DEĞERLENDİRME ====================

// Ödev teslimini değerlendir
router.post('/teslim/:teslimId/degerlendir', authorizeRoles('ogretmen', 'mudur'), gradeHomework);

// ==================== ÖĞRENCİ ROUTE'LARI ====================

// Öğrenci ödevlerini listele
router.get('/ogrenci', authorizeRoles('ogrenci'), getStudentHomeworks);

// Ödev teslim et
router.post('/:odevId/teslim', authorizeRoles('ogrenci'), submitHomework);

// Öğrenci teslim resmi yükle (max 8MB)
router.post('/:odevId/teslim/resim', authorizeRoles('ogrenci'), upload.single('resim'), uploadTeslimImage);

// ==================== ORTAK ROUTE'LAR ====================

// Tek bir ödevi getir (hem öğretmen hem öğrenci)
router.get('/:odevId', getHomeworkById);

export default router;
