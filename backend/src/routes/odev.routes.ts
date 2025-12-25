import { Router } from 'express';
import {
  getTeacherHomeworks,
  createHomework,
  gradeHomework,
  getStudentHomeworks,
  submitHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  getTeacherCourses,
} from '../controllers/odev.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Öğretmen route'ları
router.get('/ogretmen', authorizeRoles('ogretmen', 'mudur'), getTeacherHomeworks);
router.get('/ogretmen/dersler', authorizeRoles('ogretmen', 'mudur'), getTeacherCourses);
router.post('/', authorizeRoles('ogretmen', 'mudur'), createHomework);
router.put('/:odevId', authorizeRoles('ogretmen', 'mudur'), updateHomework);
router.delete('/:odevId', authorizeRoles('ogretmen', 'mudur'), deleteHomework);
router.post('/teslim/:teslimId/degerlendir', authorizeRoles('ogretmen', 'mudur'), gradeHomework);

// Öğrenci route'ları
router.get('/ogrenci', authorizeRoles('ogrenci'), getStudentHomeworks);
router.post('/:odevId/teslim', authorizeRoles('ogrenci'), submitHomework);

// Ortak route'lar
router.get('/:odevId', getHomeworkById);

export default router;

