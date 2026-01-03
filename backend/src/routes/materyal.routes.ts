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
  getMateryalIstatistikleri
} from '../controllers/materyal.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
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

// ==================== ÖĞRENCİ ROUTE'LARI ====================

// Öğrencinin materyalleri
router.get(
  '/ogrenci/liste',
  authorizeRoles('ogrenci'),
  getOgrenciMateryalleri
);

// ==================== GENEL ROUTE'LAR ====================

// Materyal detayı
router.get('/:id', getMateryalById);

// Materyal indir
router.post('/:id/indir', downloadMateryal);

export default router;

