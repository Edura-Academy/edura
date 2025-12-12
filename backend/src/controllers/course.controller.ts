import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, UserRole } from '../types';

const prisma = new PrismaClient();

// Tüm kursları getir
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, teacherId } = req.query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { courses } });
  } catch (error) {
    console.error('GetAllCourses error:', error);
    res.status(500).json({ success: false, error: 'Kurslar alınamadı' });
  }
};

// Kurs detayı
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, error: 'Kurs bulunamadı' });
      return;
    }

    res.json({ success: true, data: { course } });
  } catch (error) {
    console.error('GetCourseById error:', error);
    res.status(500).json({ success: false, error: 'Kurs bilgisi alınamadı' });
  }
};

// Yeni kurs oluştur
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, thumbnail } = req.body;

    // Öğretmen ID'sini bul
    let teacherId: string | undefined;

    if (req.user?.role === UserRole.OGRETMEN) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
      });
      teacherId = teacher?.id;
    } else {
      // Admin veya Müdür ise body'den teacherId alınabilir
      teacherId = req.body.teacherId;
    }

    if (!teacherId) {
      res.status(400).json({ success: false, error: 'Öğretmen bilgisi gerekli' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail,
        teacherId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { course },
      message: 'Kurs oluşturuldu',
    });
  } catch (error) {
    console.error('CreateCourse error:', error);
    res.status(500).json({ success: false, error: 'Kurs oluşturulamadı' });
  }
};

// Kurs güncelle
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail } = req.body;

    // Kursun sahibi mi kontrol et
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!existingCourse) {
      res.status(404).json({ success: false, error: 'Kurs bulunamadı' });
      return;
    }

    // Sadece kurs sahibi, admin veya müdür güncelleyebilir
    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.MUDUR &&
      existingCourse.teacher.userId !== req.user?.userId
    ) {
      res.status(403).json({ success: false, error: 'Bu kursu güncelleme yetkiniz yok' });
      return;
    }

    const course = await prisma.course.update({
      where: { id },
      data: { title, description, thumbnail },
    });

    res.json({ success: true, data: { course }, message: 'Kurs güncellendi' });
  } catch (error) {
    console.error('UpdateCourse error:', error);
    res.status(500).json({ success: false, error: 'Kurs güncellenemedi' });
  }
};

// Kurs sil
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.course.delete({ where: { id } });

    res.json({ success: true, message: 'Kurs silindi' });
  } catch (error) {
    console.error('DeleteCourse error:', error);
    res.status(500).json({ success: false, error: 'Kurs silinemedi' });
  }
};

