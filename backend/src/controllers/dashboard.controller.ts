import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ==================== MÜDÜR/ADMİN DASHBOARD ====================

export const getMudurDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
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
    const gunlukYoklama = [];
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

    const teslimEdilen = await prisma.odevTeslim.count({
      where: { teslimTarihi: { not: null } }
    });

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
    const ogretmenId = req.user?.userId;

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
    const haftalikYoklama = [];
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
      ders: sinav.course.ad,
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

// ==================== ÖĞRENCİ İLERLEME ====================

export const getOgrenciIlerleme = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.userId;

    // Sınav sonuçları (trend)
    const sinavOturumlari = await prisma.sinavOturumu.findMany({
      where: { ogrenciId, tamamlandi: true },
      include: {
        sinav: {
          select: { baslik: true, course: { select: { ad: true } } }
        }
      },
      orderBy: { bitisZamani: 'asc' },
      take: 10
    });

    const sinavTrend = sinavOturumlari.map((oturum, i) => ({
      sinav: `Sınav ${i + 1}`,
      baslik: oturum.sinav.baslik,
      ders: oturum.sinav.course.ad,
      puan: oturum.yuzde || 0
    }));

    // Ders bazlı başarı
    const dersBasari: Record<string, { toplam: number; puan: number }> = {};
    sinavOturumlari.forEach(oturum => {
      const ders = oturum.sinav.course.ad;
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
        odev: { select: { baslik: true, puan: true } }
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
    const haftalikAktivite = [];
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

