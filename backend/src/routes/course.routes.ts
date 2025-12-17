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
router.post('/', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), createCourse);
router.put('/:id', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), updateCourse);
router.delete('/:id', authorizeRoles('ADMIN', 'MUDUR'), deleteCourse);

// Ders kayıtları
router.post('/enroll', authorizeRoles('ADMIN', 'MUDUR', 'SEKRETER'), enrollStudent);

// Sınavlar
router.get('/exams', getExams);
router.post('/exams', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), createExam);
router.post('/exams/result', authorizeRoles('ADMIN', 'MUDUR', 'OGRETMEN'), addExamResult);

export default router;
