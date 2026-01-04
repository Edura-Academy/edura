import { Router } from 'express';
import multer from 'multer';
import {
  // Müdür
  createKurumIciDeneme,
  getKurumIciDenemeler,
  getKurumIciDenemeDetay,
  ataSoruPaketiOgretmen,
  onaylaSoruPaketi,
  yayinlaKurumIciDeneme,
  // Öğretmen
  getOgretmenSoruPaketleri,
  updateSoruPaketi,
  tamamlaSoruPaketi,
  uploadSoruResmi,
  deleteSoruResmi,
  // Öğrenci
  getAktifDenemeler,
  baslatDeneme,
  bitirDeneme,
  // PDF
  getDenemePdfData,
  downloadDenemePDF,
  downloadOptikFormPDF,
  // Config
  getBransConfig
} from '../controllers/kurumIciDeneme.controller';
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

// ==================== BRANŞ CONFIG ====================

// Sınav türüne göre branş ve soru sayılarını al
router.get('/config/:tur', authenticateToken, getBransConfig);

// ==================== MÜDÜR ====================

// Deneme yönetimi
router.post('/', authenticateToken, authorizeRoles('mudur'), createKurumIciDeneme);
router.get('/', authenticateToken, authorizeRoles('mudur', 'ogretmen'), getKurumIciDenemeler);
router.get('/:denemeId', authenticateToken, authorizeRoles('mudur', 'ogretmen'), getKurumIciDenemeDetay);
router.post('/:denemeId/yayinla', authenticateToken, authorizeRoles('mudur'), yayinlaKurumIciDeneme);

// Öğretmen atama ve onay
router.post('/paket/ata', authenticateToken, authorizeRoles('mudur'), ataSoruPaketiOgretmen);
router.post('/paket/:paketId/onayla', authenticateToken, authorizeRoles('mudur'), onaylaSoruPaketi);

// PDF export
router.get('/:denemeId/pdf-data', authenticateToken, authorizeRoles('mudur', 'ogretmen'), getDenemePdfData);
router.get('/:denemeId/pdf/indir', authenticateToken, authorizeRoles('mudur', 'ogretmen'), downloadDenemePDF);
router.get('/:denemeId/optik-form', authenticateToken, authorizeRoles('mudur', 'ogretmen'), downloadOptikFormPDF);

// ==================== ÖĞRETMEN ====================

// Soru paketleri
router.get('/ogretmen/paketler', authenticateToken, authorizeRoles('ogretmen'), getOgretmenSoruPaketleri);
router.put('/paket/:paketId', authenticateToken, authorizeRoles('ogretmen'), updateSoruPaketi);
router.post('/paket/:paketId/tamamla', authenticateToken, authorizeRoles('ogretmen'), tamamlaSoruPaketi);

// Soru resmi yükleme (max 8MB)
router.post('/paket/:paketId/soru/:soruId/resim', 
  authenticateToken, 
  authorizeRoles('ogretmen'), 
  upload.single('resim'),
  uploadSoruResmi
);
router.delete('/paket/:paketId/soru-resmi', 
  authenticateToken, 
  authorizeRoles('ogretmen'), 
  deleteSoruResmi
);

// ==================== ÖĞRENCİ ====================

// Deneme çözme
router.get('/ogrenci/aktif', authenticateToken, authorizeRoles('ogrenci'), getAktifDenemeler);
router.post('/ogrenci/baslat/:denemeId', authenticateToken, authorizeRoles('ogrenci'), baslatDeneme);
router.post('/ogrenci/bitir/:oturumId', authenticateToken, authorizeRoles('ogrenci'), bitirDeneme);

export default router;

