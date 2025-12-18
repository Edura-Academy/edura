import { Router } from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  getExams,
  createExam,
  addExamResult,
} from '../controllers/course.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.use(authenticateToken);

// Dersler
router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authorizeRoles('admin', 'mudur', 'ogretmen'), createCourse);
router.put('/:id', authorizeRoles('admin', 'mudur', 'ogretmen'), updateCourse);
router.delete('/:id', authorizeRoles('admin', 'mudur'), deleteCourse);

// Ders kayıtları
router.post('/enroll', authorizeRoles('admin', 'mudur', 'sekreter'), enrollStudent);

// Sınavlar
router.get('/exams', getExams);
router.post('/exams', authorizeRoles('admin', 'mudur', 'ogretmen'), createExam);
router.post('/exams/result', authorizeRoles('admin', 'mudur', 'ogretmen'), addExamResult);

export default router;
