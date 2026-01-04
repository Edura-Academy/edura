import { Router } from 'express';
import {
  // Öğretmen
  createSinav,
  getOgretmenSinavlari,
  getSinavDetay,
  updateSinav,
  unpublishSinav,
  deleteSinav,
  addSoru,
  updateSoru,
  deleteSoru,
  publishSinav,
  getSinavSonuclari,
  // Öğrenci
  getAktifSinavlar,
  startSinav,
  saveCevap,
  finishSinav,
  getOgrenciSonuc,
  getOgrenciSinavGecmisi
} from '../controllers/onlineSinav.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// ==================== ÖĞRETMEN ====================

// Sınav yönetimi
router.post('/', authenticateToken, authorizeRoles('ogretmen', 'mudur'), createSinav);
router.get('/ogretmen', authenticateToken, authorizeRoles('ogretmen', 'mudur'), getOgretmenSinavlari);
router.get('/ogretmen/:sinavId', authenticateToken, authorizeRoles('ogretmen', 'mudur'), getSinavDetay);
router.put('/ogretmen/:sinavId', authenticateToken, authorizeRoles('ogretmen', 'mudur'), updateSinav);
router.delete('/ogretmen/:sinavId', authenticateToken, authorizeRoles('ogretmen', 'mudur'), deleteSinav);
router.post('/ogretmen/:sinavId/yayinla', authenticateToken, authorizeRoles('ogretmen', 'mudur'), publishSinav);
router.post('/ogretmen/:sinavId/taslak', authenticateToken, authorizeRoles('ogretmen', 'mudur'), unpublishSinav);
router.get('/ogretmen/:sinavId/sonuclar', authenticateToken, authorizeRoles('ogretmen', 'mudur'), getSinavSonuclari);

// Soru yönetimi
router.post('/ogretmen/:sinavId/soru', authenticateToken, authorizeRoles('ogretmen', 'mudur'), addSoru);
router.put('/soru/:soruId', authenticateToken, authorizeRoles('ogretmen', 'mudur'), updateSoru);
router.delete('/soru/:soruId', authenticateToken, authorizeRoles('ogretmen', 'mudur'), deleteSoru);

// ==================== ÖĞRENCİ ====================

// Aktif sınavlar
router.get('/aktif', authenticateToken, authorizeRoles('ogrenci'), getAktifSinavlar);

// Sınav çözme
router.post('/baslat/:sinavId', authenticateToken, authorizeRoles('ogrenci'), startSinav);
router.post('/cevap', authenticateToken, authorizeRoles('ogrenci'), saveCevap);
router.post('/bitir/:oturumId', authenticateToken, authorizeRoles('ogrenci'), finishSinav);

// Sonuçlar
router.get('/sonuc/:sinavId', authenticateToken, authorizeRoles('ogrenci'), getOgrenciSonuc);
router.get('/gecmis', authenticateToken, authorizeRoles('ogrenci'), getOgrenciSinavGecmisi);

export default router;

