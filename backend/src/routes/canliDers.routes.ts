import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  createCanliDers,
  getOgretmenCanliDersleri,
  getCanliDersById,
  updateCanliDers,
  startCanliDers,
  endCanliDers,
  cancelCanliDers,
  deleteCanliDers,
  getKatilimIstatistikleri,
  getOgrenciCanliDersleri,
  joinCanliDers,
  leaveCanliDers,
  getOgrenciKatilimGecmisi,
  getAktifDersler,
  getYaklasanDersler
} from '../controllers/canliDers.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// ==================== GENEL ROUTE'LAR ====================

// Aktif dersler (herkes görebilir)
router.get('/aktif', getAktifDersler);

// Yaklaşan dersler (herkes görebilir)
router.get('/yaklasan', getYaklasanDersler);

// Canlı ders detayı (herkes görebilir - yetki kontrolü controller'da)
router.get('/:id', getCanliDersById);

// ==================== ÖĞRETMEN ROUTE'LARI ====================

// Öğretmenin canlı dersleri
router.get(
  '/ogretmen/liste',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getOgretmenCanliDersleri
);

// Canlı ders oluştur
router.post(
  '/',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  createCanliDers
);

// Canlı ders güncelle
router.put(
  '/:id',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  updateCanliDers
);

// Canlı dersi başlat
router.post(
  '/:id/baslat',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  startCanliDers
);

// Canlı dersi bitir
router.post(
  '/:id/bitir',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  endCanliDers
);

// Canlı dersi iptal et
router.post(
  '/:id/iptal',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  cancelCanliDers
);

// Canlı dersi sil
router.delete(
  '/:id',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  deleteCanliDers
);

// Katılım istatistikleri
router.get(
  '/:id/istatistikler',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getKatilimIstatistikleri
);

// ==================== ÖĞRENCİ ROUTE'LARI ====================

// Öğrencinin canlı dersleri
router.get(
  '/ogrenci/liste',
  authorizeRoles('ogrenci'),
  getOgrenciCanliDersleri
);

// Derse katıl
router.post(
  '/:id/katil',
  authorizeRoles('ogrenci'),
  joinCanliDers
);

// Dersten çık
router.post(
  '/:id/cik',
  authorizeRoles('ogrenci'),
  leaveCanliDers
);

// Katılım geçmişi
router.get(
  '/ogrenci/katilim-gecmisi',
  authorizeRoles('ogrenci'),
  getOgrenciKatilimGecmisi
);

export default router;

