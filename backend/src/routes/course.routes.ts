import { Router } from 'express';
import {
  getAllBranslar,
  getSiniflarByKurs,
  getAllDersler,
  getDersProgrami,
  getDenemelerByKurs,
  getDenemeSonuclari,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/branslar', getAllBranslar);
router.get('/dersler', getAllDersler);

// Protected routes
router.use(authenticateToken);

// GET /api/courses/siniflar/:kursId - Kursa ait sınıflar
router.get('/siniflar/:kursId', getSiniflarByKurs);

// GET /api/courses/program/:kursId - Ders programı
router.get('/program/:kursId', getDersProgrami);

// GET /api/courses/denemeler/:kursId - Denemeler
router.get('/denemeler/:kursId', getDenemelerByKurs);

// GET /api/courses/deneme-sonuclari/:denemeId - Deneme sonuçları
router.get('/deneme-sonuclari/:denemeId', getDenemeSonuclari);

// Eski endpoint'ler (placeholder)
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), createCourse);
router.put('/:id', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), updateCourse);
router.delete('/:id', authorizeRoles('ADMIN', 'MUDUR'), deleteCourse);

export default router;
