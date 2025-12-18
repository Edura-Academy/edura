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
  getStats,
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
router.delete('/:id', authorizeRoles('admin'), deleteUser);

// Kurslar
router.get('/kurslar', getKurslar);
router.post('/kurslar', authorizeRoles('admin'), createKurs);

// Sınıflar
router.get('/siniflar', getSiniflar);

export default router;
