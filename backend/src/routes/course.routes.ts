import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/courses - Tüm kursları getir (Public)
router.get('/', getAllCourses);

// GET /api/courses/:id - Kurs detayı (Public)
router.get('/:id', getCourseById);

// POST /api/courses - Yeni kurs oluştur (Öğretmen, Müdür, Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MUDUR, UserRole.OGRETMEN),
  createCourse
);

// PUT /api/courses/:id - Kurs güncelle (Öğretmen, Müdür, Admin)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MUDUR, UserRole.OGRETMEN),
  updateCourse
);

// DELETE /api/courses/:id - Kurs sil (Sadece Admin ve Müdür)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MUDUR),
  deleteCourse
);

export default router;

