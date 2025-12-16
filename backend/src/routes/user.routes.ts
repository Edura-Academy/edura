import { Router } from 'express';
import { 
  getAllAdmins, 
  getAllKurslar, 
  getKursById,
  getOgretmenlerByKurs,
  getOgrencilerByKurs,
  createKurs,
  updateKurs,
  getKursStats,
  getSystemStats,
  getAllBranslar,
  getAllMudurler,
  getAllOgretmenler,
  getAllSekreterler,
  updateProfil,
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

// POST /api/users/kurslar - Yeni kurs oluştur (Admin)
router.post('/kurslar', authorizeRoles('ADMIN'), createKurs);

// GET /api/users/kurslar/:id - Kurs detayı
router.get('/kurslar/:id', getKursById);

// PUT /api/users/kurslar/:id - Kurs güncelle (Admin)
router.put('/kurslar/:id', authorizeRoles('ADMIN'), updateKurs);

// GET /api/users/kurslar/:kursId/stats - Kurs istatistikleri
router.get('/kurslar/:kursId/stats', getKursStats);

// GET /api/users/kurslar/:kursId/ogretmenler - Kursa ait öğretmenler
router.get('/kurslar/:kursId/ogretmenler', getOgretmenlerByKurs);

// GET /api/users/kurslar/:kursId/ogrenciler - Kursa ait öğrenciler
router.get('/kurslar/:kursId/ogrenciler', getOgrencilerByKurs);

// GET /api/users/stats - Sistem istatistikleri (Admin)
router.get('/stats', authorizeRoles('ADMIN'), getSystemStats);

// GET /api/users/branslar - Tüm branşlar
router.get('/branslar', getAllBranslar);

// GET /api/users/mudurler - Tüm müdürler (Admin)
router.get('/mudurler', authorizeRoles('ADMIN'), getAllMudurler);

// GET /api/users/ogretmenler - Tüm öğretmenler (Admin)
router.get('/ogretmenler', authorizeRoles('ADMIN'), getAllOgretmenler);

// GET /api/users/sekreterler - Tüm sekreterler (Admin)
router.get('/sekreterler', authorizeRoles('ADMIN'), getAllSekreterler);

// PUT /api/users/profil - Profil güncelle
router.put('/profil', updateProfil);

// Eski endpoint'ler (placeholder)
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('ADMIN'), deleteUser);

export default router;
