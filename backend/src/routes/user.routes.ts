import { Router } from 'express';
import { 
  getAllAdmins, 
  getAllKurslar, 
  getKursById,
  getOgretmenlerByKurs,
  getOgrencilerByKurs,
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// GET /api/users/admins - Tüm adminleri getir (Sadece Admin)
router.get('/admins', authorizeRoles('ADMIN'), getAllAdmins);

// GET /api/users/kurslar - Tüm kursları getir (Admin)
router.get('/kurslar', authorizeRoles('ADMIN'), getAllKurslar);

// GET /api/users/kurslar/:id - Kurs detayı
router.get('/kurslar/:id', getKursById);

// GET /api/users/kurslar/:kursId/ogretmenler - Kursa ait öğretmenler
router.get('/kurslar/:kursId/ogretmenler', getOgretmenlerByKurs);

// GET /api/users/kurslar/:kursId/ogrenciler - Kursa ait öğrenciler
router.get('/kurslar/:kursId/ogrenciler', getOgrencilerByKurs);

// Eski endpoint'ler (placeholder)
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('ADMIN'), deleteUser);

export default router;
