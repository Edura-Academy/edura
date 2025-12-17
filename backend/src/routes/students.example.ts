// Örnek Student Routes Implementation
// Bu dosya backend geliştirme için referans olarak kullanılacak

import express from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/students/:id/dashboard
 * Öğrenci dashboard verilerini getir
 */
router.get('/:id/dashboard', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Prisma ile veritabanından veri çek
    const dashboardData = {
      ogrenci: {
        // User tablosundan
        id,
        ad: 'Ahmet',
        soyad: 'Yılmaz',
        email: 'ahmet@example.com',
        sinif: '8-A',
        ogrenciNo: '20240001',
      },
      dersler: [
        // CourseEnrollment join Course join User (teacher)
      ],
      sinavSonuclari: [
        // ExamResult join Exam
      ],
      mesajlar: [
        // Message where alanId = userId
      ],
      bildirimler: [
        // Notification where userId = userId
      ],
      devamsizliklar: [
        // Devamsizlik where ogrenciId = userId
      ],
      istatistikler: {
        toplamDers: 6,
        devamsizlikSayisi: 2,
        ortalamaPuan: 82.5,
        sinavSayisi: 6,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard verisi alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

/**
 * GET /api/students/:id/courses
 * Öğrencinin kayıtlı olduğu dersleri getir
 */
router.get('/:id/courses', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Prisma query
    // const courses = await prisma.courseEnrollment.findMany({
    //   where: { ogrenciId: id, aktif: true },
    //   include: {
    //     course: {
    //       include: {
    //         ogretmen: true,
    //         sinif: true,
    //       },
    //     },
    //   },
    // });

    res.json({ courses: [] });
  } catch (error) {
    console.error('Dersler alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

/**
 * GET /api/students/:id/exam-results
 * Öğrencinin sınav sonuçlarını getir
 */
router.get('/:id/exam-results', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Prisma query
    // const results = await prisma.examResult.findMany({
    //   where: { ogrenciId: id },
    //   include: {
    //     exam: {
    //       include: {
    //         course: true,
    //       },
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    res.json({ results: [] });
  } catch (error) {
    console.error('Sınav sonuçları alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

/**
 * GET /api/students/:id/attendance
 * Öğrencinin devamsızlık kayıtlarını getir
 */
router.get('/:id/attendance', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Prisma query
    // const attendance = await prisma.devamsizlik.findMany({
    //   where: { ogrenciId: id },
    //   include: {
    //     course: true,
    //   },
    //   orderBy: { tarih: 'desc' },
    // });

    res.json({ attendance: [] });
  } catch (error) {
    console.error('Devamsızlık kayıtları alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
