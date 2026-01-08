import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Yardımcı fonksiyon: Bugünün gününü Türkçe olarak al
function getBugunGun(): string {
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return gunler[new Date().getDay()];
}

// ==================== ÖĞRETMEN DASHBOARD ====================

export const getOgretmenDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const bugun = getBugunGun();

    // Öğretmenin dersleri
    const dersler = await prisma.course.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        kayitlar: { where: { aktif: true } }
      }
    });

    // Toplam benzersiz öğrenci sayısı
    const ogrenciIdleri = new Set<string>();
    dersler.forEach(ders => {
      ders.kayitlar.forEach(kayit => {
        ogrenciIdleri.add(kayit.ogrenciId);
      });
    });

    // Bekleyen ödevler (teslim edilmemiş - BEKLEMEDE durumunda)
    const odevler = await prisma.odev.findMany({
      where: { 
        ogretmenId, 
        aktif: true,
        sonTeslimTarihi: { gte: new Date() }
      },
      include: {
        teslimler: {
          where: { durum: 'BEKLEMEDE' }
        }
      }
    });

    const bekleyenOdevSayisi = odevler.reduce((acc: number, odev: any) => acc + odev.teslimler.length, 0);

    // Bugünkü ders sayısı
    const bugunDersler = dersler.filter(ders => ders.gun === bugun);

    res.json({
      success: true,
      data: {
        toplamOgrenci: ogrenciIdleri.size,
        toplamDers: dersler.length,
        bekleyenOdevler: bekleyenOdevSayisi,
        bugunDersSayisi: bugunDersler.length
      }
    });
  } catch (error) {
    console.error('Öğretmen dashboard stats hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

export const getOgretmenBugunDersler = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const bugun = getBugunGun();
    const simdikiSaat = new Date().toTimeString().slice(0, 5); // "HH:MM" formatı

    // Bugünkü dersler
    const dersler = await prisma.course.findMany({
      where: { 
        ogretmenId, 
        aktif: true,
        gun: bugun
      },
      include: {
        sinif: { select: { id: true, ad: true } }
      },
      orderBy: { baslangicSaati: 'asc' }
    });

    // Ders durumlarını hesapla
    const derslerWithDurum = dersler.map(ders => {
      let durum: 'bekliyor' | 'devam_ediyor' | 'tamamlandi' = 'bekliyor';
      
      if (simdikiSaat >= ders.bitisSaati) {
        durum = 'tamamlandi';
      } else if (simdikiSaat >= ders.baslangicSaati && simdikiSaat < ders.bitisSaati) {
        durum = 'devam_ediyor';
      }

      return {
        id: ders.id,
        ad: ders.ad,
        sinif: ders.sinif.ad,
        saat: `${ders.baslangicSaati} - ${ders.bitisSaati}`,
        durum
      };
    });

    res.json({
      success: true,
      data: derslerWithDurum
    });
  } catch (error) {
    console.error('Öğretmen bugün dersler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ DASHBOARD ====================

export const getOgrenciDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const bugun = getBugunGun();

    // Öğrencinin kayıtlı dersleri
    const dersKayitlari = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            sinif: { select: { ad: true } },
            ogretmen: { select: { ad: true, soyad: true } }
          }
        }
      }
    });

    // Bugünkü dersler
    const bugunDersler = dersKayitlari.filter(k => k.course.gun === bugun);

    // Bekleyen ödevler (BEKLEMEDE durumunda)
    const bekleyenOdevler = await prisma.odevTeslim.count({
      where: {
        ogrenciId,
        durum: 'BEKLEMEDE',
        odev: { sonTeslimTarihi: { gte: new Date() } }
      }
    });

    // Aktif online sınavlar
    const aktifSinavlar = await prisma.onlineSinav.count({
      where: {
        durum: 'AKTIF',
        baslangicTarihi: { lte: new Date() },
        bitisTarihi: { gte: new Date() },
        oturumlar: {
          none: { ogrenciId, tamamlandi: true }
        }
      }
    });

    // Devamsızlık sayısı
    const devamsizliklar = await prisma.yoklama.count({
      where: {
        ogrenciId,
        durum: 'KATILMADI'
      }
    });

    // Genel ortalama (tamamlanan sınavlardan)
    const sinavOturumlari = await prisma.sinavOturumu.findMany({
      where: { ogrenciId, tamamlandi: true },
      select: { yuzde: true }
    });

    const genelOrtalama = sinavOturumlari.length > 0
      ? Math.round(sinavOturumlari.reduce((sum, o) => sum + (o.yuzde || 0), 0) / sinavOturumlari.length)
      : 0;

    res.json({
      success: true,
      data: {
        toplamDers: dersKayitlari.length,
        bugunDersSayisi: bugunDersler.length,
        bekleyenOdevler,
        aktifSinavlar,
        devamsizliklar,
        genelOrtalama
      }
    });
  } catch (error) {
    console.error('Öğrenci dashboard stats hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

export const getOgrenciBugunDersler = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const bugun = getBugunGun();
    const simdikiSaat = new Date().toTimeString().slice(0, 5);

    const dersKayitlari = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            sinif: { select: { ad: true } },
            ogretmen: { select: { ad: true, soyad: true } }
          }
        }
      }
    });

    const dersler = (dersKayitlari as any[])
      .filter(k => k.course.gun === bugun && k.course.aktif)
      .map(k => {
        let durum: 'bekliyor' | 'devam_ediyor' | 'tamamlandi' = 'bekliyor';
        
        if (simdikiSaat >= k.course.bitisSaati) {
          durum = 'tamamlandi';
        } else if (simdikiSaat >= k.course.baslangicSaati && simdikiSaat < k.course.bitisSaati) {
          durum = 'devam_ediyor';
        }

        return {
          id: k.course.id,
          ad: k.course.ad,
          sinif: k.course.sinif?.ad || '-',
          ogretmen: k.course.ogretmen ? `${k.course.ogretmen.ad} ${k.course.ogretmen.soyad}` : '-',
          saat: `${k.course.baslangicSaati} - ${k.course.bitisSaati}`,
          durum
        };
      })
      .sort((a, b) => a.saat.localeCompare(b.saat));

    res.json({
      success: true,
      data: dersler
    });
  } catch (error) {
    console.error('Öğrenci bugün dersler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

export const getOgrenciBekleyenOdevler = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    const teslimler = await prisma.odevTeslim.findMany({
      where: {
        ogrenciId,
        durum: 'BEKLEMEDE',
        odev: { sonTeslimTarihi: { gte: new Date() } }
      },
      include: {
        odev: {
          include: {
            course: { select: { ad: true } }
          }
        }
      },
      orderBy: { odev: { sonTeslimTarihi: 'asc' } },
      take: 5
    });

    const odevler = teslimler.map((t: any) => ({
      id: t.odevId,
      baslik: t.odev.baslik,
      ders: t.odev.course.ad,
      sonTeslimTarihi: t.odev.sonTeslimTarihi
    }));

    res.json({
      success: true,
      data: odevler
    });
  } catch (error) {
    console.error('Öğrenci bekleyen ödevler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== SEKRETER DASHBOARD ====================

export const getSekreterDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;
    const whereKurs = kursId ? { kursId } : {};
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    // Toplam öğrenci
    const toplamOgrenci = await prisma.user.count({
      where: { role: 'ogrenci', aktif: true, ...whereKurs }
    });

    // Bekleyen ödemeler
    const bekleyenOdemeler = await prisma.odeme.count({
      where: {
        durum: 'BEKLEMEDE',
        ogrenci: whereKurs
      }
    });

    // Bugün devamsız
    const bugunDevamsiz = await prisma.yoklama.count({
      where: {
        tarih: { gte: bugun },
        durum: 'KATILMADI'
      }
    });

    // Son 7 günde yeni kayıtlar
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);

    const yeniKayitlar = await prisma.user.count({
      where: {
        role: 'ogrenci',
        ...whereKurs,
        createdAt: { gte: yediGunOnce }
      }
    });

    res.json({
      success: true,
      data: {
        toplamOgrenci,
        bekleyenOdemeler,
        bugunDevamsiz,
        yeniKayitlar
      }
    });
  } catch (error) {
    console.error('Sekreter dashboard stats hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

export const getSekreterBekleyenOdemeler = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;

    const odemeler = await prisma.odeme.findMany({
      where: {
        durum: 'BEKLEMEDE',
        ogrenci: kursId ? { kursId } : {}
      },
      include: {
        ogrenci: { select: { id: true, ad: true, soyad: true } }
      },
      orderBy: { vadeTarihi: 'asc' },
      take: 5
    });

    const formattedOdemeler = odemeler.map((odeme: any) => ({
      id: odeme.id,
      ogrenciAd: `${odeme.ogrenci.ad} ${odeme.ogrenci.soyad}`,
      tutar: odeme.tutar,
      vadeTarihi: odeme.vadeTarihi
    }));

    res.json({
      success: true,
      data: formattedOdemeler
    });
  } catch (error) {
    console.error('Sekreter bekleyen ödemeler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== MÜDÜR/ADMİN DASHBOARD ====================

export const getMudurDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;
    const whereKurs = kursId ? { kursId } : {};

    // Temel sayılar
    const [
      ogrenciSayisi,
      ogretmenSayisi,
      sinifSayisi,
      dersSayisi
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ogrenci', ...whereKurs } }),
      prisma.user.count({ where: { role: 'ogretmen', ...whereKurs } }),
      prisma.sinif.count({ where: whereKurs }),
      prisma.course.count({ where: { aktif: true } })
    ]);

    // Son 7 günlük yoklama istatistikleri
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);

    const yoklamaStats = await prisma.yoklama.groupBy({
      by: ['durum'],
      where: { tarih: { gte: yediGunOnce } },
      _count: true
    });

    const yoklamaData = {
      katildi: yoklamaStats.find(y => y.durum === 'KATILDI')?._count || 0,
      katilmadi: yoklamaStats.find(y => y.durum === 'KATILMADI')?._count || 0,
      gec: yoklamaStats.find(y => y.durum === 'GEC_KALDI')?._count || 0
    };

    // Günlük yoklama trendi (son 7 gün)
    const gunlukYoklama: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const gun = new Date();
      gun.setDate(gun.getDate() - i);
      gun.setHours(0, 0, 0, 0);
      
      const nextGun = new Date(gun);
      nextGun.setDate(nextGun.getDate() + 1);

      const count = await prisma.yoklama.count({
        where: {
          tarih: { gte: gun, lt: nextGun },
          durum: 'KATILDI'
        }
      });

      gunlukYoklama.push({
        gun: gun.toLocaleDateString('tr-TR', { weekday: 'short' }),
        katilim: count
      });
    }

    // Ödev istatistikleri
    const odevStats = await prisma.odev.aggregate({
      _count: true,
      where: { aktif: true }
    });

    // Teslim edilenleri say (teslimTarihi dolu olanlar)
    const allTeslimler = await prisma.odevTeslim.findMany({
      select: { teslimTarihi: true }
    });
    const teslimEdilen = allTeslimler.filter(t => t.teslimTarihi !== null).length;

    // Online sınav istatistikleri
    const sinavStats = await prisma.onlineSinav.groupBy({
      by: ['durum'],
      _count: true
    });

    // Son kayıtlar
    const sonKayitlar = await prisma.user.findMany({
      where: { role: 'ogrenci', ...whereKurs },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        ad: true,
        soyad: true,
        createdAt: true,
        sinif: { select: { ad: true } }
      }
    });

    // Aylık gelir (ödeme sistemi varsa)
    const ayBaslangic = new Date();
    ayBaslangic.setDate(1);
    ayBaslangic.setHours(0, 0, 0, 0);

    const aylikGelir = await prisma.odeme.aggregate({
      _sum: { tutar: true },
      where: {
        durum: 'ODENDI',
        odemeTarihi: { gte: ayBaslangic }
      }
    });

    res.json({
      success: true,
      data: {
        ozet: {
          ogrenciSayisi,
          ogretmenSayisi,
          sinifSayisi,
          dersSayisi
        },
        yoklama: {
          ozet: yoklamaData,
          trend: gunlukYoklama
        },
        odev: {
          toplam: odevStats._count,
          teslimEdilen
        },
        sinav: {
          aktif: sinavStats.find(s => s.durum === 'AKTIF')?._count || 0,
          tamamlanan: sinavStats.find(s => s.durum === 'SONA_ERDI')?._count || 0
        },
        sonKayitlar,
        aylikGelir: aylikGelir._sum.tutar || 0
      }
    });
  } catch (error) {
    console.error('Müdür dashboard hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRETMEN RAPORLARI ====================

export const getOgretmenRaporlari = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { range } = req.query; // week, month, semester, year

    // Tarih aralığı hesapla
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case 'week': startDate.setDate(now.getDate() - 7); break;
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
      case 'semester': startDate.setMonth(now.getMonth() - 6); break;
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setMonth(now.getMonth() - 1);
    }

    // Öğretmenin dersleri
    const dersler = await prisma.course.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true } },
        kayitlar: { where: { aktif: true }, include: { ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } } } }
      }
    });

    const courseIds = dersler.map(d => d.id);

    // Toplam öğrenci sayısı (benzersiz)
    const toplamOgrenci = new Set(dersler.flatMap(d => d.kayitlar.map(k => k.ogrenciId))).size;

    // Yoklama istatistikleri
    const [yoklamaKatildi, yoklamaKatilmadi, toplamYoklama] = await Promise.all([
      prisma.yoklama.count({
        where: { courseId: { in: courseIds }, tarih: { gte: startDate }, durum: 'KATILDI' }
      }),
      prisma.yoklama.count({
        where: { courseId: { in: courseIds }, tarih: { gte: startDate }, durum: 'KATILMADI' }
      }),
      prisma.yoklama.count({
        where: { courseId: { in: courseIds }, tarih: { gte: startDate } }
      })
    ]);

    const ortalamaKatilim = toplamYoklama > 0 ? Math.round((yoklamaKatildi / toplamYoklama) * 100) : 0;

    // Ödev istatistikleri
    const odevlerWithTeslim = await prisma.odev.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        teslimler: { 
          select: { puan: true, durum: true, teslimTarihi: true }
        }
      }
    });

    const teslimEdilenToplam = odevlerWithTeslim.reduce((acc, o) => 
      acc + o.teslimler.filter(t => t.teslimTarihi !== null).length, 0
    );
    
    const puanlar = odevlerWithTeslim.flatMap(o => 
      o.teslimler.filter(t => t.puan !== null).map(t => t.puan as number)
    );

    const odevStats = {
      verilen: odevlerWithTeslim.length,
      teslimEdilen: teslimEdilenToplam,
      bekleyen: odevlerWithTeslim.filter(o => new Date(o.sonTeslimTarihi) > now).reduce((acc, o) => {
        const teslimEdenler = o.teslimler.filter(t => t.durum !== 'BEKLEMEDE').length;
        return acc + (o.teslimler.length - teslimEdenler);
      }, 0),
      ortalamaPuan: puanlar.length > 0 ? Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length) : 0
    };

    // Sınav istatistikleri
    const sinavlar = await prisma.onlineSinav.findMany({
      where: { ogretmenId },
      include: {
        course: { select: { ad: true } },
        oturumlar: {
          where: { tamamlandi: true },
          select: { toplamPuan: true, yuzde: true, ogrenciId: true }
        },
        sorular: { select: { puan: true } }
      }
    });

    const sinavPuanlar = sinavlar.flatMap(s => s.oturumlar.map(o => o.toplamPuan || 0));
    const sinavStats = {
      yapilan: sinavlar.length,
      ortalamaPuan: sinavPuanlar.length > 0 ? Math.round(sinavPuanlar.reduce((a, b) => a + b, 0) / sinavPuanlar.length) : 0,
      enYuksek: sinavPuanlar.length > 0 ? Math.max(...sinavPuanlar) : 0,
      enDusuk: sinavPuanlar.length > 0 ? Math.min(...sinavPuanlar) : 0
    };

    // Ders bazlı performans
    const dersBazliPerformans = await Promise.all(dersler.map(async (ders) => {
      const dersYoklama = await prisma.yoklama.groupBy({
        by: ['durum'],
        where: { courseId: ders.id, tarih: { gte: startDate } },
        _count: true
      });
      const toplamDersYoklama = dersYoklama.reduce((acc, y) => acc + y._count, 0);
      const katilimOrani = toplamDersYoklama > 0 
        ? Math.round(((dersYoklama.find(y => y.durum === 'KATILDI')?._count || 0) / toplamDersYoklama) * 100) 
        : 0;

      const dersOdevler = odevlerWithTeslim.filter(o => o.courseId === ders.id);
      const teslimEdilen = dersOdevler.reduce((acc, o) => acc + o.teslimler.filter(t => t.teslimTarihi !== null).length, 0);
      const toplamBeklenen = dersOdevler.length * ders.kayitlar.length;
      const odevTeslimOrani = toplamBeklenen > 0 ? Math.round((teslimEdilen / toplamBeklenen) * 100) : 0;

      const dersSinavlar = sinavlar.filter(s => s.courseId === ders.id);
      const dersSinavPuanlar = dersSinavlar.flatMap(s => s.oturumlar.map(o => o.yuzde || 0));
      const sinavOrtalama = dersSinavPuanlar.length > 0 
        ? Math.round(dersSinavPuanlar.reduce((a, b) => a + b, 0) / dersSinavPuanlar.length) 
        : 0;

      return {
        id: ders.id,
        ad: ders.ad,
        sinif: ders.sinif.ad,
        ogrenciSayisi: ders.kayitlar.length,
        katilimOrani,
        odevTeslimOrani,
        sinavOrtalama
      };
    }));

    // Öğrenci bazlı detay
    const ogrenciMap = new Map<string, any>();
    dersler.forEach(ders => {
      ders.kayitlar.forEach(kayit => {
        if (!ogrenciMap.has(kayit.ogrenciId)) {
          ogrenciMap.set(kayit.ogrenciId, {
            id: kayit.ogrenciId,
            ad: kayit.ogrenci.ad,
            soyad: kayit.ogrenci.soyad,
            ogrenciNo: kayit.ogrenci.ogrenciNo || '-',
            sinif: ders.sinif.ad,
            devamsizlik: 0,
            odevPuani: 0,
            odevSayisi: 0,
            sinavPuani: 0,
            sinavSayisi: 0
          });
        }
      });
    });

    // Devamsızlık verisi
    const devamsizliklar = await prisma.yoklama.findMany({
      where: { 
        courseId: { in: courseIds }, 
        tarih: { gte: startDate }, 
        durum: 'KATILMADI'
      },
      select: { ogrenciId: true }
    });

    devamsizliklar.forEach(d => {
      const ogrenci = ogrenciMap.get(d.ogrenciId);
      if (ogrenci) ogrenci.devamsizlik++;
    });

    // Ödev puanları
    const odevTeslimler = await prisma.odevTeslim.findMany({
      where: { 
        odev: { ogretmenId },
        puan: { not: null }
      },
      select: { ogrenciId: true, puan: true }
    });

    odevTeslimler.forEach(t => {
      const ogrenci = ogrenciMap.get(t.ogrenciId);
      if (ogrenci && t.puan !== null) {
        ogrenci.odevPuani += t.puan;
        ogrenci.odevSayisi++;
      }
    });

    // Sınav puanları
    const sinavOturumlari = await prisma.sinavOturumu.findMany({
      where: { 
        sinav: { ogretmenId },
        tamamlandi: true
      },
      select: { ogrenciId: true, yuzde: true }
    });

    sinavOturumlari.forEach(o => {
      const ogrenci = ogrenciMap.get(o.ogrenciId);
      if (ogrenci && o.yuzde !== null) {
        ogrenci.sinavPuani += o.yuzde;
        ogrenci.sinavSayisi++;
      }
    });

    // Öğrenci sonuçlarını hesapla
    const ogrenciler = Array.from(ogrenciMap.values()).map(o => {
      const odevOrt = o.odevSayisi > 0 ? Math.round(o.odevPuani / o.odevSayisi) : 0;
      const sinavOrt = o.sinavSayisi > 0 ? Math.round(o.sinavPuani / o.sinavSayisi) : 0;
      const genelOrtalama = Math.round((odevOrt + sinavOrt) / 2);
      
      return {
        ...o,
        odevPuani: odevOrt,
        sinavPuani: sinavOrt,
        genelOrtalama,
        trend: genelOrtalama >= 70 ? 'up' : genelOrtalama >= 50 ? 'stable' : 'down'
      };
    });

    // Sınav detayları
    const sinavDetay = sinavlar.map(sinav => {
      const maxPuan = sinav.sorular.reduce((sum, s) => sum + s.puan, 0);
      const puanlar = sinav.oturumlar.map(o => o.toplamPuan || 0);
      return {
        id: sinav.id,
        baslik: sinav.baslik,
        tarih: sinav.createdAt.toISOString(),
        katilimci: sinav.oturumlar.length,
        ortalama: puanlar.length > 0 ? Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length) : 0,
        enYuksek: puanlar.length > 0 ? Math.max(...puanlar) : 0,
        basariOrani: puanlar.length > 0 && maxPuan > 0 
          ? Math.round((puanlar.filter(p => p >= maxPuan * 0.5).length / puanlar.length) * 100)
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        genel: {
          toplamOgrenci,
          toplamDers: dersler.length,
          toplamOdev: odevlerWithTeslim.length,
          toplamSinav: sinavlar.length
        },
        yoklama: {
          ortalamaKatilim,
          toplamYoklama,
          devamsizlar: yoklamaKatilmadi
        },
        odevler: odevStats,
        sinavlar: sinavStats,
        dersler: dersBazliPerformans,
        ogrenciler,
        sinavDetay
      }
    });
  } catch (error) {
    console.error('Öğretmen raporları hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ HAFTALIK PROGRAM ====================

export const getOgrenciHaftalikProgram = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Öğrencinin kayıtlı derslerini al
    const dersKayitlari = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            sinif: { select: { ad: true } },
            ogretmen: { select: { ad: true, soyad: true } }
          }
        }
      }
    });

    // Günlere göre grupla
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const haftalikProgram: Record<string, any[]> = {};

    gunler.forEach(gun => {
      haftalikProgram[gun] = [];
    });

    dersKayitlari.forEach((kayit: any) => {
      const ders = kayit.course;
      if (ders.gun && ders.aktif) {
        haftalikProgram[ders.gun].push({
          id: ders.id,
          ad: ders.ad,
          ogretmen: ders.ogretmen ? `${ders.ogretmen.ad} ${ders.ogretmen.soyad}` : '-',
          baslangicSaati: ders.baslangicSaati,
          bitisSaati: ders.bitisSaati
        });
      }
    });

    // Her günün derslerini saate göre sırala
    gunler.forEach(gun => {
      haftalikProgram[gun].sort((a, b) => a.baslangicSaati.localeCompare(b.baslangicSaati));
    });

    res.json({
      success: true,
      data: haftalikProgram
    });
  } catch (error) {
    console.error('Öğrenci haftalık program hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ ÖĞRETMENLERİ ====================

export const getOgrenciOgretmenler = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Öğrencinin kayıtlı derslerini al
    const dersKayitlari = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            ogretmen: {
              select: { id: true, ad: true, soyad: true, email: true, brans: true }
            }
          }
        }
      }
    });

    // Benzersiz öğretmenleri çıkar
    const ogretmenMap = new Map<string, any>();
    const ogretmenDersler = new Map<string, string[]>();

    dersKayitlari.forEach((kayit: any) => {
      const ogretmen = kayit.course.ogretmen;
      if (ogretmen) {
        if (!ogretmenMap.has(ogretmen.id)) {
          ogretmenMap.set(ogretmen.id, ogretmen);
          ogretmenDersler.set(ogretmen.id, []);
        }
        ogretmenDersler.get(ogretmen.id)?.push(kayit.course.ad);
      }
    });

    const ogretmenler = Array.from(ogretmenMap.values()).map(ogretmen => ({
      id: ogretmen.id,
      ad: ogretmen.ad,
      soyad: ogretmen.soyad,
      email: ogretmen.email,
      brans: ogretmen.brans || 'Belirtilmemiş',
      dersler: [...new Set(ogretmenDersler.get(ogretmen.id) || [])]
    }));

    res.json({
      success: true,
      data: ogretmenler
    });
  } catch (error) {
    console.error('Öğrenci öğretmenler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ DENEME SONUÇLARI ====================

export const getOgrenciDenemeSonuclari = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Tamamlanmış sınav oturumlarını al
    const sinavOturumlari = await prisma.sinavOturumu.findMany({
      where: { ogrenciId, tamamlandi: true },
      include: {
        sinav: {
          select: { 
            id: true,
            baslik: true, 
            dersAdi: true,
            course: { select: { ad: true } }
          }
        },
        cevaplar: {
          select: { 
            dogruMu: true,
            cevap: true
          }
        }
      },
      orderBy: { bitisZamani: 'desc' },
      take: 20
    });

    const denemeSonuclari = (sinavOturumlari as any[]).map((oturum: any) => {
      const cevaplar = oturum.cevaplar || [];
      const sinav = oturum.sinav || {};
      const dogruSayisi = cevaplar.filter((c: any) => c.dogruMu).length;
      const yanlisSayisi = cevaplar.filter((c: any) => !c.dogruMu && c.cevap).length;
      const bosSayisi = cevaplar.filter((c: any) => !c.cevap).length;

      return {
        id: oturum.id,
        sinavId: sinav.id || oturum.sinavId,
        sinavAd: sinav.baslik || 'Sınav',
        dersAd: sinav.course?.ad || sinav.dersAdi || 'Genel Deneme',
        tarih: oturum.bitisZamani,
        dogru: dogruSayisi,
        yanlis: yanlisSayisi,
        bos: bosSayisi,
        toplam: cevaplar.length,
        yuzde: oturum.yuzde || (cevaplar.length > 0 ? Math.round((dogruSayisi / cevaplar.length) * 100) : 0),
        toplamPuan: oturum.toplamPuan || 0
      };
    });

    // Sınav bazlı gruplama (aynı sınav için son 3 denemeyi göster)
    const grupluDenemeler = denemeSonuclari.reduce((acc: any, sonuc) => {
      if (!acc[sonuc.sinavAd]) {
        acc[sonuc.sinavAd] = [];
      }
      if (acc[sonuc.sinavAd].length < 3) {
        acc[sonuc.sinavAd].push(sonuc);
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        tumSonuclar: denemeSonuclari,
        grupluSonuclar: grupluDenemeler
      }
    });
  } catch (error) {
    console.error('Öğrenci deneme sonuçları hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ DEVAMSIZLIK ====================

export const getOgrenciDevamsizlik = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Yoklama kayıtlarını al
    const yoklamalar = await prisma.yoklama.findMany({
      where: { ogrenciId },
      include: {
        course: {
          select: { ad: true }
        }
      },
      orderBy: { tarih: 'desc' },
      take: 50
    });

    // İstatistikleri hesapla
    const toplam = yoklamalar.length;
    const katildi = yoklamalar.filter(y => y.durum === 'KATILDI').length;
    const katilmadi = yoklamalar.filter(y => y.durum === 'KATILMADI').length;
    const gecKaldi = yoklamalar.filter(y => y.durum === 'GEC_KALDI').length;

    // Son devamsızlıkları formatla
    const sonDevamsizliklar = yoklamalar
      .filter(y => y.durum === 'KATILMADI' || y.durum === 'GEC_KALDI')
      .slice(0, 10)
      .map(y => ({
        id: y.id,
        tarih: y.tarih,
        ders: y.course?.ad || '-',
        durum: y.durum,
        aciklama: y.aciklama
      }));

    res.json({
      success: true,
      data: {
        istatistik: {
          toplam,
          katildi,
          katilmadi,
          gecKaldi,
          katilimOrani: toplam > 0 ? Math.round((katildi / toplam) * 100) : 100
        },
        sonDevamsizliklar
      }
    });
  } catch (error) {
    console.error('Öğrenci devamsızlık hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ İLERLEME ====================

export const getOgrenciIlerleme = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Haftalık tarih aralıklarını önceden hesapla
    const now = new Date();
    const haftaAraliklari = Array.from({ length: 4 }, (_, i) => {
      const idx = 3 - i;
      const haftaBaslangic = new Date(now);
      haftaBaslangic.setDate(now.getDate() - (idx * 7 + 7));
      const haftaBitis = new Date(now);
      haftaBitis.setDate(now.getDate() - (idx * 7));
      return { haftaBaslangic, haftaBitis, label: `${4 - idx}. Hafta` };
    });

    // TÜM SORGULARI PARALEL OLARAK ÇALIŞTİR
    const [
      sinavOturumlari,
      yoklamalar,
      odevStats,
      ...haftalikSonuclar
    ] = await Promise.all([
      // 1. Sınav oturumları (son 10)
      prisma.sinavOturumu.findMany({
        where: { ogrenciId, tamamlandi: true },
        select: {
          yuzde: true,
          sinav: {
            select: { baslik: true, dersAdi: true, course: { select: { ad: true } } }
          }
        },
        orderBy: { bitisZamani: 'asc' },
        take: 10
      }),
      
      // 2. Yoklama gruplaması
      prisma.yoklama.groupBy({
        by: ['durum'],
        where: { ogrenciId },
        _count: true
      }),
      
      // 3. Ödev istatistikleri (aggregate ile daha hızlı)
      prisma.odevTeslim.groupBy({
        by: ['durum'],
        where: { ogrenciId },
        _count: true,
        _avg: { puan: true }
      }),
      
      // 4-11. Haftalık aktiviteler (8 sorgu paralel)
      ...haftaAraliklari.flatMap(({ haftaBaslangic, haftaBitis }) => [
        prisma.sinavOturumu.count({
          where: {
            ogrenciId,
            tamamlandi: true,
            bitisZamani: { gte: haftaBaslangic, lt: haftaBitis }
          }
        }),
        prisma.odevTeslim.count({
          where: {
            ogrenciId,
            teslimTarihi: { gte: haftaBaslangic, lt: haftaBitis }
          }
        })
      ])
    ]);

    // Sınav trend verisi
    const sinavTrend = sinavOturumlari.map((oturum, i) => ({
      sinav: `Sınav ${i + 1}`,
      baslik: oturum.sinav.baslik,
      ders: oturum.sinav.course?.ad || oturum.sinav.dersAdi || 'Genel Deneme',
      puan: oturum.yuzde || 0
    }));

    // Ders bazlı başarı hesapla
    const dersBasari: Record<string, { toplam: number; puan: number }> = {};
    sinavOturumlari.forEach(oturum => {
      const ders = oturum.sinav.course?.ad || oturum.sinav.dersAdi || 'Genel Deneme';
      if (!dersBasari[ders]) {
        dersBasari[ders] = { toplam: 0, puan: 0 };
      }
      dersBasari[ders].toplam++;
      dersBasari[ders].puan += oturum.yuzde || 0;
    });

    const dersBasariData = Object.entries(dersBasari).map(([ders, data]) => ({
      ders,
      ortalama: Math.round(data.puan / data.toplam)
    }));

    // Yoklama verisi
    const yoklamaData = {
      katildi: yoklamalar.find(y => y.durum === 'KATILDI')?._count || 0,
      katilmadi: yoklamalar.find(y => y.durum === 'KATILMADI')?._count || 0,
      gec: yoklamalar.find(y => y.durum === 'GEC_KALDI')?._count || 0
    };

    // Ödev verisi
    const tamamlananCount = odevStats.find((s: any) => s.durum === 'DEGERLENDIRILDI' || s.durum === 'TESLIM_EDILDI')?._count || 0;
    const bekleyenCount = odevStats.find((s: any) => s.durum === 'BEKLEMEDE')?._count || 0;
    const avgPuan = odevStats.find((s: any) => s._avg?.puan)?._avg?.puan || 0;
    
    const odevData = {
      tamamlanan: tamamlananCount,
      bekleyen: bekleyenCount,
      ortalamaPuan: Math.round(avgPuan)
    };

    // Haftalık aktivite verisi
    const haftalikAktivite = haftaAraliklari.map((aralik, i) => ({
      hafta: aralik.label,
      sinav: haftalikSonuclar[i * 2] as number,
      odev: haftalikSonuclar[i * 2 + 1] as number
    }));

    // Genel ortalama
    const genelOrtalama = sinavOturumlari.length > 0
      ? Math.round(sinavOturumlari.reduce((sum, o) => sum + (o.yuzde || 0), 0) / sinavOturumlari.length)
      : 0;

    res.json({
      success: true,
      data: {
        ozet: {
          genelOrtalama,
          sinavSayisi: sinavOturumlari.length,
          odevTamamlanan: odevData.tamamlanan,
          katilimOrani: yoklamaData.katildi + yoklamaData.katilmadi + yoklamaData.gec > 0
            ? Math.round((yoklamaData.katildi / (yoklamaData.katildi + yoklamaData.katilmadi + yoklamaData.gec)) * 100)
            : 100
        },
        sinavTrend,
        dersBasari: dersBasariData,
        yoklama: yoklamaData,
        odev: odevData,
        haftalikAktivite
      }
    });
  } catch (error) {
    console.error('Öğrenci ilerleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== SINIF KARŞILAŞTIRMA ====================

// Sınıfları karşılaştır (müdür dashboard'u için)
export const getSinifKarsilastirma = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;
    const whereKurs = kursId ? { kursId } : {};

    // Tüm sınıfları al
    const siniflar = await prisma.sinif.findMany({
      where: { ...whereKurs, aktif: true },
      select: { id: true, ad: true, seviye: true }
    });

    // Her sınıf için istatistikler
    const sinifIstatistikleri = await Promise.all(
      siniflar.map(async (sinif) => {
        // Sınıftaki öğrenciler
        const ogrenciler = await prisma.user.findMany({
          where: { sinifId: sinif.id, role: 'ogrenci', aktif: true },
          select: { id: true }
        });
        const ogrenciIds = ogrenciler.map(o => o.id);

        if (ogrenciIds.length === 0) {
          return {
            sinifId: sinif.id,
            sinifAd: sinif.ad,
            seviye: sinif.seviye,
            ogrenciSayisi: 0,
            sinavOrtalamasi: null,
            odevTeslimOrani: null,
            katilimOrani: null,
            xpOrtalamasi: null
          };
        }

        // Sınav ortalaması
        const sinavSonuclari = await prisma.sinavOturumu.findMany({
          where: { ogrenciId: { in: ogrenciIds }, tamamlandi: true },
          select: { yuzde: true }
        });
        const sinavOrtalamasi = sinavSonuclari.length > 0
          ? Math.round(sinavSonuclari.reduce((sum, s) => sum + (s.yuzde || 0), 0) / sinavSonuclari.length)
          : null;

        // Ödev teslim oranı
        const odevTeslimler = await prisma.odevTeslim.findMany({
          where: { ogrenciId: { in: ogrenciIds } },
          select: { durum: true }
        });
        const teslimEdilen = odevTeslimler.filter(o => o.durum !== 'BEKLEMEDE').length;
        const odevTeslimOrani = odevTeslimler.length > 0
          ? Math.round((teslimEdilen / odevTeslimler.length) * 100)
          : null;

        // Katılım oranı (son 30 gün)
        const otuzGunOnce = new Date();
        otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

        const yoklamalar = await prisma.yoklama.findMany({
          where: {
            ogrenciId: { in: ogrenciIds },
            tarih: { gte: otuzGunOnce }
          },
          select: { durum: true }
        });
        const katildi = yoklamalar.filter(y => y.durum === 'KATILDI').length;
        const katilimOrani = yoklamalar.length > 0
          ? Math.round((katildi / yoklamalar.length) * 100)
          : null;

        // XP ortalaması
        const xpVerileri = await prisma.user.findMany({
          where: { id: { in: ogrenciIds } },
          select: { xpPuani: true }
        });
        const xpOrtalamasi = xpVerileri.length > 0
          ? Math.round(xpVerileri.reduce((sum, x) => sum + x.xpPuani, 0) / xpVerileri.length)
          : null;

        return {
          sinifId: sinif.id,
          sinifAd: sinif.ad,
          seviye: sinif.seviye,
          ogrenciSayisi: ogrenciIds.length,
          sinavOrtalamasi,
          odevTeslimOrani,
          katilimOrani,
          xpOrtalamasi
        };
      })
    );

    // Seviyeye göre sırala
    const siraliSiniflar = sinifIstatistikleri.sort((a, b) => a.seviye - b.seviye);

    res.json({
      success: true,
      data: {
        siniflar: siraliSiniflar,
        karsilastirmaAlanlari: ['sinavOrtalamasi', 'odevTeslimOrani', 'katilimOrani', 'xpOrtalamasi']
      }
    });
  } catch (error) {
    console.error('Sınıf karşılaştırma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRETMEN PERFORMANS RAPORU ====================

// Öğretmen performans raporu (müdür için)
export const getOgretmenPerformans = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;
    const whereKurs = kursId ? { kursId } : {};

    // Tüm öğretmenler
    const ogretmenler = await prisma.user.findMany({
      where: { role: 'ogretmen', aktif: true, ...whereKurs },
      select: { id: true, ad: true, soyad: true, brans: true }
    });

    // Her öğretmen için performans metrikleri
    const ogretmenPerformans = await Promise.all(
      ogretmenler.map(async (ogretmen) => {
        // Dersleri
        const dersler = await prisma.course.findMany({
          where: { ogretmenId: ogretmen.id, aktif: true },
          select: { id: true }
        });
        const courseIds = dersler.map(d => d.id);

        // Toplam öğrenci sayısı
        const kayitlar = await prisma.courseEnrollment.findMany({
          where: { courseId: { in: courseIds }, aktif: true },
          select: { ogrenciId: true }
        });
        const benzersizOgrenci = new Set(kayitlar.map(k => k.ogrenciId)).size;

        // Verilen ödev sayısı
        const odevSayisi = await prisma.odev.count({
          where: { ogretmenId: ogretmen.id, aktif: true }
        });

        // Yapılan sınav sayısı
        const sinavSayisi = await prisma.onlineSinav.count({
          where: { ogretmenId: ogretmen.id }
        });

        // Canlı ders sayısı
        const canliDersSayisi = await prisma.canliDers.count({
          where: { ogretmenId: ogretmen.id }
        });

        // Materyal sayısı
        const materyalSayisi = await prisma.materyal.count({
          where: { yukleyenId: ogretmen.id, aktif: true }
        });

        // Öğrenci başarı ortalaması (öğretmenin sınavlarından)
        const sinavOturumlari = await prisma.sinavOturumu.findMany({
          where: {
            sinav: { ogretmenId: ogretmen.id },
            tamamlandi: true
          },
          select: { yuzde: true }
        });
        const ogrenciBasariOrtalamasi = sinavOturumlari.length > 0
          ? Math.round(sinavOturumlari.reduce((sum, s) => sum + (s.yuzde || 0), 0) / sinavOturumlari.length)
          : null;

        // Yoklama oranı (öğretmenin derslerinde)
        const otuzGunOnce = new Date();
        otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

        const yoklamalar = await prisma.yoklama.findMany({
          where: {
            courseId: { in: courseIds },
            tarih: { gte: otuzGunOnce }
          },
          select: { durum: true }
        });
        const katildi = yoklamalar.filter(y => y.durum === 'KATILDI').length;
        const katilimOrani = yoklamalar.length > 0
          ? Math.round((katildi / yoklamalar.length) * 100)
          : null;

        return {
          id: ogretmen.id,
          ad: ogretmen.ad,
          soyad: ogretmen.soyad,
          brans: ogretmen.brans,
          performans: {
            dersSayisi: dersler.length,
            ogrenciSayisi: benzersizOgrenci,
            odevSayisi,
            sinavSayisi,
            canliDersSayisi,
            materyalSayisi,
            ogrenciBasariOrtalamasi,
            katilimOrani
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        ogretmenler: ogretmenPerformans,
        toplam: {
          ogretmenSayisi: ogretmenler.length
        }
      }
    });
  } catch (error) {
    console.error('Öğretmen performans hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== GENEL İSTATİSTİK RAPORU ====================

// Kapsamlı istatistik raporu (PDF export için veri)
export const getGenelRapor = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const kursId = user?.kursId;
    const whereKurs = kursId ? { kursId } : {};
    const { baslangicTarihi, bitisTarihi } = req.query;

    const baslangic = baslangicTarihi ? new Date(baslangicTarihi as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const bitis = bitisTarihi ? new Date(bitisTarihi as string) : new Date();

    // Temel sayılar
    const [ogrenciSayisi, ogretmenSayisi, sinifSayisi] = await Promise.all([
      prisma.user.count({ where: { role: 'ogrenci', aktif: true, ...whereKurs } }),
      prisma.user.count({ where: { role: 'ogretmen', aktif: true, ...whereKurs } }),
      prisma.sinif.count({ where: { aktif: true, ...whereKurs } })
    ]);

    // Dönem içi istatistikler
    const [sinavSayisi, odevSayisi, canliDersSayisi, materyalSayisi] = await Promise.all([
      prisma.onlineSinav.count({
        where: { createdAt: { gte: baslangic, lte: bitis } }
      }),
      prisma.odev.count({
        where: { createdAt: { gte: baslangic, lte: bitis }, aktif: true }
      }),
      prisma.canliDers.count({
        where: { baslangicTarihi: { gte: baslangic, lte: bitis } }
      }),
      prisma.materyal.count({
        where: { createdAt: { gte: baslangic, lte: bitis }, aktif: true }
      })
    ]);

    // Yoklama özeti
    const yoklamaOzeti = await prisma.yoklama.groupBy({
      by: ['durum'],
      where: { tarih: { gte: baslangic, lte: bitis } },
      _count: true
    });

    // Ödeme özeti
    const odemeOzeti = await prisma.odeme.groupBy({
      by: ['durum'],
      where: { createdAt: { gte: baslangic, lte: bitis } },
      _sum: { tutar: true },
      _count: true
    });

    // Günlük aktivite trendi
    const gunSayisi = Math.ceil((bitis.getTime() - baslangic.getTime()) / (1000 * 60 * 60 * 24));
    const aktiviteTrend: { tarih: string; sinav: number; odev: number; canliDers: number }[] = [];

    for (let i = 0; i < Math.min(gunSayisi, 30); i++) {
      const gun = new Date(bitis);
      gun.setDate(bitis.getDate() - i);
      gun.setHours(0, 0, 0, 0);

      const nextGun = new Date(gun);
      nextGun.setDate(nextGun.getDate() + 1);

      const [sinavCount, odevCount, canliDersCount] = await Promise.all([
        prisma.sinavOturumu.count({
          where: { baslangicZamani: { gte: gun, lt: nextGun } }
        }),
        prisma.odevTeslim.count({
          where: { teslimTarihi: { gte: gun, lt: nextGun } }
        }),
        prisma.canliDersKatilim.count({
          where: { girisZamani: { gte: gun, lt: nextGun } }
        })
      ]);

      aktiviteTrend.unshift({
        tarih: gun.toISOString().split('T')[0],
        sinav: sinavCount,
        odev: odevCount,
        canliDers: canliDersCount
      });
    }

    res.json({
      success: true,
      data: {
        donem: {
          baslangic,
          bitis
        },
        ozet: {
          ogrenciSayisi,
          ogretmenSayisi,
          sinifSayisi,
          sinavSayisi,
          odevSayisi,
          canliDersSayisi,
          materyalSayisi
        },
        yoklama: {
          katildi: yoklamaOzeti.find(y => y.durum === 'KATILDI')?._count || 0,
          katilmadi: yoklamaOzeti.find(y => y.durum === 'KATILMADI')?._count || 0,
          gecKaldi: yoklamaOzeti.find(y => y.durum === 'GEC_KALDI')?._count || 0,
          izinli: yoklamaOzeti.find(y => y.durum === 'IZINLI')?._count || 0
        },
        odeme: {
          odenen: {
            tutar: odemeOzeti.find(o => o.durum === 'ODENDI')?._sum.tutar || 0,
            adet: odemeOzeti.find(o => o.durum === 'ODENDI')?._count || 0
          },
          bekleyen: {
            tutar: odemeOzeti.find(o => o.durum === 'BEKLEMEDE')?._sum.tutar || 0,
            adet: odemeOzeti.find(o => o.durum === 'BEKLEMEDE')?._count || 0
          }
        },
        aktiviteTrend
      }
    });
  } catch (error) {
    console.error('Genel rapor hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

