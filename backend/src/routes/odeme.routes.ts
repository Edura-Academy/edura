import { Router } from 'express';
import {
  createOdemePlani,
  getOdemePlanlari,
  getOgrenciOdemeDurumu,
  processCardPayment,
  threeDSCallback,
  recordManualPayment,
  refundPayment,
  getOdemeRaporu,
  getInstallmentOptions,
  getTestCards
} from '../controllers/odeme.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// ==================== ÖDEME PLANI ====================

// Ödeme planı oluştur (Personel)
router.post('/plan', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), createOdemePlani);

// Ödeme planlarını listele (Personel)
router.get('/planlar', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter', 'ogretmen'), getOdemePlanlari);

// ==================== ÖĞRENCİ/VELİ ====================

// Öğrencinin ödeme durumu
router.get('/durum', authenticateToken, authorizeRoles('ogrenci'), getOgrenciOdemeDurumu);
router.get('/durum/:ogrenciId', authenticateToken, authorizeRoles('veli', 'admin', 'mudur', 'sekreter'), getOgrenciOdemeDurumu);

// Kredi kartı ile ödeme
router.post('/kart', authenticateToken, authorizeRoles('ogrenci', 'veli'), processCardPayment);

// 3DS Callback (public)
router.post('/3ds-callback', threeDSCallback);

// Taksit seçenekleri
router.get('/taksit', authenticateToken, getInstallmentOptions);

// ==================== PERSONEL ====================

// Manuel ödeme kaydet (Nakit/Havale)
router.post('/manuel', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), recordManualPayment);

// Ödeme iade
router.post('/iade', authenticateToken, authorizeRoles('admin', 'mudur'), refundPayment);

// Ödeme raporu
router.get('/rapor', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), getOdemeRaporu);

// ==================== DEV ====================

// Test kartları (development only)
router.get('/test-kartlar', authenticateToken, getTestCards);

export default router;

