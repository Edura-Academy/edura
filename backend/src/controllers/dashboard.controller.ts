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

    // Öğretmenin dersleri
    const dersler = await prisma.course.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        sinif: { select: { ad: true } },
        kayitlar: { where: { aktif: true } }
      }
    });

    // Ders bazlı öğrenci sayıları
    const dersOgrenciData = dersler.map(ders => ({
      ders: ders.ad,
      sinif: ders.sinif.ad,
      ogrenciSayisi: ders.kayitlar.length
    }));

    // Yoklama istatistikleri (son 30 gün)
    const otuzGunOnce = new Date();
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

    const courseIds = dersler.map(d => d.id);
    
    const yoklamaStats = await prisma.yoklama.groupBy({
      by: ['durum'],
      where: {
        courseId: { in: courseIds },
        tarih: { gte: otuzGunOnce }
      },
      _count: true
    });

    // Haftalık yoklama trendi
    const haftalikYoklama: any[] = [];
    for (let i = 3; i >= 0; i--) {
      const haftaBaslangic = new Date();
      haftaBaslangic.setDate(haftaBaslangic.getDate() - (i * 7 + 7));
      const haftaBitis = new Date();
      haftaBitis.setDate(haftaBitis.getDate() - (i * 7));

      const katilim = await prisma.yoklama.count({
        where: {
          courseId: { in: courseIds },
          tarih: { gte: haftaBaslangic, lt: haftaBitis },
          durum: 'KATILDI'
        }
      });

      haftalikYoklama.push({
        hafta: `${4 - i}. Hafta`,
        katilim
      });
    }

    // Ödev durumu
    const odevler = await prisma.odev.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        teslimler: true
      }
    });

    const odevDurum = {
      toplam: odevler.length,
      teslimBekleyen: odevler.filter(o => new Date(o.sonTeslimTarihi) > new Date()).length,
      suresiDolmus: odevler.filter(o => new Date(o.sonTeslimTarihi) <= new Date()).length
    };

    const odevTeslimOrani = odevler.map(odev => ({
      baslik: odev.baslik.substring(0, 20) + (odev.baslik.length > 20 ? '...' : ''),
      teslimSayisi: odev.teslimler.filter(t => t.teslimTarihi).length,
      toplamOgrenci: odev.teslimler.length || 1
    }));

    // Online sınav sonuçları
    const sinavlar = await prisma.onlineSinav.findMany({
      where: { ogretmenId },
      include: {
        oturumlar: {
          where: { tamamlandi: true },
          select: { yuzde: true }
        },
        course: { select: { ad: true } }
      }
    });

    const sinavSonuclari = sinavlar.map(sinav => ({
      baslik: sinav.baslik,
      ders: sinav.course?.ad || sinav.dersAdi || 'Genel Deneme',
      katilimci: sinav.oturumlar.length,
      ortalama: sinav.oturumlar.length > 0 
        ? Math.round(sinav.oturumlar.reduce((sum, o) => sum + (o.yuzde || 0), 0) / sinav.oturumlar.length)
        : 0
    }));

    res.json({
      success: true,
      data: {
        dersler: dersOgrenciData,
        yoklama: {
          ozet: {
            katildi: yoklamaStats.find(y => y.durum === 'KATILDI')?._count || 0,
            katilmadi: yoklamaStats.find(y => y.durum === 'KATILMADI')?._count || 0
          },
          haftalik: haftalikYoklama
        },
        odev: {
          durum: odevDurum,
          teslimOrani: odevTeslimOrani
        },
        sinav: sinavSonuclari
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

    // Sınav sonuçları (trend)
    const sinavOturumlari = await prisma.sinavOturumu.findMany({
      where: { ogrenciId, tamamlandi: true },
      include: {
        sinav: {
          select: { baslik: true, dersAdi: true, course: { select: { ad: true } } }
        }
      },
      orderBy: { bitisZamani: 'asc' },
      take: 10
    });

    const sinavTrend = sinavOturumlari.map((oturum, i) => ({
      sinav: `Sınav ${i + 1}`,
      baslik: oturum.sinav.baslik,
      ders: oturum.sinav.course?.ad || oturum.sinav.dersAdi || 'Genel Deneme',
      puan: oturum.yuzde || 0
    }));

    // Ders bazlı başarı
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

    // Yoklama durumu
    const yoklamalar = await prisma.yoklama.groupBy({
      by: ['durum'],
      where: { ogrenciId },
      _count: true
    });

    const yoklamaData = {
      katildi: yoklamalar.find(y => y.durum === 'KATILDI')?._count || 0,
      katilmadi: yoklamalar.find(y => y.durum === 'KATILMADI')?._count || 0,
      gec: yoklamalar.find(y => y.durum === 'GEC_KALDI')?._count || 0
    };

    // Ödev durumu
    const odevTeslimler = await prisma.odevTeslim.findMany({
      where: { ogrenciId },
      include: {
        odev: { select: { baslik: true, maxPuan: true } }
      }
    });

    const odevData = {
      tamamlanan: odevTeslimler.filter(t => t.teslimTarihi).length,
      bekleyen: odevTeslimler.filter(t => !t.teslimTarihi).length,
      ortalamaPuan: odevTeslimler.filter(t => t.puan).length > 0
        ? Math.round(odevTeslimler.filter(t => t.puan).reduce((sum, t) => sum + (t.puan || 0), 0) / odevTeslimler.filter(t => t.puan).length)
        : 0
    };

    // Haftalık çalışma (son 4 hafta aktivite)
    const haftalikAktivite: any[] = [];
    for (let i = 3; i >= 0; i--) {
      const haftaBaslangic = new Date();
      haftaBaslangic.setDate(haftaBaslangic.getDate() - (i * 7 + 7));
      const haftaBitis = new Date();
      haftaBitis.setDate(haftaBitis.getDate() - (i * 7));

      const [sinavSayisi, odevSayisi] = await Promise.all([
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
      ]);

      haftalikAktivite.push({
        hafta: `${4 - i}. Hafta`,
        sinav: sinavSayisi,
        odev: odevSayisi
      });
    }

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

