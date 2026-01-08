import { Response } from 'express';
import prisma from '../lib/prisma';
import { YoklamaDurum } from '@prisma/client';
import { AuthRequest } from '../types';
import { pushService } from '../services/push.service';
import { emailService } from '../services/email.service';

// ==================== ÖĞRETMEN İŞLEMLERİ ====================

// Öğretmenin derslerini getir (yoklama almak için)
export const getTeacherCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const courses = await prisma.course.findMany({
      where: { ogretmenId: userId, aktif: true },
      include: {
        sinif: {
          select: { id: true, ad: true, seviye: true },
          include: {
            ogrenciler: {
              where: { aktif: true, role: 'ogrenci' },
              select: { id: true, ad: true, soyad: true, ogrenciNo: true }
            }
          }
        }
      },
      orderBy: [{ gun: 'asc' }, { baslangicSaati: 'asc' }]
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Dersler alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Belirli bir ders için bugünün yoklamasını getir
export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;
    const { tarih } = req.query; // Opsiyonel: belirli bir tarih için

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Dersin bu öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId },
      include: {
        sinif: {
          include: {
            ogrenciler: {
              where: { aktif: true, role: 'ogrenci' },
              select: { id: true, ad: true, soyad: true, ogrenciNo: true }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse erişim yetkiniz yok' });
    }

    // Tarih hesapla (gün başlangıcı - gün sonu)
    const queryDate = tarih ? new Date(tarih as string) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Mevcut yoklama kayıtlarını getir
    const yoklamalar = await prisma.yoklama.findMany({
      where: {
        courseId,
        tarih: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Öğrenci listesiyle birleştir
    const ogrenciYoklamalari = course.sinif.ogrenciler.map(ogrenci => {
      const yoklama = yoklamalar.find(y => y.ogrenciId === ogrenci.id);
      return {
        ogrenciId: ogrenci.id,
        ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`,
        ogrenciNo: ogrenci.ogrenciNo,
        durum: yoklama?.durum || null,
        aciklama: yoklama?.aciklama || null,
        yoklamaId: yoklama?.id || null
      };
    });

    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          ad: course.ad,
          sinif: course.sinif.ad,
          gun: course.gun,
          saat: `${course.baslangicSaati} - ${course.bitisSaati}`
        },
        tarih: startOfDay.toISOString().split('T')[0],
        ogrenciler: ogrenciYoklamalari,
        istatistik: {
          toplam: ogrenciYoklamalari.length,
          katildi: ogrenciYoklamalari.filter(o => o.durum === 'KATILDI').length,
          katilmadi: ogrenciYoklamalari.filter(o => o.durum === 'KATILMADI').length,
          gecKaldi: ogrenciYoklamalari.filter(o => o.durum === 'GEC_KALDI').length,
          izinli: ogrenciYoklamalari.filter(o => o.durum === 'IZINLI').length,
          bekleyen: ogrenciYoklamalari.filter(o => o.durum === null).length
        }
      }
    });
  } catch (error) {
    console.error('Yoklama alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Toplu yoklama kaydet
export const saveAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;
    const { yoklamalar, tarih } = req.body;
    // yoklamalar: [{ ogrenciId, durum, aciklama? }]

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!yoklamalar || !Array.isArray(yoklamalar)) {
      return res.status(400).json({ success: false, error: 'Yoklama verileri gerekli' });
    }

    // Dersin bu öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId },
      include: {
        sinif: true,
        ogretmen: { select: { ad: true, soyad: true } }
      }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse erişim yetkiniz yok' });
    }

    const yoklamaTarihi = tarih ? new Date(tarih) : new Date();
    yoklamaTarihi.setHours(12, 0, 0, 0); // Gün ortasına ayarla (timezone sorunlarını önlemek için)

    // Mevcut yoklamaları sil ve yeniden oluştur (upsert yerine)
    const startOfDay = new Date(yoklamaTarihi);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yoklamaTarihi);
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.yoklama.deleteMany({
      where: {
        courseId,
        tarih: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Yeni yoklamaları oluştur
    const yeniYoklamalar = await prisma.yoklama.createMany({
      data: yoklamalar.map((y: { ogrenciId: string; durum: YoklamaDurum; aciklama?: string }) => ({
        ogrenciId: y.ogrenciId,
        courseId,
        tarih: yoklamaTarihi,
        durum: y.durum,
        aciklama: y.aciklama || null
      }))
    });

    // Devamsız öğrencilerin velilerine bildirim gönder
    const devamsizlar = yoklamalar.filter(
      (y: { durum: YoklamaDurum }) => y.durum === 'KATILMADI'
    );

    if (devamsizlar.length > 0) {
      // Devamsız öğrencilerin bilgilerini al
      const devamsizOgrenciler = await prisma.user.findMany({
        where: {
          id: { in: devamsizlar.map((d: { ogrenciId: string }) => d.ogrenciId) }
        },
        select: {
          id: true,
          ad: true,
          soyad: true,
          veliEmail: true,
          veliTelefon: true,
          veliAd: true
        }
      });

      // Her devamsız öğrenci için
      for (const ogrenci of devamsizOgrenciler) {
        // Öğrenciye bildirim
        await prisma.notification.create({
          data: {
            userId: ogrenci.id,
            tip: 'BILDIRIM',
            baslik: '⚠️ Devamsızlık Kaydı',
            mesaj: `${course.ad} dersinde devamsızlık kaydınız girildi. Tarih: ${yoklamaTarihi.toLocaleDateString('tr-TR')}`
          }
        });

        // Veliye e-posta (eğer varsa)
        if (ogrenci.veliEmail) {
          // E-posta servisi ile bildirim (arka planda)
          // Not: Bu fonksiyonu email.service.ts'e ekleyeceğiz
        }
      }

      // Push notification gönder
      pushService.sendToUsers(
        devamsizlar.map((d: { ogrenciId: string }) => d.ogrenciId),
        {
          title: '⚠️ Devamsızlık Kaydı',
          body: `${course.ad} dersinde devamsızlık kaydınız girildi`,
          click_action: '/tr/ogrenci/devamsizlik',
          data: {
            type: 'ATTENDANCE_ABSENT',
            courseId,
            tarih: yoklamaTarihi.toISOString()
          }
        }
      ).catch(err => console.error('Push notification hatası:', err));
    }

    res.json({
      success: true,
      message: `${yeniYoklamalar.count} öğrenci için yoklama kaydedildi`,
      data: {
        kayitSayisi: yeniYoklamalar.count,
        devamsizSayisi: devamsizlar.length
      }
    });
  } catch (error) {
    console.error('Yoklama kaydedilirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Tek öğrenci yoklama güncelle
export const updateSingleAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId, ogrenciId } = req.params;
    const { durum, aciklama, tarih } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!durum) {
      return res.status(400).json({ success: false, error: 'Durum gerekli' });
    }

    // Dersin bu öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse erişim yetkiniz yok' });
    }

    const yoklamaTarihi = tarih ? new Date(tarih) : new Date();
    yoklamaTarihi.setHours(12, 0, 0, 0);

    // Upsert yoklama
    const startOfDay = new Date(yoklamaTarihi);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yoklamaTarihi);
    endOfDay.setHours(23, 59, 59, 999);

    // Mevcut yoklamayı bul
    const mevcutYoklama = await prisma.yoklama.findFirst({
      where: {
        ogrenciId,
        courseId,
        tarih: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    let yoklama;
    if (mevcutYoklama) {
      yoklama = await prisma.yoklama.update({
        where: { id: mevcutYoklama.id },
        data: { durum, aciklama }
      });
    } else {
      yoklama = await prisma.yoklama.create({
        data: {
          ogrenciId,
          courseId,
          tarih: yoklamaTarihi,
          durum,
          aciklama
        }
      });
    }

    res.json({ success: true, data: yoklama });
  } catch (error) {
    console.error('Yoklama güncellenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Yoklama geçmişi (öğretmen için)
export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;
    const { baslangic, bitis } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Dersin bu öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse erişim yetkiniz yok' });
    }

    // Tarih aralığı (varsayılan: son 30 gün)
    const endDate = bitis ? new Date(bitis as string) : new Date();
    const startDate = baslangic 
      ? new Date(baslangic as string) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const yoklamalar = await prisma.yoklama.findMany({
      where: {
        courseId,
        tarih: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        ogrenci: {
          select: { id: true, ad: true, soyad: true, ogrenciNo: true }
        }
      },
      orderBy: { tarih: 'desc' }
    });

    // Tarihe göre grupla
    const grouped = yoklamalar.reduce((acc, y) => {
      const tarihStr = y.tarih.toISOString().split('T')[0];
      if (!acc[tarihStr]) {
        acc[tarihStr] = [];
      }
      acc[tarihStr].push({
        ogrenciId: y.ogrenci.id,
        ogrenciAd: `${y.ogrenci.ad} ${y.ogrenci.soyad}`,
        ogrenciNo: y.ogrenci.ogrenciNo,
        durum: y.durum,
        aciklama: y.aciklama
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Yoklama geçmişi alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ İŞLEMLERİ ====================

// Öğrencinin devamsızlık kayıtlarını getir
export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Son 3 ayın yoklama kayıtlarını getir
    const uchAyOnce = new Date();
    uchAyOnce.setMonth(uchAyOnce.getMonth() - 3);

    const yoklamalar = await prisma.yoklama.findMany({
      where: {
        ogrenciId: userId,
        tarih: { gte: uchAyOnce }
      },
      include: {
        course: {
          select: { id: true, ad: true, gun: true }
        }
      },
      orderBy: { tarih: 'desc' }
    });

    // İstatistikler
    const istatistik = {
      toplam: yoklamalar.length,
      katildi: yoklamalar.filter(y => y.durum === 'KATILDI').length,
      katilmadi: yoklamalar.filter(y => y.durum === 'KATILMADI').length,
      gecKaldi: yoklamalar.filter(y => y.durum === 'GEC_KALDI').length,
      izinli: yoklamalar.filter(y => y.durum === 'IZINLI').length,
      devamsizlikOrani: 0
    };

    if (istatistik.toplam > 0) {
      istatistik.devamsizlikOrani = Math.round(
        ((istatistik.katilmadi + istatistik.gecKaldi) / istatistik.toplam) * 100
      );
    }

    // Derse göre grupla
    const dersBazli = yoklamalar.reduce((acc, y) => {
      if (!acc[y.courseId]) {
        acc[y.courseId] = {
          dersAd: y.course.ad,
          gun: y.course.gun,
          kayitlar: [],
          katildi: 0,
          katilmadi: 0,
          gecKaldi: 0,
          izinli: 0
        };
      }
      acc[y.courseId].kayitlar.push({
        tarih: y.tarih,
        durum: y.durum,
        aciklama: y.aciklama
      });
      if (y.durum === 'KATILDI') acc[y.courseId].katildi++;
      if (y.durum === 'KATILMADI') acc[y.courseId].katilmadi++;
      if (y.durum === 'GEC_KALDI') acc[y.courseId].gecKaldi++;
      if (y.durum === 'IZINLI') acc[y.courseId].izinli++;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: {
        istatistik,
        dersBazli: Object.values(dersBazli),
        sonKayitlar: yoklamalar.slice(0, 20).map(y => ({
          tarih: y.tarih,
          dersAd: y.course.ad,
          durum: y.durum,
          aciklama: y.aciklama
        }))
      }
    });
  } catch (error) {
    console.error('Öğrenci devamsızlık alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== QR KOD İLE YOKLAMA ====================

// QR kod için yoklama token oluştur
export const generateQRToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Dersin bu öğretmene ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, ogretmenId: userId }
    });

    if (!course) {
      return res.status(403).json({ success: false, error: 'Bu derse erişim yetkiniz yok' });
    }

    // Token oluştur (10 dakika geçerli)
    const token = Buffer.from(JSON.stringify({
      courseId,
      ogretmenId: userId,
      timestamp: Date.now(),
      expires: Date.now() + 10 * 60 * 1000 // 10 dakika
    })).toString('base64');

    res.json({
      success: true,
      data: {
        token,
        courseId,
        courseAd: course.ad,
        expiresIn: 600 // saniye
      }
    });
  } catch (error) {
    console.error('QR token oluşturulurken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// QR kod ile yoklama kaydet (öğrenci tarafından)
export const submitQRAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token gerekli' });
    }

    // Token'ı decode et
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch {
      return res.status(400).json({ success: false, error: 'Geçersiz token' });
    }

    // Token süresini kontrol et
    if (Date.now() > decoded.expires) {
      return res.status(400).json({ success: false, error: 'Token süresi dolmuş' });
    }

    // Öğrencinin bu derse kayıtlı olup olmadığını kontrol et
    const ogrenci = await prisma.user.findFirst({
      where: { id: userId, role: 'ogrenci' },
      include: {
        sinif: {
          include: {
            dersler: {
              where: { id: decoded.courseId }
            }
          }
        }
      }
    });

    if (!ogrenci || !ogrenci.sinif?.dersler.length) {
      return res.status(403).json({ success: false, error: 'Bu derse kayıtlı değilsiniz' });
    }

    // Bugün için yoklama var mı kontrol et
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const yarinBaslangici = new Date(bugun);
    yarinBaslangici.setDate(yarinBaslangici.getDate() + 1);

    const mevcutYoklama = await prisma.yoklama.findFirst({
      where: {
        ogrenciId: userId,
        courseId: decoded.courseId,
        tarih: {
          gte: bugun,
          lt: yarinBaslangici
        }
      }
    });

    if (mevcutYoklama) {
      return res.status(400).json({ success: false, error: 'Bugün için zaten yoklama kaydınız var' });
    }

    // Yoklama kaydı oluştur
    const yoklama = await prisma.yoklama.create({
      data: {
        ogrenciId: userId,
        courseId: decoded.courseId,
        tarih: new Date(),
        durum: 'KATILDI'
      },
      include: {
        course: { select: { ad: true } }
      }
    });

    res.json({
      success: true,
      message: `${yoklama.course.ad} dersi için yoklamanız alındı`,
      data: yoklama
    });
  } catch (error) {
    console.error('QR yoklama kaydedilirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== PERSONEL (SEKRETER) İŞLEMLERİ ====================

// Kursa ait tüm dersleri ve yoklama özetini getir
export const getPersonelYoklamaListesi = async (req: AuthRequest, res: Response) => {
  try {
    const kursId = req.user?.kursId;
    const { sinifId } = req.query;

    if (!kursId) {
      return res.status(403).json({ success: false, error: 'Kurs bilgisi bulunamadı' });
    }

    // Kursa ait tüm dersleri getir
    const whereClause: Record<string, unknown> = {
      sinif: { kursId },
      aktif: true
    };

    if (sinifId) {
      whereClause.sinifId = sinifId;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        sinif: {
          select: { id: true, ad: true, seviye: true }
        },
        ogretmen: {
          select: { id: true, ad: true, soyad: true }
        },
        yoklamalar: {
          where: {
            tarih: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      },
      orderBy: [
        { sinif: { seviye: 'asc' } },
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    // Sınıfları da getir (filtreleme için)
    const siniflar = await prisma.sinif.findMany({
      where: { kursId, aktif: true },
      select: { id: true, ad: true, seviye: true },
      orderBy: { seviye: 'asc' }
    });

    const data = courses.map(course => ({
      id: course.id,
      ad: course.ad,
      sinif: course.sinif,
      ogretmen: course.ogretmen,
      gun: course.gun,
      baslangicSaati: course.baslangicSaati,
      bitisSaati: course.bitisSaati,
      bugunYoklamaAlindi: course.yoklamalar.length > 0,
      bugunKatilanSayisi: course.yoklamalar.filter(y => y.durum === 'KATILDI').length,
      bugunKatilmayanSayisi: course.yoklamalar.filter(y => y.durum === 'KATILMADI').length
    }));

    res.json({
      success: true,
      data: {
        dersler: data,
        siniflar
      }
    });
  } catch (error) {
    console.error('Personel yoklama listesi hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Belirli bir ders için detaylı yoklama bilgisi
export const getPersonelYoklamaDetay = async (req: AuthRequest, res: Response) => {
  try {
    const kursId = req.user?.kursId;
    const { courseId } = req.params;
    const { tarih } = req.query;

    if (!kursId) {
      return res.status(403).json({ success: false, error: 'Kurs bilgisi bulunamadı' });
    }

    // Dersin kursa ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, sinif: { kursId } },
      include: {
        sinif: {
          include: {
            ogrenciler: {
              where: { aktif: true, role: 'ogrenci' },
              select: { id: true, ad: true, soyad: true, ogrenciNo: true }
            }
          }
        },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Ders bulunamadı' });
    }

    // Tarih hesapla
    const queryDate = tarih ? new Date(tarih as string) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Yoklamaları getir
    const yoklamalar = await prisma.yoklama.findMany({
      where: {
        courseId,
        tarih: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Öğrenci listesiyle birleştir
    const ogrenciYoklamalari = course.sinif.ogrenciler.map(ogrenci => {
      const yoklama = yoklamalar.find(y => y.ogrenciId === ogrenci.id);
      return {
        ogrenciId: ogrenci.id,
        ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`,
        ogrenciNo: ogrenci.ogrenciNo,
        durum: yoklama?.durum || null,
        aciklama: yoklama?.aciklama || null,
        yoklamaId: yoklama?.id || null
      };
    });

    // İstatistikler
    const istatistik = {
      toplam: ogrenciYoklamalari.length,
      katildi: ogrenciYoklamalari.filter(o => o.durum === 'KATILDI').length,
      katilmadi: ogrenciYoklamalari.filter(o => o.durum === 'KATILMADI').length,
      gecKaldi: ogrenciYoklamalari.filter(o => o.durum === 'GEC_KALDI').length,
      izinli: ogrenciYoklamalari.filter(o => o.durum === 'IZINLI').length,
      belirsiz: ogrenciYoklamalari.filter(o => !o.durum).length
    };

    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          ad: course.ad,
          sinif: course.sinif,
          ogretmen: course.ogretmen,
          gun: course.gun,
          baslangicSaati: course.baslangicSaati,
          bitisSaati: course.bitisSaati
        },
        tarih: startOfDay,
        ogrenciYoklamalari,
        istatistik
      }
    });
  } catch (error) {
    console.error('Personel yoklama detay hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Personel yoklama güncelleme
export const personelYoklamaGuncelle = async (req: AuthRequest, res: Response) => {
  try {
    const kursId = req.user?.kursId;
    const { courseId, ogrenciId } = req.params;
    const { durum, aciklama, tarih } = req.body;

    if (!kursId) {
      return res.status(403).json({ success: false, error: 'Kurs bilgisi bulunamadı' });
    }

    // Dersin kursa ait olduğunu kontrol et
    const course = await prisma.course.findFirst({
      where: { id: courseId, sinif: { kursId } }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Ders bulunamadı' });
    }

    // Tarih hesapla
    const queryDate = tarih ? new Date(tarih) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Mevcut yoklama kaydı var mı kontrol et
    const mevcutYoklama = await prisma.yoklama.findFirst({
      where: {
        ogrenciId,
        courseId,
        tarih: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    let yoklama;
    if (mevcutYoklama) {
      // Güncelle
      yoklama = await prisma.yoklama.update({
        where: { id: mevcutYoklama.id },
        data: {
          durum: durum as YoklamaDurum,
          aciklama
        }
      });
    } else {
      // Yeni kayıt oluştur
      yoklama = await prisma.yoklama.create({
        data: {
          ogrenciId,
          courseId,
          tarih: new Date(),
          durum: durum as YoklamaDurum,
          aciklama
        }
      });
    }

    res.json({
      success: true,
      message: 'Yoklama güncellendi',
      data: yoklama
    });
  } catch (error) {
    console.error('Personel yoklama güncelleme hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

