import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ==================== ÖĞRETMEN FONKSİYONLARI ====================

// Canlı ders oluştur
export const createCanliDers = async (req: Request, res: Response) => {
  try {
    const ogretmenId = (req as any).user.id;
    const {
      baslik,
      aciklama,
      courseId,
      baslangicTarihi,
      bitisTarihi,
      odaSifresi,
      kayitYapilsin,
      mikrofonAcik,
      kameraAcik,
      sohbetAcik
    } = req.body;

    // Dersin öğretmenine ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ogretmenId
      }
    });

    if (!course) {
      return res.status(403).json({ error: 'Bu ders size ait değil' });
    }

    // Benzersiz oda adı oluştur
    const odaAdi = `edura-${courseId.slice(0, 8)}-${uuidv4().slice(0, 8)}`;

    const canliDers = await prisma.canliDers.create({
      data: {
        baslik,
        aciklama,
        courseId,
        ogretmenId,
        baslangicTarihi: new Date(baslangicTarihi),
        bitisTarihi: new Date(bitisTarihi),
        odaAdi,
        odaSifresi,
        kayitYapilsin: kayitYapilsin ?? false,
        mikrofonAcik: mikrofonAcik ?? false,
        kameraAcik: kameraAcik ?? false,
        sohbetAcik: sohbetAcik ?? true,
        durum: 'PLANLANMIS'
      },
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: {
                ad: true
              }
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
      select: {
        ogrenciId: true
      }
    });

    const notifications = enrollments.map(e => ({
      userId: e.ogrenciId,
      tip: 'BILDIRIM' as const,
      baslik: '🎥 Yeni Canlı Ders Planlandı',
      mesaj: `${course.ad} dersi için "${baslik}" başlıklı canlı ders planlandı. Tarih: ${new Date(baslangicTarihi).toLocaleString('tr-TR')}`
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.status(201).json(canliDers);
  } catch (error) {
    console.error('Canlı ders oluşturma hatası:', error);
    res.status(500).json({ error: 'Canlı ders oluşturulamadı' });
  }
};

// Öğretmenin canlı derslerini getir
export const getOgretmenCanliDersleri = async (req: Request, res: Response) => {
  try {
    const ogretmenId = (req as any).user.id;
    const { durum, courseId } = req.query;

    const where: any = { ogretmenId };

    if (durum) {
      where.durum = durum;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const canliDersler = await prisma.canliDers.findMany({
      where,
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: {
                ad: true
              }
            }
          }
        },
        _count: {
          select: {
            katilimlar: true
          }
        }
      },
      orderBy: {
        baslangicTarihi: 'desc'
      }
    });

    res.json(canliDersler);
  } catch (error) {
    console.error('Canlı ders listesi hatası:', error);
    res.status(500).json({ error: 'Canlı dersler alınamadı' });
  }
};

// Canlı ders detayı getir
export const getCanliDersById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const canliDers = await prisma.canliDers.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            ad: true,
            sinif: {
              select: {
                id: true,
                ad: true
              }
            }
          }
        },
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        },
        katilimlar: {
          include: {
            ogrenci: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                ogrenciNo: true
              }
            }
          },
          orderBy: {
            girisZamani: 'desc'
          }
        }
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı' });
    }

    // Yetki kontrolü
    if (userRole === 'ogrenci') {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          ogrenciId: userId,
          courseId: canliDers.courseId,
          aktif: true
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Bu derse erişim yetkiniz yok' });
      }
    } else if (userRole === 'ogretmen' && canliDers.ogretmenId !== userId) {
      return res.status(403).json({ error: 'Bu ders size ait değil' });
    }

    res.json(canliDers);
  } catch (error) {
    console.error('Canlı ders detay hatası:', error);
    res.status(500).json({ error: 'Canlı ders detayı alınamadı' });
  }
};

// Canlı dersi güncelle
export const updateCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;
    const {
      baslik,
      aciklama,
      baslangicTarihi,
      bitisTarihi,
      odaSifresi,
      kayitYapilsin,
      mikrofonAcik,
      kameraAcik,
      sohbetAcik,
      durum
    } = req.body;

    // Dersin öğretmene ait olduğunu kontrol et
    const mevcutDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      }
    });

    if (!mevcutDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı veya size ait değil' });
    }

    const updatedDers = await prisma.canliDers.update({
      where: { id },
      data: {
        baslik,
        aciklama,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : undefined,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : undefined,
        odaSifresi,
        kayitYapilsin,
        mikrofonAcik,
        kameraAcik,
        sohbetAcik,
        durum
      },
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: {
                ad: true
              }
            }
          }
        }
      }
    });

    res.json(updatedDers);
  } catch (error) {
    console.error('Canlı ders güncelleme hatası:', error);
    res.status(500).json({ error: 'Canlı ders güncellenemedi' });
  }
};

// Canlı dersi başlat
export const startCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      },
      include: {
        course: true
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı veya size ait değil' });
    }

    if (canliDers.durum === 'AKTIF') {
      return res.status(400).json({ error: 'Ders zaten başlamış' });
    }

    if (canliDers.durum === 'SONA_ERDI') {
      return res.status(400).json({ error: 'Bu ders zaten sona ermiş' });
    }

    const updatedDers = await prisma.canliDers.update({
      where: { id },
      data: {
        durum: 'AKTIF',
        baslangicTarihi: new Date() // Gerçek başlangıç zamanını güncelle
      }
    });

    // Öğrencilere bildirim gönder
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: canliDers.courseId,
        aktif: true
      },
      select: {
        ogrenciId: true
      }
    });

    const notifications = enrollments.map(e => ({
      userId: e.ogrenciId,
      tip: 'BILDIRIM' as const,
      baslik: '🔴 Canlı Ders Başladı!',
      mesaj: `${canliDers.course.ad} dersi için "${canliDers.baslik}" başlıklı canlı ders şimdi başladı. Hemen katılın!`
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.json({
      ...updatedDers,
      joinUrl: `https://meet.jit.si/${updatedDers.odaAdi}`
    });
  } catch (error) {
    console.error('Canlı ders başlatma hatası:', error);
    res.status(500).json({ error: 'Canlı ders başlatılamadı' });
  }
};

// Canlı dersi bitir
export const endCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı veya size ait değil' });
    }

    // Açık katılımları kapat
    await prisma.canliDersKatilim.updateMany({
      where: {
        canliDersId: id,
        cikisZamani: null
      },
      data: {
        cikisZamani: new Date()
      }
    });

    // Toplam süreleri hesapla
    const katilimlar = await prisma.canliDersKatilim.findMany({
      where: { canliDersId: id }
    });

    for (const katilim of katilimlar) {
      if (katilim.girisZamani && katilim.cikisZamani) {
        const sure = Math.round(
          (new Date(katilim.cikisZamani).getTime() - new Date(katilim.girisZamani).getTime()) / 60000
        );
        await prisma.canliDersKatilim.update({
          where: { id: katilim.id },
          data: { toplamSure: sure }
        });
      }
    }

    const updatedDers = await prisma.canliDers.update({
      where: { id },
      data: {
        durum: 'SONA_ERDI',
        bitisTarihi: new Date()
      }
    });

    res.json(updatedDers);
  } catch (error) {
    console.error('Canlı ders bitirme hatası:', error);
    res.status(500).json({ error: 'Canlı ders bitirilemedi' });
  }
};

// Canlı dersi iptal et
export const cancelCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      },
      include: {
        course: true
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı veya size ait değil' });
    }

    if (canliDers.durum === 'SONA_ERDI') {
      return res.status(400).json({ error: 'Biten ders iptal edilemez' });
    }

    const updatedDers = await prisma.canliDers.update({
      where: { id },
      data: { durum: 'IPTAL' }
    });

    // Öğrencilere bildirim gönder
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: canliDers.courseId,
        aktif: true
      },
      select: {
        ogrenciId: true
      }
    });

    const notifications = enrollments.map(e => ({
      userId: e.ogrenciId,
      tip: 'BILDIRIM' as const,
      baslik: '❌ Canlı Ders İptal Edildi',
      mesaj: `${canliDers.course.ad} dersi için planlanan "${canliDers.baslik}" başlıklı canlı ders iptal edildi.`
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.json(updatedDers);
  } catch (error) {
    console.error('Canlı ders iptal hatası:', error);
    res.status(500).json({ error: 'Canlı ders iptal edilemedi' });
  }
};

// Canlı dersi sil
export const deleteCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı veya size ait değil' });
    }

    if (canliDers.durum === 'AKTIF') {
      return res.status(400).json({ error: 'Aktif ders silinemez. Önce dersi bitirin.' });
    }

    await prisma.canliDers.delete({
      where: { id }
    });

    res.json({ message: 'Canlı ders silindi' });
  } catch (error) {
    console.error('Canlı ders silme hatası:', error);
    res.status(500).json({ error: 'Canlı ders silinemedi' });
  }
};

// Katılım istatistiklerini getir
export const getKatilimIstatistikleri = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findFirst({
      where: {
        id,
        ogretmenId
      },
      include: {
        course: {
          include: {
            kayitlar: {
              where: { aktif: true },
              select: { ogrenciId: true }
            }
          }
        },
        katilimlar: {
          include: {
            ogrenci: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                ogrenciNo: true
              }
            }
          }
        }
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı' });
    }

    const toplamOgrenci = canliDers.course.kayitlar.length;
    const katilanOgrenci = new Set(canliDers.katilimlar.map(k => k.ogrenciId)).size;
    const katilimOrani = toplamOgrenci > 0 ? Math.round((katilanOgrenci / toplamOgrenci) * 100) : 0;

    // Katılmayan öğrencileri bul
    const katilanIds = new Set(canliDers.katilimlar.map(k => k.ogrenciId));
    const katilmayanIds = canliDers.course.kayitlar
      .filter(k => !katilanIds.has(k.ogrenciId))
      .map(k => k.ogrenciId);

    const katilmayanlar = await prisma.user.findMany({
      where: {
        id: { in: katilmayanIds }
      },
      select: {
        id: true,
        ad: true,
        soyad: true,
        ogrenciNo: true
      }
    });

    res.json({
      toplamOgrenci,
      katilanOgrenci,
      katilimOrani,
      katilimlar: canliDers.katilimlar,
      katilmayanlar
    });
  } catch (error) {
    console.error('Katılım istatistikleri hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
};

// ==================== ÖĞRENCİ FONKSİYONLARI ====================

// Öğrencinin katılabileceği canlı dersleri getir
export const getOgrenciCanliDersleri = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;
    const { durum } = req.query;

    // Öğrencinin kayıtlı olduğu dersleri bul
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        ogrenciId,
        aktif: true
      },
      select: {
        courseId: true
      }
    });

    const courseIds = enrollments.map(e => e.courseId);

    const where: any = {
      courseId: { in: courseIds },
      durum: { not: 'IPTAL' }
    };

    if (durum) {
      where.durum = durum;
    }

    const canliDersler = await prisma.canliDers.findMany({
      where,
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: {
                ad: true
              }
            }
          }
        },
        ogretmen: {
          select: {
            ad: true,
            soyad: true
          }
        },
        katilimlar: {
          where: {
            ogrenciId
          }
        }
      },
      orderBy: {
        baslangicTarihi: 'desc'
      }
    });

    // Her ders için katılım durumunu ekle
    const result = canliDersler.map(ders => ({
      ...ders,
      katildiMi: ders.katilimlar.length > 0,
      katilimlar: undefined
    }));

    res.json(result);
  } catch (error) {
    console.error('Öğrenci canlı ders listesi hatası:', error);
    res.status(500).json({ error: 'Canlı dersler alınamadı' });
  }
};

// Canlı derse katıl (katılım kaydı oluştur)
export const joinCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogrenciId = (req as any).user.id;

    const canliDers = await prisma.canliDers.findUnique({
      where: { id },
      include: {
        course: true
      }
    });

    if (!canliDers) {
      return res.status(404).json({ error: 'Canlı ders bulunamadı' });
    }

    // Öğrencinin derse kayıtlı olduğunu kontrol et
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        ogrenciId,
        courseId: canliDers.courseId,
        aktif: true
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Bu derse kayıtlı değilsiniz' });
    }

    if (canliDers.durum !== 'AKTIF') {
      return res.status(400).json({ error: 'Bu ders şu an aktif değil' });
    }

    // Mevcut açık katılım var mı kontrol et
    const mevcutKatilim = await prisma.canliDersKatilim.findFirst({
      where: {
        canliDersId: id,
        ogrenciId,
        cikisZamani: null
      }
    });

    if (mevcutKatilim) {
      // Zaten katılmış, join URL'i döndür
      return res.json({
        message: 'Zaten derse katıldınız',
        joinUrl: `https://meet.jit.si/${canliDers.odaAdi}`,
        odaAdi: canliDers.odaAdi,
        odaSifresi: canliDers.odaSifresi
      });
    }

    // Yeni katılım kaydı oluştur
    await prisma.canliDersKatilim.create({
      data: {
        canliDersId: id,
        ogrenciId
      }
    });

    res.json({
      message: 'Derse katılım kaydedildi',
      joinUrl: `https://meet.jit.si/${canliDers.odaAdi}`,
      odaAdi: canliDers.odaAdi,
      odaSifresi: canliDers.odaSifresi
    });
  } catch (error) {
    console.error('Derse katılma hatası:', error);
    res.status(500).json({ error: 'Derse katılınamadı' });
  }
};

// Canlı dersten çık (katılım kaydını kapat)
export const leaveCanliDers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogrenciId = (req as any).user.id;

    // Açık katılım kaydını bul
    const katilim = await prisma.canliDersKatilim.findFirst({
      where: {
        canliDersId: id,
        ogrenciId,
        cikisZamani: null
      }
    });

    if (!katilim) {
      return res.status(404).json({ error: 'Aktif katılım bulunamadı' });
    }

    const cikisZamani = new Date();
    const toplamSure = Math.round(
      (cikisZamani.getTime() - new Date(katilim.girisZamani).getTime()) / 60000
    );

    await prisma.canliDersKatilim.update({
      where: { id: katilim.id },
      data: {
        cikisZamani,
        toplamSure
      }
    });

    res.json({ message: 'Dersten çıkış kaydedildi', toplamSure });
  } catch (error) {
    console.error('Dersten çıkma hatası:', error);
    res.status(500).json({ error: 'Dersten çıkış kaydedilemedi' });
  }
};

// Öğrencinin katılım geçmişi
export const getOgrenciKatilimGecmisi = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;

    const katilimlar = await prisma.canliDersKatilim.findMany({
      where: { ogrenciId },
      include: {
        canliDers: {
          include: {
            course: {
              select: {
                ad: true
              }
            },
            ogretmen: {
              select: {
                ad: true,
                soyad: true
              }
            }
          }
        }
      },
      orderBy: {
        girisZamani: 'desc'
      }
    });

    res.json(katilimlar);
  } catch (error) {
    console.error('Katılım geçmişi hatası:', error);
    res.status(500).json({ error: 'Katılım geçmişi alınamadı' });
  }
};

// ==================== AKTİF DERSLER ====================

// Şu an aktif olan dersleri getir
export const getAktifDersler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let courseIds: string[] = [];

    if (userRole === 'ogrenci') {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          ogrenciId: userId,
          aktif: true
        },
        select: { courseId: true }
      });
      courseIds = enrollments.map(e => e.courseId);
    } else if (userRole === 'ogretmen') {
      const courses = await prisma.course.findMany({
        where: { ogretmenId: userId },
        select: { id: true }
      });
      courseIds = courses.map(c => c.id);
    }

    const aktifDersler = await prisma.canliDers.findMany({
      where: {
        durum: 'AKTIF',
        ...(courseIds.length > 0 && { courseId: { in: courseIds } })
      },
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        },
        ogretmen: {
          select: {
            ad: true,
            soyad: true
          }
        },
        _count: {
          select: { katilimlar: true }
        }
      }
    });

    res.json(aktifDersler);
  } catch (error) {
    console.error('Aktif dersler hatası:', error);
    res.status(500).json({ error: 'Aktif dersler alınamadı' });
  }
};

// Yaklaşan dersleri getir
export const getYaklasanDersler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let courseIds: string[] = [];

    if (userRole === 'ogrenci') {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          ogrenciId: userId,
          aktif: true
        },
        select: { courseId: true }
      });
      courseIds = enrollments.map(e => e.courseId);
    } else if (userRole === 'ogretmen') {
      const courses = await prisma.course.findMany({
        where: { ogretmenId: userId },
        select: { id: true }
      });
      courseIds = courses.map(c => c.id);
    }

    const simdi = new Date();
    const birHaftaSonra = new Date();
    birHaftaSonra.setDate(birHaftaSonra.getDate() + 7);

    const yaklasanDersler = await prisma.canliDers.findMany({
      where: {
        durum: 'PLANLANMIS',
        baslangicTarihi: {
          gte: simdi,
          lte: birHaftaSonra
        },
        ...(courseIds.length > 0 && { courseId: { in: courseIds } })
      },
      include: {
        course: {
          select: {
            ad: true,
            sinif: {
              select: { ad: true }
            }
          }
        },
        ogretmen: {
          select: {
            ad: true,
            soyad: true
          }
        }
      },
      orderBy: {
        baslangicTarihi: 'asc'
      },
      take: 10
    });

    res.json(yaklasanDersler);
  } catch (error) {
    console.error('Yaklaşan dersler hatası:', error);
    res.status(500).json({ error: 'Yaklaşan dersler alınamadı' });
  }
};

