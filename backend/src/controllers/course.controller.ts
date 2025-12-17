import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

// Dersleri getir
export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sinifId, ogretmenId } = req.query;

    const courses = await prisma.course.findMany({
      where: {
        ...(sinifId && { sinifId: sinifId as string }),
        ...(ogretmenId && { ogretmenId: ogretmenId as string }),
        aktif: true,
      },
      include: {
        sinif: true,
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
          },
        },
        _count: {
          select: {
            kayitlar: true,
            sinavlar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, error: 'Dersler getirilemedi' });
  }
};

// Tek ders getir
export const getCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        sinif: true,
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
          },
        },
        kayitlar: {
          include: {
            ogrenci: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                email: true,
              },
            },
          },
        },
        sinavlar: true,
      },
    });

    if (!course) {
      res.status(404).json({ success: false, error: 'Ders bulunamadı' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, error: 'Ders getirilemedi' });
  }
};

// Ders oluştur
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ad, aciklama, sinifId, ogretmenId, gun, baslangicSaati, bitisSaati } = req.body;

    const course = await prisma.course.create({
      data: {
        ad,
        aciklama,
        sinifId,
        ogretmenId,
        gun,
        baslangicSaati,
        bitisSaati,
      },
      include: {
        sinif: true,
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, error: 'Ders oluşturulamadı' });
  }
};

// Ders güncelle
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ad, aciklama, sinifId, ogretmenId, gun, baslangicSaati, bitisSaati, aktif } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(ad && { ad }),
        ...(aciklama && { aciklama }),
        ...(sinifId && { sinifId }),
        ...(ogretmenId && { ogretmenId }),
        ...(gun && { gun }),
        ...(baslangicSaati && { baslangicSaati }),
        ...(bitisSaati && { bitisSaati }),
        ...(aktif !== undefined && { aktif }),
      },
      include: {
        sinif: true,
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
    });

    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, error: 'Ders güncellenemedi' });
  }
};

// Ders sil
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.course.update({
      where: { id },
      data: { aktif: false },
    });

    res.json({ success: true, message: 'Ders silindi' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, error: 'Ders silinemedi' });
  }
};

// Öğrenciyi derse kaydet
export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, ogrenciId } = req.body;

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        ogrenciId,
      },
      include: {
        course: true,
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ success: false, error: 'Kayıt işlemi başarısız' });
  }
};

// Sınavları getir
export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;

    const exams = await prisma.exam.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
      },
      include: {
        course: true,
        _count: {
          select: { sonuclar: true },
        },
      },
      orderBy: { tarih: 'desc' },
    });

    res.json({ success: true, data: exams });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, error: 'Sınavlar getirilemedi' });
  }
};

// Sınav oluştur
export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ad, tip, courseId, tarih, sure, toplamPuan, aciklama } = req.body;

    const exam = await prisma.exam.create({
      data: {
        ad,
        tip,
        courseId,
        tarih: new Date(tarih),
        sure,
        toplamPuan,
        aciklama,
      },
      include: {
        course: true,
      },
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ success: false, error: 'Sınav oluşturulamadı' });
  }
};

// Sınav sonucu ekle
export const addExamResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, ogrenciId, puan, dogru, yanlis, bos } = req.body;

    const yuzde = (puan / 100) * 100; // Basit yüzde hesabı

    const result = await prisma.examResult.create({
      data: {
        examId,
        ogrenciId,
        puan,
        dogru,
        yanlis,
        bos,
        yuzde,
      },
      include: {
        exam: true,
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Add exam result error:', error);
    res.status(500).json({ success: false, error: 'Sonuç eklenemedi' });
  }
};
