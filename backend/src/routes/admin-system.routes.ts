import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as adminSystemController from '../controllers/admin-system.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// ================== ADMİN DUYURULARI ==================

// Admin için duyuru yönetimi
router.get('/duyurular', authorize('admin'), adminSystemController.getAdminDuyurular);
router.post('/duyurular', authorize('admin'), adminSystemController.createAdminDuyuru);
router.put('/duyurular/:id', authorize('admin'), adminSystemController.updateAdminDuyuru);
router.delete('/duyurular/:id', authorize('admin'), adminSystemController.deleteAdminDuyuru);

// Müdür için duyuruları görüntüleme
router.get('/duyurular/mudur', authorize('mudur'), adminSystemController.getMudurDuyurular);
router.post('/duyurular/:id/okundu', authorize('mudur'), adminSystemController.markDuyuruAsRead);

// ================== CHANGELOG ==================

// Changelog yönetimi (Admin)
router.get('/changelog', adminSystemController.getChangelogs);
router.post('/changelog', authorize('admin'), adminSystemController.createChangelog);
router.put('/changelog/:id', authorize('admin'), adminSystemController.updateChangelog);
router.delete('/changelog/:id', authorize('admin'), adminSystemController.deleteChangelog);

// ================== DESTEK TALEPLERİ ==================

// Admin için tüm talepler
router.get('/destek', authorize('admin'), adminSystemController.getDestekTalepleri);
router.get('/destek/:id', authorize('admin', 'mudur'), adminSystemController.getDestekTalebi);
router.put('/destek/:id/durum', authorize('admin'), adminSystemController.updateDestekTalebiDurum);

// Müdür için talep yönetimi
router.get('/destek/mudur/taleplerim', authorize('mudur'), adminSystemController.getMudurDestekTalepleri);
router.post('/destek', authorize('mudur'), adminSystemController.createDestekTalebi);

// Her iki rol için cevap ekleme
router.post('/destek/:id/cevap', authorize('admin', 'mudur'), adminSystemController.addDestekCevap);

// ================== FAQ ==================

// FAQ yönetimi
router.get('/faq', adminSystemController.getFAQs);
router.post('/faq', authorize('admin'), adminSystemController.createFAQ);
router.put('/faq/:id', authorize('admin'), adminSystemController.updateFAQ);
router.delete('/faq/:id', authorize('admin'), adminSystemController.deleteFAQ);

// FAQ istatistikleri
router.post('/faq/:id/view', adminSystemController.incrementFAQView);
router.post('/faq/:id/helpful', adminSystemController.markFAQHelpful);

// ================== DASHBOARD ==================

// Sistem istatistikleri
router.get('/stats', authorize('admin'), adminSystemController.getSystemStats);

export default router;
