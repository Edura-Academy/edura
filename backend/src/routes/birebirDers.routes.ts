import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import {
  getOgretmenMusaitlik,
  getOgretmenBirebirDersleri,
  updateBirebirDersDurum,
  getOgrenciPaketleri,
  getOgrenciBirebirDersleri,
  getMusaitOgretmenler,
  createRandevu,
  cancelRandevu,
  getBirebirDersById,
  createSaatPaketi,
  getAllPaketler
} from '../controllers/birebirDers.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// ==================== ÖĞRETMEN ROUTE'LARI ====================

// Öğretmenin müsaitlik takvimi
router.get(
  '/ogretmen/musaitlik',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getOgretmenMusaitlik
);

// Öğretmenin birebir dersleri
router.get(
  '/ogretmen/liste',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  getOgretmenBirebirDersleri
);

// Ders durumunu güncelle
router.put(
  '/:id/durum',
  authorizeRoles('ogretmen', 'mudur', 'admin'),
  updateBirebirDersDurum
);

// ==================== ÖĞRENCİ ROUTE'LARI ====================

// Öğrencinin paketleri
router.get(
  '/ogrenci/paketler',
  authorizeRoles('ogrenci'),
  getOgrenciPaketleri
);

// Öğrencinin birebir dersleri
router.get(
  '/ogrenci/liste',
  authorizeRoles('ogrenci'),
  getOgrenciBirebirDersleri
);

// Müsait öğretmenler
router.get(
  '/ogrenci/musait-ogretmenler',
  authorizeRoles('ogrenci'),
  getMusaitOgretmenler
);

// Randevu oluştur
router.post(
  '/randevu',
  authorizeRoles('ogrenci'),
  createRandevu
);

// ==================== GENEL ROUTE'LAR ====================

// Ders detayı
router.get('/:id', getBirebirDersById);

// Randevu iptal
router.post('/:id/iptal', cancelRandevu);

// ==================== YÖNETİM ROUTE'LARI ====================

// Saat paketi ekle
router.post(
  '/paket',
  authorizeRoles('mudur', 'admin', 'sekreter'),
  createSaatPaketi
);

// Tüm paketler
router.get(
  '/yonetim/paketler',
  authorizeRoles('mudur', 'admin', 'sekreter'),
  getAllPaketler
);

export default router;

