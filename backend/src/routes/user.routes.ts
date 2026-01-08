import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getKurslar,
  createKurs,
  getSiniflar,
  getSinif,
  createSinif,
  updateSinif,
  deleteSinif,
  getStats,
  saveFcmToken,
  removeFcmToken,
  validatePassword,
  changePassword,
  bulkImportUsers,
  getImportTemplate,
  getProfile,
  updateProfile,
  searchUsers,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// Kullanıcılar - Genel
router.get('/', getUsers);
router.get('/stats', getStats);

// Bildirimler
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsAsRead);
router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);

// Profil yönetimi
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Şifre yönetimi
router.post('/sifre/kontrol', validatePassword);
router.post('/sifre/degistir', changePassword);

// Kullanıcı arama
router.get('/ara', searchUsers);

// Toplu import
router.get('/import/sablon', authorizeRoles('admin', 'mudur', 'sekreter'), getImportTemplate);
router.post('/import', authorizeRoles('admin', 'mudur', 'sekreter'), bulkImportUsers);

// Kurslar (spesifik route'lar /:id'den ÖNCE gelmeli)
router.get('/kurslar', getKurslar);
router.post('/kurslar', authorizeRoles('admin'), createKurs);

// Sınıflar (spesifik route'lar /:id'den ÖNCE gelmeli)
router.get('/siniflar', getSiniflar);
router.get('/siniflar/:id', getSinif);
router.post('/siniflar', authorizeRoles('admin', 'mudur'), createSinif);
router.put('/siniflar/:id', authorizeRoles('admin', 'mudur'), updateSinif);
router.delete('/siniflar/:id', authorizeRoles('admin', 'mudur'), deleteSinif);

// Push Notification Token
router.post('/fcm-token', saveFcmToken);
router.delete('/fcm-token', removeFcmToken);

// Kullanıcı CRUD - Dinamik route'lar EN SONDA olmalı
router.get('/:id', getUser);
router.post('/', authorizeRoles('admin', 'mudur'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('admin', 'mudur', 'sekreter'), deleteUser);

export default router;
