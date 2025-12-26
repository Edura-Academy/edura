import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== ÖĞRETMEN FONKSİYONLARI ====================

// Materyal yükle
export const createMateryal = async (req: Request, res: Response) => {
  try {
    const yukleyenId = (req as any).user.id;
    const { baslik, aciklama, courseId, tip, dosyaUrl, dosyaAdi, dosyaBoyutu } = req.body;

    // Dersin öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ogretmenId: yukleyenId
      }
    });

    if (!course) {
      return res.status(403).json({ error: 'Bu ders size ait değil' });
    }

    const materyal = await prisma.materyal.create({
      data: {
        baslik,
        aciklama,
        courseId,
        yukleyenId,
        tip,
        dosyaUrl,
        dosyaAdi,
        dosyaBoyutu
      },
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        }
      }
    });

    // Öğrencilere bildirim gönder
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId,
        aktif: true
      },
      select: { ogrenciId: true }
    });

    const notifications = enrollments.map(e => ({
      userId: e.ogrenciId,
      tip: 'BILDIRIM' as const,
      baslik: '📚 Yeni Materyal Eklendi',
      mesaj: `${course.ad} dersine "${baslik}" başlıklı yeni materyal eklendi.`
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.status(201).json(materyal);
  } catch (error) {
    console.error('Materyal oluşturma hatası:', error);
    res.status(500).json({ error: 'Materyal oluşturulamadı' });
  }
};

// Öğretmenin materyallerini getir
export const getOgretmenMateryalleri = async (req: Request, res: Response) => {
  try {
    const yukleyenId = (req as any).user.id;
    const { courseId } = req.query;

    const where: any = { yukleyenId };
    if (courseId) where.courseId = courseId;

    const materyaller = await prisma.materyal.findMany({
      where,
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(materyaller);
  } catch (error) {
    console.error('Materyal listesi hatası:', error);
    res.status(500).json({ error: 'Materyaller alınamadı' });
  }
};

// Materyal güncelle
export const updateMateryal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const yukleyenId = (req as any).user.id;
    const { baslik, aciklama, aktif } = req.body;

    const materyal = await prisma.materyal.findFirst({
      where: { id, yukleyenId }
    });

    if (!materyal) {
      return res.status(404).json({ error: 'Materyal bulunamadı' });
    }

    const updated = await prisma.materyal.update({
      where: { id },
      data: { baslik, aciklama, aktif }
    });

    res.json(updated);
  } catch (error) {
    console.error('Materyal güncelleme hatası:', error);
    res.status(500).json({ error: 'Materyal güncellenemedi' });
  }
};

// Materyal sil
export const deleteMateryal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const yukleyenId = (req as any).user.id;

    const materyal = await prisma.materyal.findFirst({
      where: { id, yukleyenId }
    });

    if (!materyal) {
      return res.status(404).json({ error: 'Materyal bulunamadı' });
    }

    await prisma.materyal.delete({ where: { id } });

    res.json({ message: 'Materyal silindi' });
  } catch (error) {
    console.error('Materyal silme hatası:', error);
    res.status(500).json({ error: 'Materyal silinemedi' });
  }
};

// ==================== ÖĞRENCİ FONKSİYONLARI ====================

// Öğrencinin görebileceği materyalleri getir
export const getOgrenciMateryalleri = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;
    const { courseId } = req.query;

    // Öğrencinin kayıtlı olduğu dersleri bul
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        ogrenciId,
        aktif: true
      },
      select: { courseId: true }
    });

    const courseIds = enrollments.map(e => e.courseId);

    const where: any = {
      courseId: { in: courseIds },
      aktif: true
    };

    if (courseId && courseIds.includes(courseId as string)) {
      where.courseId = courseId;
    }

    const materyaller = await prisma.materyal.findMany({
      where,
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        },
        yukleyen: {
          select: {
            ad: true,
            soyad: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(materyaller);
  } catch (error) {
    console.error('Öğrenci materyal listesi hatası:', error);
    res.status(500).json({ error: 'Materyaller alınamadı' });
  }
};

// Materyal indir (indirme sayısını artır)
export const downloadMateryal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const materyal = await prisma.materyal.findUnique({
      where: { id },
      include: {
        course: true
      }
    });

    if (!materyal) {
      return res.status(404).json({ error: 'Materyal bulunamadı' });
    }

    // Yetki kontrolü - öğrenci ise kayıtlı mı kontrol et
    if (userRole === 'ogrenci') {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          ogrenciId: userId,
          courseId: materyal.courseId,
          aktif: true
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Bu materyale erişim yetkiniz yok' });
      }
    }

    // İndirme sayısını artır
    await prisma.materyal.update({
      where: { id },
      data: {
        indirmeSayisi: { increment: 1 }
      }
    });

    res.json({
      dosyaUrl: materyal.dosyaUrl,
      dosyaAdi: materyal.dosyaAdi
    });
  } catch (error) {
    console.error('Materyal indirme hatası:', error);
    res.status(500).json({ error: 'Materyal indirilemedi' });
  }
};

// Materyal detayı getir
export const getMateryalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const materyal = await prisma.materyal.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        },
        yukleyen: {
          select: {
            ad: true,
            soyad: true
          }
        }
      }
    });

    if (!materyal) {
      return res.status(404).json({ error: 'Materyal bulunamadı' });
    }

    res.json(materyal);
  } catch (error) {
    console.error('Materyal detay hatası:', error);
    res.status(500).json({ error: 'Materyal detayı alınamadı' });
  }
};

// ==================== İSTATİSTİKLER ====================

// Ders bazlı materyal istatistikleri
export const getMateryalIstatistikleri = async (req: Request, res: Response) => {
  try {
    const yukleyenId = (req as any).user.id;
    const { courseId } = req.query;

    const where: any = { yukleyenId };
    if (courseId) where.courseId = courseId;

    const materyaller = await prisma.materyal.findMany({
      where,
      select: {
        id: true,
        baslik: true,
        tip: true,
        indirmeSayisi: true,
        createdAt: true,
        course: {
          select: { ad: true }
        }
      }
    });

    const toplamIndirme = materyaller.reduce((acc, m) => acc + m.indirmeSayisi, 0);
    const tipDagilimi = materyaller.reduce((acc, m) => {
      acc[m.tip] = (acc[m.tip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      toplamMateryal: materyaller.length,
      toplamIndirme,
      tipDagilimi,
      materyaller
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
};

