import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { pushService } from '../services/push.service';

const prisma = new PrismaClient();

// Veli Dashboard - Ana sayfa verileri
export const getVeliDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;

    // Velinin çocuklarını getir
    const cocuklar = await prisma.user.findMany({
      where: {
        veliId: veliId,
        role: 'ogrenci',
        aktif: true
      },
      select: {
        id: true,
        ad: true,
        soyad: true,
        ogrenciNo: true,
        sinif: {
          select: {
            id: true,
            ad: true,
            seviye: true,
            tip: true
          }
        },
        kurs: {
          select: {
            id: true,
            ad: true
          }
        }
      }
    });

    // Her çocuk için özet bilgileri topla
    const cocukOzetleri = await Promise.all(
      cocuklar.map(async (cocuk) => {
        // Son 30 gündeki devamsızlık
        const otuzGunOnce = new Date();
        otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

        const devamsizlikSayisi = await prisma.yoklama.count({
          where: {
            ogrenciId: cocuk.id,
            durum: 'KATILMADI',
            tarih: { gte: otuzGunOnce }
          }
        });

        // Bekleyen ödevler
        const bekleyenOdevler = await prisma.odevTeslim.count({
          where: {
            ogrenciId: cocuk.id,
            durum: 'BEKLEMEDE'
          }
        });

        // Teslim edilmemiş ödevler
        const teslimEdilmemisOdevler = await prisma.odev.count({
          where: {
            course: {
              kayitlar: {
                some: {
                  ogrenciId: cocuk.id,
                  aktif: true
                }
              }
            },
            sonTeslimTarihi: { gte: new Date() },
            aktif: true,
            teslimler: {
              none: {
                ogrenciId: cocuk.id
              }
            }
          }
        });

        // Son 5 sınav sonucu ortalaması
        const sonSinavlar = await prisma.examResult.findMany({
          where: { ogrenciId: cocuk.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            puan: true,
            exam: {
              select: {
                toplamPuan: true
              }
            }
          }
        });

        const sinavOrtalamasi = sonSinavlar.length > 0
          ? sonSinavlar.reduce((acc, s) => acc + (s.puan / s.exam.toplamPuan * 100), 0) / sonSinavlar.length
          : null;

        return {
          ...cocuk,
          ozet: {
            devamsizlikSayisi,
            bekleyenOdevler,
            teslimEdilmemisOdevler,
            sinavOrtalamasi: sinavOrtalamasi ? Math.round(sinavOrtalamasi) : null
          }
        };
      })
    );

    // Son bildirimler
    const sonBildirimler = await prisma.notification.findMany({
      where: {
        userId: veliId,
        okundu: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Son duyurular (velilere yönelik)
    const sonDuyurular = await prisma.duyuru.findMany({
      where: {
        aktif: true,
        OR: [
          { hedef: 'HERKESE' },
          { hedef: 'VELILER' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        baslik: true,
        oncelik: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        cocuklar: cocukOzetleri,
        bildirimler: sonBildirimler,
        duyurular: sonDuyurular
      }
    });
  } catch (error) {
    console.error('Veli dashboard hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun detaylı bilgilerini getir
export const getCocukDetay = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      },
      include: {
        sinif: true,
        kurs: true
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    res.json({
      success: true,
      data: cocuk
    });
  } catch (error) {
    console.error('Çocuk detay hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun notlarını getir
export const getCocukNotlar = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Sınav sonuçlarını getir
    const sinavSonuclari = await prisma.examResult.findMany({
      where: { ogrenciId: cocukId },
      include: {
        exam: {
          include: {
            course: {
              select: {
                id: true,
                ad: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ders bazlı grupla
    const dersBazliNotlar = sinavSonuclari.reduce((acc: any, sonuc) => {
      const dersId = sonuc.exam.course.id;
      const dersAd = sonuc.exam.course.ad;
      
      if (!acc[dersId]) {
        acc[dersId] = {
          dersId,
          dersAd,
          sinavlar: [],
          ortalama: 0
        };
      }
      
      acc[dersId].sinavlar.push({
        id: sonuc.id,
        sinavAd: sonuc.exam.ad,
        tip: sonuc.exam.tip,
        tarih: sonuc.exam.tarih,
        puan: sonuc.puan,
        toplamPuan: sonuc.exam.toplamPuan,
        yuzde: sonuc.yuzde,
        dogru: sonuc.dogru,
        yanlis: sonuc.yanlis,
        bos: sonuc.bos
      });
      
      return acc;
    }, {});

    // Ortalamaları hesapla
    Object.values(dersBazliNotlar).forEach((ders: any) => {
      const toplamYuzde = ders.sinavlar.reduce((sum: number, s: any) => sum + (s.puan / s.toplamPuan * 100), 0);
      ders.ortalama = Math.round(toplamYuzde / ders.sinavlar.length);
    });

    res.json({
      success: true,
      data: {
        cocuk: { id: cocuk.id, ad: cocuk.ad, soyad: cocuk.soyad },
        dersler: Object.values(dersBazliNotlar)
      }
    });
  } catch (error) {
    console.error('Çocuk notları hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun devamsızlık kayıtlarını getir
export const getCocukDevamsizlik = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Yoklama kayıtlarını getir
    const yoklamalar = await prisma.yoklama.findMany({
      where: { ogrenciId: cocukId },
      include: {
        course: {
          select: {
            id: true,
            ad: true
          }
        }
      },
      orderBy: { tarih: 'desc' }
    });

    // İstatistikler
    const istatistikler = {
      toplam: yoklamalar.length,
      katildi: yoklamalar.filter(y => y.durum === 'KATILDI').length,
      katilmadi: yoklamalar.filter(y => y.durum === 'KATILMADI').length,
      gecKaldi: yoklamalar.filter(y => y.durum === 'GEC_KALDI').length,
      izinli: yoklamalar.filter(y => y.durum === 'IZINLI').length
    };

    res.json({
      success: true,
      data: {
        cocuk: { id: cocuk.id, ad: cocuk.ad, soyad: cocuk.soyad },
        yoklamalar,
        istatistikler
      }
    });
  } catch (error) {
    console.error('Çocuk devamsızlık hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun ödevlerini getir
export const getCocukOdevler = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Öğrencinin kayıtlı olduğu derslerin ödevleri
    const odevler = await prisma.odev.findMany({
      where: {
        course: {
          kayitlar: {
            some: {
              ogrenciId: cocukId,
              aktif: true
            }
          }
        },
        aktif: true
      },
      include: {
        course: {
          select: {
            id: true,
            ad: true
          }
        },
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        },
        teslimler: {
          where: { ogrenciId: cocukId },
          select: {
            id: true,
            durum: true,
            puan: true,
            teslimTarihi: true,
            ogretmenYorumu: true
          }
        }
      },
      orderBy: { sonTeslimTarihi: 'desc' }
    });

    // Ödevleri duruma göre grupla
    const odevDurum = odevler.map(odev => {
      const teslim = odev.teslimler[0];
      let durum: string;
      
      if (!teslim) {
        durum = new Date(odev.sonTeslimTarihi) < new Date() ? 'GECMIS' : 'BEKLIYOR';
      } else {
        durum = teslim.durum;
      }

      return {
        id: odev.id,
        baslik: odev.baslik,
        aciklama: odev.aciklama,
        ders: odev.course,
        ogretmen: odev.ogretmen,
        sonTeslimTarihi: odev.sonTeslimTarihi,
        maxPuan: odev.maxPuan,
        durum,
        teslim: teslim || null
      };
    });

    res.json({
      success: true,
      data: {
        cocuk: { id: cocuk.id, ad: cocuk.ad, soyad: cocuk.soyad },
        odevler: odevDurum
      }
    });
  } catch (error) {
    console.error('Çocuk ödevler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun ders programını getir
export const getCocukDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Öğrencinin kayıtlı olduğu dersler
    const dersler = await prisma.course.findMany({
      where: {
        kayitlar: {
          some: {
            ogrenciId: cocukId,
            aktif: true
          }
        },
        aktif: true
      },
      include: {
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        }
      },
      orderBy: [
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    // Günlere göre grupla
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const dersProgram = gunler.reduce((acc: any, gun) => {
      acc[gun] = dersler.filter(d => d.gun === gun).map(d => ({
        id: d.id,
        ad: d.ad,
        ogretmen: d.ogretmen,
        baslangicSaati: d.baslangicSaati,
        bitisSaati: d.bitisSaati
      }));
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        cocuk: { id: cocuk.id, ad: cocuk.ad, soyad: cocuk.soyad },
        dersProgram
      }
    });
  } catch (error) {
    console.error('Çocuk ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Çocuğun öğretmenleriyle mesajlaşma - Öğretmenleri listele
export const getCocukOgretmenler = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { cocukId } = req.params;

    // Çocuğun bu veliye ait olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Öğrencinin öğretmenlerini getir
    const dersler = await prisma.course.findMany({
      where: {
        kayitlar: {
          some: {
            ogrenciId: cocukId,
            aktif: true
          }
        },
        aktif: true
      },
      include: {
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            brans: true
          }
        }
      }
    });

    // Benzersiz öğretmenler
    const ogretmenMap = new Map();
    dersler.forEach(ders => {
      if (!ogretmenMap.has(ders.ogretmen.id)) {
        ogretmenMap.set(ders.ogretmen.id, {
          ...ders.ogretmen,
          dersler: []
        });
      }
      ogretmenMap.get(ders.ogretmen.id).dersler.push(ders.ad);
    });

    res.json({
      success: true,
      data: {
        cocuk: { id: cocuk.id, ad: cocuk.ad, soyad: cocuk.soyad },
        ogretmenler: Array.from(ogretmenMap.values())
      }
    });
  } catch (error) {
    console.error('Çocuk öğretmenler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Veli - Öğretmen mesajlaşma başlat/devam et
export const startConversationWithTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const veliId = req.user?.id;
    const { ogretmenId, cocukId } = req.body;

    // Velinin bu öğrencinin velisi olduğunu doğrula
    const cocuk = await prisma.user.findFirst({
      where: {
        id: cocukId,
        veliId: veliId,
        role: 'ogrenci'
      }
    });

    if (!cocuk) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Öğretmenin bu öğrencinin öğretmeni olduğunu doğrula
    const ogretmenDersi = await prisma.course.findFirst({
      where: {
        ogretmenId: ogretmenId,
        kayitlar: {
          some: {
            ogrenciId: cocukId,
            aktif: true
          }
        }
      }
    });

    if (!ogretmenDersi) {
      return res.status(403).json({ success: false, message: 'Bu öğretmenle iletişim kurulamaz' });
    }

    // Mevcut konuşma var mı kontrol et
    const mevcutKonusma = await prisma.conversation.findFirst({
      where: {
        tip: 'OZEL',
        AND: [
          { uyeler: { some: { userId: veliId } } },
          { uyeler: { some: { userId: ogretmenId } } }
        ]
      }
    });

    if (mevcutKonusma) {
      return res.json({
        success: true,
        data: { conversationId: mevcutKonusma.id, existing: true }
      });
    }

    // Yeni konuşma oluştur
    const yeniKonusma = await prisma.conversation.create({
      data: {
        tip: 'OZEL',
        olusturanId: veliId,
        uyeler: {
          create: [
            { userId: veliId! },
            { userId: ogretmenId }
          ]
        }
      }
    });

    res.json({
      success: true,
      data: { conversationId: yeniKonusma.id, existing: false }
    });
  } catch (error) {
    console.error('Konuşma başlatma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Veliye çocuk ekleme (admin/mudur tarafından)
export const addCocukToVeli = async (req: AuthRequest, res: Response) => {
  try {
    const { veliId, ogrenciId } = req.body;

    // Veli ve öğrenciyi doğrula
    const veli = await prisma.user.findFirst({
      where: { id: veliId, role: 'veli' }
    });

    const ogrenci = await prisma.user.findFirst({
      where: { id: ogrenciId, role: 'ogrenci' }
    });

    if (!veli) {
      return res.status(404).json({ success: false, message: 'Veli bulunamadı' });
    }

    if (!ogrenci) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // Öğrenciyi veliye bağla
    await prisma.user.update({
      where: { id: ogrenciId },
      data: { veliId: veliId }
    });

    // Veliye bildirim gönder
    await pushService.sendToUser(veliId, {
      title: 'Öğrenci Eklendi',
      body: `${ogrenci.ad} ${ogrenci.soyad} artık takip listenizde`
    });

    res.json({
      success: true,
      message: 'Öğrenci veliye başarıyla bağlandı'
    });
  } catch (error) {
    console.error('Çocuk ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

