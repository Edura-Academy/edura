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
  getTestCards,
  createKupon,
  getKuponlar,
  validateKupon,
  updateKupon,
  createBulkOdemePlani,
  postponeTaksit,
  createPaymentReminders,
  generateMakbuz,
  exportOdemeGecmisi
} from '../controllers/odeme.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

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

// ==================== KUPON YÖNETİMİ ====================

// Kupon oluştur
router.post('/kupon', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), createKupon);

// Kuponları listele
router.get('/kuponlar', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), getKuponlar);

// Kupon güncelle
router.put('/kupon/:kuponId', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), updateKupon);

// Kupon doğrula (öğrenci/veli için)
router.post('/kupon/dogrula', authenticateToken, validateKupon);

// ==================== TOPLU İŞLEMLER ====================

// Sınıf bazlı toplu ödeme planı
router.post('/plan/toplu', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), createBulkOdemePlani);

// ==================== TAKSİT ERTELEME ====================

// Taksit ertele
router.post('/taksit/:odemeId/ertele', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), postponeTaksit);

// ==================== HATIRLATMA ====================

// Ödeme hatırlatmaları gönder
router.post('/hatirlatma', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), createPaymentReminders);

// ==================== MAKBUZ / EXPORT ====================

// Makbuz oluştur
router.get('/makbuz/:odemeId', authenticateToken, generateMakbuz);

// Ödeme geçmişi export
router.get('/export', authenticateToken, authorizeRoles('admin', 'mudur', 'sekreter'), exportOdemeGecmisi);

// ==================== DEV ====================

// Test kartları (development only)
router.get('/test-kartlar', authenticateToken, getTestCards);

export default router;

