import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import {
  createMateryal,
  getOgretmenMateryalleri,
  updateMateryal,
  deleteMateryal,
  getOgrenciMateryalleri,
  downloadMateryal,
  getMateryalById,
  getMateryalIstatistikleri,
  createShareLink,
  downloadSharedMateryal,
  getMateryallerByDers,
  getOgrenciMateryalIlerleme,
  getMateryallerByTip
} from '../controllers/materyal.controller';

const router = Router();

// ==================== PAYLAŞIM LİNKİ (AUTH GEREKMİYOR) ====================

// Paylaşım linki ile indirme (public)
router.get('/paylas/:token', downloadSharedMateryal);

// Tüm diğer route'lar authentication gerektirir
router.use(authenticateToken);

// ==================== ÖĞRETMEN ROUTE'LARI ====================

// Öğretmenin materyalleri
router.get(
  '/ogretmen/liste',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getOgretmenMateryalleri
);

// Materyal oluştur
router.post(
  '/',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  createMateryal
);

// Materyal güncelle
router.put(
  '/:id',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  updateMateryal
);

// Materyal sil
router.delete(
  '/:id',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  deleteMateryal
);

// İstatistikler
router.get(
  '/istatistikler',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getMateryalIstatistikleri
);

// Paylaşım linki oluştur
router.post(
  '/:id/paylas',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  createShareLink
);

// Öğrenci ilerleme takibi (ders bazlı)
router.get(
  '/ilerleme/:courseId',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getOgrenciMateryalIlerleme
);

// ==================== ÖĞRENCİ ROUTE'LARI ====================

// Öğrencinin materyalleri
router.get(
  '/ogrenci/liste',
  authorizeRoles('ogrenci'),
  getOgrenciMateryalleri
);

// ==================== GENEL ROUTE'LAR ====================

// Ders bazlı gruplama (klasör görünümü)
router.get('/ders-bazli', getMateryallerByDers);

// Tip bazlı filtreleme
router.get('/tip/:tip', getMateryallerByTip);

// Materyal detayı
router.get('/:id', getMateryalById);

// Materyal indir
router.post('/:id/indir', downloadMateryal);

export default router;

