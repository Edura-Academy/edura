import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { parseCSV, parseJSON, generateCSVTemplate, generateJSONTemplate } from '../services/denemeImport.service';

// Prisma tipi için yardımcı tip
type DenemeSonucWithOgrenci = Awaited<ReturnType<typeof prisma.denemeSonucu.findMany<{
  include: { ogrenci: { select: { sinifId: true; kursId: true } } }
}>>>[number];

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    kursId?: string;
  };
}

// ==================== TÜR BAZLI BRANŞ TANIMLARI ====================

// Net hesaplama formülü: Doğru - (Yanlış / 4)
const hesaplaNet = (dogru: number, yanlis: number): number => {
  return Math.round((dogru - yanlis / 4) * 100) / 100;
};

// TYT için varsayılan branşlar ve soru sayıları
export const TYT_BRANSLAR = {
  TYT_TURKCE: { ad: 'Türkçe', soruSayisi: 40 },
  TYT_MATEMATIK: { ad: 'Matematik', soruSayisi: 40 },
  TYT_SOSYAL: { ad: 'Sosyal Bilimler', soruSayisi: 20 },
  TYT_FEN: { ad: 'Fen Bilimleri', soruSayisi: 20 },
};

// AYT için varsayılan branşlar ve soru sayıları
export const AYT_BRANSLAR = {
  AYT_MATEMATIK: { ad: 'Matematik', soruSayisi: 40 },
  AYT_FIZIK: { ad: 'Fizik', soruSayisi: 14 },
  AYT_KIMYA: { ad: 'Kimya', soruSayisi: 13 },
  AYT_BIYOLOJI: { ad: 'Biyoloji', soruSayisi: 13 },
  AYT_EDEBIYAT: { ad: 'Türk Dili ve Edebiyatı', soruSayisi: 24 },
  AYT_TARIH1: { ad: 'Tarih-1', soruSayisi: 10 },
  AYT_COGRAFYA1: { ad: 'Coğrafya-1', soruSayisi: 6 },
  AYT_TARIH2: { ad: 'Tarih-2', soruSayisi: 11 },
  AYT_COGRAFYA2: { ad: 'Coğrafya-2', soruSayisi: 11 },
  AYT_FELSEFE: { ad: 'Felsefe Grubu', soruSayisi: 12 },
  AYT_DIN: { ad: 'Din Kültürü', soruSayisi: 6 },
};

// LGS için varsayılan branşlar ve soru sayıları
export const LGS_BRANSLAR = {
  LGS_TURKCE: { ad: 'Türkçe', soruSayisi: 20 },
  LGS_MATEMATIK: { ad: 'Matematik', soruSayisi: 20 },
  LGS_FEN: { ad: 'Fen Bilimleri', soruSayisi: 20 },
  LGS_SOSYAL: { ad: 'Sosyal Bilgiler', soruSayisi: 10 },
  LGS_DIN: { ad: 'Din Kültürü', soruSayisi: 10 },
  LGS_INGILIZCE: { ad: 'İngilizce', soruSayisi: 10 },
};

// ==================== DENEME SINAVI CRUD ====================

// Tüm deneme sınavlarını listele
export const getDenemeSinavlari = async (req: AuthRequest, res: Response) => {
  try {
    const { tur, sinifId, kursId, baslangic, bitis } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userKursId = req.user?.kursId;

    const where: any = { aktif: true };

    // Türe göre filtreleme
    if (tur) {
      where.tur = tur;
    }

    // Sınıfa göre filtreleme
    if (sinifId) {
      where.sinifId = sinifId;
    }

    // Kursa göre filtreleme
    if (kursId) {
      where.kursId = kursId;
    } else if (userRole !== 'admin' && userKursId) {
      // Admin değilse sadece kendi kursundaki sınavları görsün
      where.OR = [
        { kursId: userKursId },
        { kursId: null }
      ];
    }

    // Tarih aralığı
    if (baslangic || bitis) {
      where.tarih = {};
      if (baslangic) where.tarih.gte = new Date(baslangic as string);
      if (bitis) where.tarih.lte = new Date(bitis as string);
    }

    const sinavlar = await prisma.denemeSinavi.findMany({
      where,
      include: {
        sinif: { select: { id: true, ad: true, seviye: true, tip: true } },
        olusturan: { select: { id: true, ad: true, soyad: true } },
        _count: { select: { sonuclar: true } }
      },
      orderBy: { tarih: 'desc' }
    });

    // Branş bilgilerini parse et
    const sinavlarWithParsed = sinavlar.map(sinav => ({
      ...sinav,
      branslar: JSON.parse(sinav.branslarVeSoruSayilari),
      katilimciSayisi: sinav._count.sonuclar
    }));

    res.json({ success: true, data: sinavlarWithParsed });
  } catch (error) {
    console.error('Deneme sınavları listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Tekil deneme sınavı getir
export const getDenemeSinavi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sinav = await prisma.denemeSinavi.findUnique({
      where: { id },
      include: {
        sinif: { select: { id: true, ad: true, seviye: true, tip: true } },
        olusturan: { select: { id: true, ad: true, soyad: true } },
        sonuclar: {
          include: {
            ogrenci: {
              select: { id: true, ad: true, soyad: true, ogrenciNo: true, sinif: { select: { ad: true } } }
            },
            giren: { select: { id: true, ad: true, soyad: true } }
          },
          orderBy: { toplamNet: 'desc' }
        }
      }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Deneme sınavı bulunamadı' });
    }

    // Sonuçları parse et
    const sonuclarWithParsed = sinav.sonuclar.map((sonuc, index) => ({
      ...sonuc,
      branslar: JSON.parse(sonuc.branslarVeSonuclar),
      siraNoCurrent: index + 1
    }));

    res.json({
      success: true,
      data: {
        ...sinav,
        branslar: JSON.parse(sinav.branslarVeSoruSayilari),
        sonuclar: sonuclarWithParsed
      }
    });
  } catch (error) {
    console.error('Deneme sınavı getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Yeni deneme sınavı oluştur
export const createDenemeSinavi = async (req: AuthRequest, res: Response) => {
  try {
    const olusturanId = req.user?.id;
    const { ad, tur, kurum, tarih, sinifId, kursId, branslar, aciklama } = req.body;

    if (!ad || !tur || !tarih) {
      return res.status(400).json({ success: false, message: 'Ad, tür ve tarih zorunludur' });
    }

    // Varsayılan branşları kullan veya custom branşları al
    let branslarVeSoruSayilari = branslar;
    if (!branslar) {
      switch (tur) {
        case 'TYT':
          branslarVeSoruSayilari = Object.fromEntries(
            Object.entries(TYT_BRANSLAR).map(([key, val]) => [key, val.soruSayisi])
          );
          break;
        case 'AYT':
          branslarVeSoruSayilari = Object.fromEntries(
            Object.entries(AYT_BRANSLAR).map(([key, val]) => [key, val.soruSayisi])
          );
          break;
        case 'LGS':
          branslarVeSoruSayilari = Object.fromEntries(
            Object.entries(LGS_BRANSLAR).map(([key, val]) => [key, val.soruSayisi])
          );
          break;
        default:
          return res.status(400).json({ success: false, message: 'Geçersiz sınav türü' });
      }
    }

    const sinav = await prisma.denemeSinavi.create({
      data: {
        ad,
        tur,
        kurum,
        tarih: new Date(tarih),
        sinifId: sinifId || null,
        kursId: kursId || null,
        branslarVeSoruSayilari: JSON.stringify(branslarVeSoruSayilari),
        aciklama,
        olusturanId: olusturanId!
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        olusturan: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...sinav,
        branslar: branslarVeSoruSayilari
      }
    });
  } catch (error) {
    console.error('Deneme sınavı oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Deneme sınavı güncelle
export const updateDenemeSinavi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ad, kurum, tarih, sinifId, kursId, branslar, aciklama, aktif } = req.body;

    const updateData: any = {};
    if (ad !== undefined) updateData.ad = ad;
    if (kurum !== undefined) updateData.kurum = kurum;
    if (tarih !== undefined) updateData.tarih = new Date(tarih);
    if (sinifId !== undefined) updateData.sinifId = sinifId;
    if (kursId !== undefined) updateData.kursId = kursId;
    if (branslar !== undefined) updateData.branslarVeSoruSayilari = JSON.stringify(branslar);
    if (aciklama !== undefined) updateData.aciklama = aciklama;
    if (aktif !== undefined) updateData.aktif = aktif;

    const sinav = await prisma.denemeSinavi.update({
      where: { id },
      data: updateData,
      include: {
        sinif: { select: { id: true, ad: true } },
        olusturan: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.json({
      success: true,
      data: {
        ...sinav,
        branslar: JSON.parse(sinav.branslarVeSoruSayilari)
      }
    });
  } catch (error) {
    console.error('Deneme sınavı güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Deneme sınavı sil
export const deleteDenemeSinavi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.denemeSinavi.delete({ where: { id } });

    res.json({ success: true, message: 'Deneme sınavı silindi' });
  } catch (error) {
    console.error('Deneme sınavı silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== DENEME SONUCU CRUD ====================

// Tek öğrenci sonucu ekle
export const addDenemeSonucu = async (req: AuthRequest, res: Response) => {
  try {
    const girenId = req.user?.id;
    const { sinavId, ogrenciId, branslar, aciklama } = req.body;

    if (!sinavId || !ogrenciId || !branslar) {
      return res.status(400).json({ success: false, message: 'Sınav ID, öğrenci ID ve branş sonuçları zorunludur' });
    }

    // Sınavı kontrol et
    const sinav = await prisma.denemeSinavi.findUnique({ where: { id: sinavId } });
    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Deneme sınavı bulunamadı' });
    }

    // Branşları hesapla
    let toplamDogru = 0;
    let toplamYanlis = 0;
    let toplamBos = 0;
    let toplamNet = 0;

    const branslarWithNet: Record<string, any> = {};

    for (const [brans, sonuc] of Object.entries(branslar as Record<string, { dogru: number; yanlis: number; bos: number }>)) {
      const net = hesaplaNet(sonuc.dogru, sonuc.yanlis);
      branslarWithNet[brans] = {
        ...sonuc,
        net
      };
      toplamDogru += sonuc.dogru;
      toplamYanlis += sonuc.yanlis;
      toplamBos += sonuc.bos;
      toplamNet += net;
    }

    // Mevcut sonuç var mı kontrol et
    const mevcutSonuc = await prisma.denemeSonucu.findUnique({
      where: { sinavId_ogrenciId: { sinavId, ogrenciId } }
    });

    let sonuc;
    if (mevcutSonuc) {
      // Güncelle
      sonuc = await prisma.denemeSonucu.update({
        where: { id: mevcutSonuc.id },
        data: {
          branslarVeSonuclar: JSON.stringify(branslarWithNet),
          toplamDogru,
          toplamYanlis,
          toplamBos,
          toplamNet: Math.round(toplamNet * 100) / 100,
          girenId,
          aciklama
        },
        include: {
          ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
        }
      });
    } else {
      // Yeni oluştur
      sonuc = await prisma.denemeSonucu.create({
        data: {
          sinavId,
          ogrenciId,
          branslarVeSonuclar: JSON.stringify(branslarWithNet),
          toplamDogru,
          toplamYanlis,
          toplamBos,
          toplamNet: Math.round(toplamNet * 100) / 100,
          girenId,
          aciklama
        },
        include: {
          ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
        }
      });
    }

    // Sıralamayı güncelle
    await updateSiralamalar(sinavId);

    res.status(201).json({
      success: true,
      data: {
        ...sonuc,
        branslar: branslarWithNet
      }
    });
  } catch (error) {
    console.error('Deneme sonucu ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Toplu sonuç ekle (Excel/CSV import için)
export const addTopluDenemeSonucu = async (req: AuthRequest, res: Response) => {
  try {
    const girenId = req.user?.id;
    const { sinavId, sonuclar } = req.body;

    if (!sinavId || !sonuclar || !Array.isArray(sonuclar)) {
      return res.status(400).json({ success: false, message: 'Sınav ID ve sonuçlar dizisi zorunludur' });
    }

    // Sınavı kontrol et
    const sinav = await prisma.denemeSinavi.findUnique({ where: { id: sinavId } });
    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Deneme sınavı bulunamadı' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const item of sonuclar) {
      try {
        const { ogrenciId, ogrenciNo, branslar } = item;

        // Öğrenci ID veya öğrenci numarasıyla bul
        let ogrenci;
        if (ogrenciId) {
          ogrenci = await prisma.user.findUnique({ where: { id: ogrenciId } });
        } else if (ogrenciNo) {
          ogrenci = await prisma.user.findFirst({ where: { ogrenciNo, role: 'ogrenci' } });
        }

        if (!ogrenci) {
          errors.push({ ogrenciNo, hata: 'Öğrenci bulunamadı' });
          continue;
        }

        // Branşları hesapla
        let toplamDogru = 0;
        let toplamYanlis = 0;
        let toplamBos = 0;
        let toplamNet = 0;

        const branslarWithNet: Record<string, any> = {};

        for (const [brans, sonuc] of Object.entries(branslar as Record<string, { dogru: number; yanlis: number; bos: number }>)) {
          const net = hesaplaNet(sonuc.dogru, sonuc.yanlis);
          branslarWithNet[brans] = { ...sonuc, net };
          toplamDogru += sonuc.dogru;
          toplamYanlis += sonuc.yanlis;
          toplamBos += sonuc.bos;
          toplamNet += net;
        }

        // Upsert
        const sonuc = await prisma.denemeSonucu.upsert({
          where: { sinavId_ogrenciId: { sinavId, ogrenciId: ogrenci.id } },
          create: {
            sinavId,
            ogrenciId: ogrenci.id,
            branslarVeSonuclar: JSON.stringify(branslarWithNet),
            toplamDogru,
            toplamYanlis,
            toplamBos,
            toplamNet: Math.round(toplamNet * 100) / 100,
            girenId
          },
          update: {
            branslarVeSonuclar: JSON.stringify(branslarWithNet),
            toplamDogru,
            toplamYanlis,
            toplamBos,
            toplamNet: Math.round(toplamNet * 100) / 100,
            girenId
          }
        });

        results.push({ ogrenciId: ogrenci.id, ogrenciNo: ogrenci.ogrenciNo, basarili: true });
      } catch (err) {
        errors.push({ ogrenciNo: item.ogrenciNo, hata: 'İşlem hatası' });
      }
    }

    // Sıralamayı güncelle
    await updateSiralamalar(sinavId);

    res.json({
      success: true,
      data: {
        basarili: results.length,
        hatali: errors.length,
        results,
        errors
      }
    });
  } catch (error) {
    console.error('Toplu sonuç ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sıralama güncelleme yardımcı fonksiyonu
const updateSiralamalar = async (sinavId: string) => {
  try {
    // Tüm sonuçları al ve sırala
    const sonuclar = await prisma.denemeSonucu.findMany({
      where: { sinavId },
      include: {
        ogrenci: { select: { sinifId: true, kursId: true } }
      },
      orderBy: { toplamNet: 'desc' }
    });

    // Genel sıralama
    for (let i = 0; i < sonuclar.length; i++) {
      await prisma.denemeSonucu.update({
        where: { id: sonuclar[i].id },
        data: { genelSiralama: i + 1 }
      });
    }

    // Sınıf bazlı sıralama
    const sinifGruplari: Record<string, DenemeSonucWithOgrenci[]> = {};
    sonuclar.forEach(s => {
      const sinifId = s.ogrenci.sinifId || 'unknown';
      if (!sinifGruplari[sinifId]) sinifGruplari[sinifId] = [];
      sinifGruplari[sinifId].push(s);
    });

    for (const grubuArray of Object.values(sinifGruplari)) {
      grubuArray.sort((a, b) => (b.toplamNet || 0) - (a.toplamNet || 0));
      for (let i = 0; i < grubuArray.length; i++) {
        await prisma.denemeSonucu.update({
          where: { id: grubuArray[i].id },
          data: { sinifSirasi: i + 1 }
        });
      }
    }

    // Kurs bazlı sıralama
    const kursGruplari: Record<string, DenemeSonucWithOgrenci[]> = {};
    sonuclar.forEach(s => {
      const kursId = s.ogrenci.kursId || 'unknown';
      if (!kursGruplari[kursId]) kursGruplari[kursId] = [];
      kursGruplari[kursId].push(s);
    });

    for (const grubuArray of Object.values(kursGruplari)) {
      grubuArray.sort((a, b) => (b.toplamNet || 0) - (a.toplamNet || 0));
      for (let i = 0; i < grubuArray.length; i++) {
        await prisma.denemeSonucu.update({
          where: { id: grubuArray[i].id },
          data: { kursSirasi: i + 1 }
        });
      }
    }
  } catch (error) {
    console.error('Sıralama güncelleme hatası:', error);
  }
};

// Sonuç sil
export const deleteDenemeSonucu = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sonuc = await prisma.denemeSonucu.findUnique({ where: { id } });
    if (!sonuc) {
      return res.status(404).json({ success: false, message: 'Sonuç bulunamadı' });
    }

    await prisma.denemeSonucu.delete({ where: { id } });

    // Sıralamayı güncelle
    await updateSiralamalar(sonuc.sinavId);

    res.json({ success: true, message: 'Sonuç silindi' });
  } catch (error) {
    console.error('Sonuç silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ / VELİ GÖRÜNÜMÜ ====================

// Öğrencinin deneme sonuçlarını getir
export const getOgrenciDenemeSonuclari = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.params.ogrenciId || req.user?.id;
    const { tur } = req.query;

    // Yetki kontrolü: Sadece kendi sonuçlarını veya velisi olduğu öğrencinin sonuçlarını görebilir
    if (req.user?.role === 'ogrenci' && ogrenciId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    if (req.user?.role === 'veli') {
      // Velinin çocuğu mu kontrol et
      const veli = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { cocuklari: { select: { id: true } } }
      });
      if (!veli?.cocuklari.some(c => c.id === ogrenciId)) {
        return res.status(403).json({ success: false, message: 'Bu öğrencinin sonuçlarını görme yetkiniz yok' });
      }
    }

    const where: any = { ogrenciId };
    if (tur) {
      where.sinav = { tur };
    }

    const sonuclar = await prisma.denemeSonucu.findMany({
      where,
      include: {
        sinav: {
          select: { id: true, ad: true, tur: true, kurum: true, tarih: true, branslarVeSoruSayilari: true }
        }
      },
      orderBy: { sinav: { tarih: 'desc' } }
    });

    const sonuclarWithParsed = sonuclar.map(sonuc => ({
      ...sonuc,
      branslar: JSON.parse(sonuc.branslarVeSonuclar),
      sinav: {
        ...sonuc.sinav,
        branslar: JSON.parse(sonuc.sinav.branslarVeSoruSayilari)
      }
    }));

    res.json({ success: true, data: sonuclarWithParsed });
  } catch (error) {
    console.error('Öğrenci deneme sonuçları hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğrencinin deneme istatistiklerini getir (trend analizi)
export const getOgrenciDenemeIstatistik = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.params.ogrenciId || req.user?.id;
    const { tur } = req.query;

    // Yetki kontrolü
    if (req.user?.role === 'ogrenci' && ogrenciId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    if (req.user?.role === 'veli') {
      const veli = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { cocuklari: { select: { id: true } } }
      });
      if (!veli?.cocuklari.some(c => c.id === ogrenciId)) {
        return res.status(403).json({ success: false, message: 'Bu öğrencinin istatistiklerini görme yetkiniz yok' });
      }
    }

    const where: any = { ogrenciId };
    if (tur) {
      where.sinav = { tur };
    }

    const sonuclar = await prisma.denemeSonucu.findMany({
      where,
      include: {
        sinav: { select: { id: true, ad: true, tur: true, tarih: true } }
      },
      orderBy: { sinav: { tarih: 'asc' } }
    });

    // Genel istatistikler
    const genelIstatistik = {
      toplamDeneme: sonuclar.length,
      ortalamaNet: sonuclar.length > 0 
        ? Math.round((sonuclar.reduce((acc, s) => acc + s.toplamNet, 0) / sonuclar.length) * 100) / 100 
        : 0,
      enYuksekNet: sonuclar.length > 0 
        ? Math.max(...sonuclar.map(s => s.toplamNet)) 
        : 0,
      enDusukNet: sonuclar.length > 0 
        ? Math.min(...sonuclar.map(s => s.toplamNet)) 
        : 0,
    };

    // Trend verisi (tarih sıralı)
    const trend = sonuclar.map(s => ({
      tarih: s.sinav.tarih,
      sinavAd: s.sinav.ad,
      net: s.toplamNet,
      siralama: s.genelSiralama
    }));

    // Branş bazlı ortalamalar
    const bransOrtalamalar: Record<string, { toplam: number; sayi: number; ortalama: number }> = {};
    
    for (const sonuc of sonuclar) {
      const branslar = JSON.parse(sonuc.branslarVeSonuclar);
      for (const [brans, data] of Object.entries(branslar as Record<string, { net: number }>)) {
        if (!bransOrtalamalar[brans]) {
          bransOrtalamalar[brans] = { toplam: 0, sayi: 0, ortalama: 0 };
        }
        bransOrtalamalar[brans].toplam += data.net;
        bransOrtalamalar[brans].sayi++;
      }
    }

    for (const brans of Object.keys(bransOrtalamalar)) {
      bransOrtalamalar[brans].ortalama = 
        Math.round((bransOrtalamalar[brans].toplam / bransOrtalamalar[brans].sayi) * 100) / 100;
    }

    res.json({
      success: true,
      data: {
        genelIstatistik,
        trend,
        bransOrtalamalar
      }
    });
  } catch (error) {
    console.error('Deneme istatistik hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Branş tanımlarını getir
export const getBransTanimlari = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        TYT: TYT_BRANSLAR,
        AYT: AYT_BRANSLAR,
        LGS: LGS_BRANSLAR
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınıf bazlı deneme analizi
export const getSinifDenemeAnalizi = async (req: AuthRequest, res: Response) => {
  try {
    const { sinavId } = req.params;

    const sonuclar = await prisma.denemeSonucu.findMany({
      where: { sinavId },
      include: {
        ogrenci: {
          select: { id: true, ad: true, soyad: true, ogrenciNo: true, sinif: { select: { id: true, ad: true } } }
        }
      },
      orderBy: { toplamNet: 'desc' }
    });

    // Sınıf bazlı grupla
    const sinifGruplari: Record<string, any> = {};

    for (const sonuc of sonuclar) {
      const sinifAd = sonuc.ogrenci.sinif?.ad || 'Sınıfsız';
      if (!sinifGruplari[sinifAd]) {
        sinifGruplari[sinifAd] = {
          sinifAd,
          ogrenciSayisi: 0,
          toplamNet: 0,
          ortalamaNet: 0,
          enYuksekNet: 0,
          enDusukNet: Infinity,
          ogrenciler: []
        };
      }

      sinifGruplari[sinifAd].ogrenciSayisi++;
      sinifGruplari[sinifAd].toplamNet += sonuc.toplamNet;
      sinifGruplari[sinifAd].enYuksekNet = Math.max(sinifGruplari[sinifAd].enYuksekNet, sonuc.toplamNet);
      sinifGruplari[sinifAd].enDusukNet = Math.min(sinifGruplari[sinifAd].enDusukNet, sonuc.toplamNet);
      sinifGruplari[sinifAd].ogrenciler.push({
        ...sonuc.ogrenci,
        toplamNet: sonuc.toplamNet,
        sinifSirasi: sonuc.sinifSirasi,
        branslar: JSON.parse(sonuc.branslarVeSonuclar)
      });
    }

    // Ortalamaları hesapla
    for (const sinif of Object.values(sinifGruplari)) {
      sinif.ortalamaNet = Math.round((sinif.toplamNet / sinif.ogrenciSayisi) * 100) / 100;
      if (sinif.enDusukNet === Infinity) sinif.enDusukNet = 0;
    }

    res.json({
      success: true,
      data: Object.values(sinifGruplari).sort((a, b) => b.ortalamaNet - a.ortalamaNet)
    });
  } catch (error) {
    console.error('Sınıf analizi hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== IMPORT / TEMPLATE ====================

// CSV Import
export const importCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { sinavId, csvContent } = req.body;
    const girenId = req.user?.id;

    if (!sinavId || !csvContent) {
      return res.status(400).json({ success: false, message: 'Sınav ID ve CSV içeriği zorunludur' });
    }

    const sinav = await prisma.denemeSinavi.findUnique({ where: { id: sinavId } });
    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Deneme sınavı bulunamadı' });
    }

    const parseResult = parseCSV(csvContent, sinav.tur as 'TYT' | 'AYT' | 'LGS');
    
    if (!parseResult.success || !parseResult.data) {
      return res.status(400).json({ success: false, message: 'CSV parse hatası', errors: parseResult.errors });
    }

    // Sonuçları ekle
    const sonuclar = parseResult.data.map(item => ({
      ogrenciNo: item.ogrenciNo,
      branslar: item.branslar
    }));

    // addTopluDenemeSonucu'nun body formatına çevir
    req.body = { sinavId, sonuclar };
    return addTopluDenemeSonucu(req, res);
  } catch (error) {
    console.error('CSV import hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// JSON Import
export const importJSON = async (req: AuthRequest, res: Response) => {
  try {
    const { sinavId, jsonContent } = req.body;

    if (!sinavId || !jsonContent) {
      return res.status(400).json({ success: false, message: 'Sınav ID ve JSON içeriği zorunludur' });
    }

    const sinav = await prisma.denemeSinavi.findUnique({ where: { id: sinavId } });
    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Deneme sınavı bulunamadı' });
    }

    const parseResult = parseJSON(jsonContent, sinav.tur as 'TYT' | 'AYT' | 'LGS');
    
    if (!parseResult.success || !parseResult.data) {
      return res.status(400).json({ success: false, message: 'JSON parse hatası', errors: parseResult.errors });
    }

    // Sonuçları ekle
    const sonuclar = parseResult.data.map(item => ({
      ogrenciNo: item.ogrenciNo,
      branslar: item.branslar
    }));

    req.body = { sinavId, sonuclar };
    return addTopluDenemeSonucu(req, res);
  } catch (error) {
    console.error('JSON import hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// CSV Şablonu indir
export const getCSVTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { tur } = req.query;
    
    if (!tur || !['TYT', 'AYT', 'LGS'].includes(tur as string)) {
      return res.status(400).json({ success: false, message: 'Geçerli sınav türü belirtiniz (TYT, AYT, LGS)' });
    }

    const template = generateCSVTemplate(tur as 'TYT' | 'AYT' | 'LGS');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${tur}_sablon.csv`);
    res.send('\ufeff' + template); // BOM for Excel UTF-8
  } catch (error) {
    console.error('CSV şablon hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// JSON Şablonu getir
export const getJSONTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { tur } = req.query;
    
    if (!tur || !['TYT', 'AYT', 'LGS'].includes(tur as string)) {
      return res.status(400).json({ success: false, message: 'Geçerli sınav türü belirtiniz (TYT, AYT, LGS)' });
    }

    const template = generateJSONTemplate(tur as 'TYT' | 'AYT' | 'LGS');
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('JSON şablon hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

