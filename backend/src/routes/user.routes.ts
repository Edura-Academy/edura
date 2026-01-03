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
} from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// Kullanıcılar
router.get('/', getUsers);
router.get('/stats', getStats);
router.get('/:id', getUser);
router.post('/', authorizeRoles('admin', 'mudur'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('admin', 'mudur', 'sekreter'), deleteUser);

// Kurslar
router.get('/kurslar', getKurslar);
router.post('/kurslar', authorizeRoles('admin'), createKurs);

// Sınıflar
router.get('/siniflar', getSiniflar);
router.get('/siniflar/:id', getSinif);
router.post('/siniflar', authorizeRoles('admin', 'mudur'), createSinif);
router.put('/siniflar/:id', authorizeRoles('admin', 'mudur'), updateSinif);
router.delete('/siniflar/:id', authorizeRoles('admin', 'mudur'), deleteSinif);

// Push Notification Token
router.post('/fcm-token', saveFcmToken);
router.delete('/fcm-token', removeFcmToken);

export default router;
