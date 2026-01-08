import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Test sayfası şifre doğrulama
// POST /api/test/verify-password
router.post('/verify-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    // Env'den şifreyi al (varsayılan: 'test123')
    const testPagePassword = process.env.TEST_PAGE_PASSWORD || 'test123';
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Şifre gerekli' 
      });
    }
    
    if (password !== testPagePassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Yanlış şifre' 
      });
    }
    
    // Şifre doğru - basit bir token oluştur (session için)
    const sessionToken = Buffer.from(`test-page-${Date.now()}-${Math.random()}`).toString('base64');
    
    res.json({ 
      success: true, 
      data: { 
        sessionToken,
        message: 'Şifre doğrulandı' 
      }
    });
  } catch (error) {
    console.error('Test şifre doğrulama hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Session token doğrulama middleware
const verifyTestSession = (req: Request, res: Response, next: Function) => {
  const sessionToken = req.headers['x-test-session'] as string;
  
  if (!sessionToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Oturum gerekli. Lütfen önce şifre ile giriş yapın.' 
    });
  }
  
  // Basit token doğrulama (prefix kontrolü)
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    if (!decoded.startsWith('test-page-')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Geçersiz oturum' 
      });
    }
    next();
  } catch {
    return res.status(401).json({ 
      success: false, 
      error: 'Geçersiz oturum' 
    });
  }
};

// TEST HESAP BİLGİLERİ - Şifre korumalı, production'da da çalışır
// GET /api/test/hesaplar
router.get('/hesaplar', verifyTestSession, async (req: Request, res: Response) => {
  try {

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
        // Veli için çocukları getir
        cocuklari: { 
          select: { 
            id: true, 
            ad: true, 
            soyad: true,
            sinif: { select: { ad: true } }
          } 
        },
      },
      orderBy: [
        { role: 'asc' },
        { ad: 'asc' },
      ],
    });

    // Şifre belirleme fonksiyonu
    const getSifre = (user: any) => {
      // Adminler
      if (user.role === 'admin') {
        return 'Edura2026.!';
      }
      // Küçükyalı Buket kullanıcıları (kurs adına veya email'e göre)
      if (user.kurs?.ad?.includes('Buket') || user.email?.includes('buket') || 
          ['busrabuyuktanir', 'mervecevizcipinar', 'damlamengus', 'mervehazaniscan', 
           'seydakarci', 'ziyaanilsen', 'emineumaykilinc', 'muratbarisakyuz', 'zeynepucar',
           'akilrahmanturza', 'alirizamistik', 'buraktuzcu'].some(e => user.email?.includes(e))) {
        return 'Edura2025.!';
      }
      // Diğer kurslar (varsayılan)
      return 'edura123';
    };

    // Kullanıcı bilgilerini formatla
    const hesaplar = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      sifre: getSifre(user),
      ad: user.ad,
      soyad: user.soyad,
      role: user.role,
      brans: user.brans,
      ogrenciNo: user.ogrenciNo,
      kurs: user.kurs,
      sinif: user.sinif,
      // Veli için çocuk bilgileri
      cocuklar: user.cocuklari?.map((c: any) => ({
        id: c.id,
        ad: c.ad,
        soyad: c.soyad,
        sinif: c.sinif?.ad
      })) || [],
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
        sifreGruplari: {
          adminler: 'Edura2026.!',
          kucukyaliBuket: 'Edura2025.!',
          digerKurslar: 'edura123'
        }
      }
    });
  } catch (error) {
    console.error('Test hesapları getirme hatası:', error);
    res.status(500).json({ success: false, error: 'Hesaplar getirilemedi' });
  }
});

export default router;
