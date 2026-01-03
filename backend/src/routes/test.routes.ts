import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// TEST HESAP BİLGİLERİ - Sadece development ortamında çalışır
// GET /api/test/hesaplar
router.get('/hesaplar', async (req: Request, res: Response) => {
  try {
    // Sadece development ortamında çalışsın
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Bu endpoint production ortamında devre dışı' 
      });
    }

    const { role, kursId, sinifId, search } = req.query;

    // Tüm kullanıcıları getir (şifre hariç, sadece test bilgileri)
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(kursId && { kursId: kursId as string }),
        ...(sinifId && { sinifId: sinifId as string }),
        ...(search && {
          OR: [
            { ad: { contains: search as string } },
            { soyad: { contains: search as string } },
            { email: { contains: search as string } },
          ]
        }),
        aktif: true,
      },
      include: {
        kurs: { select: { id: true, ad: true } },
        sinif: { select: { id: true, ad: true, seviye: true } },
      },
      orderBy: [
        { role: 'asc' },
        { ad: 'asc' },
      ],
    });

    // Varsayılan şifre bilgisi
    const varsayilanSifre = 'edura123';

    // Kullanıcı bilgilerini formatla
    const hesaplar = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      sifre: varsayilanSifre, // Tüm test hesapları için aynı şifre
      ad: user.ad,
      soyad: user.soyad,
      role: user.role,
      brans: user.brans,
      ogrenciNo: user.ogrenciNo,
      kurs: user.kurs,
      sinif: user.sinif,
    }));

    // İstatistikler
    const stats = {
      toplam: hesaplar.length,
      admin: hesaplar.filter(h => h.role === 'admin').length,
      mudur: hesaplar.filter(h => h.role === 'mudur').length,
      sekreter: hesaplar.filter(h => h.role === 'sekreter').length,
      ogretmen: hesaplar.filter(h => h.role === 'ogretmen').length,
      ogrenci: hesaplar.filter(h => h.role === 'ogrenci').length,
      veli: hesaplar.filter(h => h.role === 'veli').length,
    };

    // Kurs listesi
    const kurslar = await prisma.kurs.findMany({
      select: { id: true, ad: true },
      where: { aktif: true },
      orderBy: { ad: 'asc' },
    });

    // Sınıf listesi
    const siniflar = await prisma.sinif.findMany({
      select: { id: true, ad: true, seviye: true, kursId: true },
      where: { aktif: true },
      orderBy: [{ seviye: 'asc' }, { ad: 'asc' }],
    });

    res.json({ 
      success: true, 
      data: {
        hesaplar,
        stats,
        kurslar,
        siniflar,
        varsayilanSifre,
      }
    });
  } catch (error) {
    console.error('Test hesapları getirme hatası:', error);
    res.status(500).json({ success: false, error: 'Hesaplar getirilemedi' });
  }
});

export default router;

