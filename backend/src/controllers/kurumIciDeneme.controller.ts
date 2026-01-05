import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateDenemePDF, generateOptikFormPDF } from '../services/pdf.service';
import { uploadDenemeSoruImage, deleteFromFirebase } from '../services/upload.service';
import { v4 as uuidv4 } from 'uuid';

// ==================== BRANS TANIMLARI (RESMİ SORU SAYILARI) ====================

// LGS Branşları ve soru sayıları (Toplam: 90 soru)
export const LGS_BRANS_CONFIG = {
  LGS_TURKCE: { ad: 'Türkçe', soruSayisi: 20, bransKodu: 'turkce' },
  LGS_MATEMATIK: { ad: 'Matematik', soruSayisi: 20, bransKodu: 'matematik' },
  LGS_FEN: { ad: 'Fen Bilimleri', soruSayisi: 20, bransKodu: 'fen' },
  LGS_INKILAP: { ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, bransKodu: 'tarih' },
  LGS_DIN: { ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, bransKodu: 'din' },
  LGS_INGILIZCE: { ad: 'İngilizce', soruSayisi: 10, bransKodu: 'ingilizce' },
};

// TYT Branşları ve soru sayıları (Toplam: 120 soru)
export const TYT_BRANS_CONFIG = {
  TYT_TURKCE: { ad: 'Türkçe', soruSayisi: 40, bransKodu: 'turkce' },
  TYT_MATEMATIK: { ad: 'Temel Matematik', soruSayisi: 40, bransKodu: 'matematik' },
  // Sosyal Bilimler (20 soru) - Branş bazlı ayrılmış
  TYT_TARIH: { ad: 'Tarih', soruSayisi: 5, bransKodu: 'tarih' },
  TYT_COGRAFYA: { ad: 'Coğrafya', soruSayisi: 5, bransKodu: 'cografya' },
  TYT_FELSEFE: { ad: 'Felsefe', soruSayisi: 5, bransKodu: 'felsefe' },
  TYT_DIN: { ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 5, bransKodu: 'din' },
  // Fen Bilimleri (20 soru) - Branş bazlı ayrılmış
  TYT_FIZIK: { ad: 'Fizik', soruSayisi: 7, bransKodu: 'fizik' },
  TYT_KIMYA: { ad: 'Kimya', soruSayisi: 7, bransKodu: 'kimya' },
  TYT_BIYOLOJI: { ad: 'Biyoloji', soruSayisi: 6, bransKodu: 'biyoloji' },
};

// AYT Branşları ve soru sayıları (Toplam: 160 soru)
export const AYT_BRANS_CONFIG = {
  // Matematik Testi (40 soru)
  AYT_MATEMATIK: { ad: 'Matematik', soruSayisi: 40, bransKodu: 'matematik' },
  // Fen Bilimleri Testi (40 soru)
  AYT_FIZIK: { ad: 'Fizik', soruSayisi: 14, bransKodu: 'fizik' },
  AYT_KIMYA: { ad: 'Kimya', soruSayisi: 13, bransKodu: 'kimya' },
  AYT_BIYOLOJI: { ad: 'Biyoloji', soruSayisi: 13, bransKodu: 'biyoloji' },
  // Edebiyat-Sosyal Bilimler 1 (40 soru)
  AYT_EDEBIYAT: { ad: 'Türk Dili ve Edebiyatı', soruSayisi: 24, bransKodu: 'edebiyat' },
  AYT_TARIH1: { ad: 'Tarih-1', soruSayisi: 10, bransKodu: 'tarih' },
  AYT_COGRAFYA1: { ad: 'Coğrafya-1', soruSayisi: 6, bransKodu: 'cografya' },
  // Sosyal Bilimler 2 (40 soru)
  AYT_TARIH2: { ad: 'Tarih-2', soruSayisi: 11, bransKodu: 'tarih' },
  AYT_COGRAFYA2: { ad: 'Coğrafya-2', soruSayisi: 11, bransKodu: 'cografya' },
  AYT_FELSEFE: { ad: 'Felsefe Grubu', soruSayisi: 12, bransKodu: 'felsefe' },
  AYT_DIN: { ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 6, bransKodu: 'din' },
};

// Öğretmen branşı ile sınav branşı eşleştirme
const bransEslestirme: Record<string, string[]> = {
  'turkce': ['LGS_TURKCE', 'TYT_TURKCE'],
  'türkçe': ['LGS_TURKCE', 'TYT_TURKCE'],
  'matematik': ['LGS_MATEMATIK', 'TYT_MATEMATIK', 'AYT_MATEMATIK'],
  'fizik': ['LGS_FEN', 'TYT_FIZIK', 'AYT_FIZIK'],
  'kimya': ['LGS_FEN', 'TYT_KIMYA', 'AYT_KIMYA'],
  'biyoloji': ['LGS_FEN', 'TYT_BIYOLOJI', 'AYT_BIYOLOJI'],
  'fen': ['LGS_FEN', 'TYT_FIZIK', 'TYT_KIMYA', 'TYT_BIYOLOJI'],
  'fen bilimleri': ['LGS_FEN', 'TYT_FIZIK', 'TYT_KIMYA', 'TYT_BIYOLOJI'],
  'tarih': ['LGS_INKILAP', 'TYT_TARIH', 'AYT_TARIH1', 'AYT_TARIH2'],
  'inkılap tarihi': ['LGS_INKILAP', 'TYT_TARIH', 'AYT_TARIH1'],
  't.c. inkılap tarihi': ['LGS_INKILAP', 'TYT_TARIH', 'AYT_TARIH1'],
  'cografya': ['TYT_COGRAFYA', 'AYT_COGRAFYA1', 'AYT_COGRAFYA2'],
  'coğrafya': ['TYT_COGRAFYA', 'AYT_COGRAFYA1', 'AYT_COGRAFYA2'],
  'sosyal bilgiler': ['LGS_INKILAP', 'TYT_TARIH', 'TYT_COGRAFYA'],
  'felsefe': ['TYT_FELSEFE', 'AYT_FELSEFE'],
  'din': ['LGS_DIN', 'TYT_DIN', 'AYT_DIN'],
  'din kültürü': ['LGS_DIN', 'TYT_DIN', 'AYT_DIN'],
  'din kültürü ve ahlak bilgisi': ['LGS_DIN', 'TYT_DIN', 'AYT_DIN'],
  'ingilizce': ['LGS_INGILIZCE'],
  'yabancı dil': ['LGS_INGILIZCE'],
  'edebiyat': ['AYT_EDEBIYAT'],
  'türk dili ve edebiyatı': ['TYT_TURKCE', 'AYT_EDEBIYAT'],
};

// Branş kodundan sınav branşlarını bul
const getOgretmenSinavBranslari = (ogretmenBrans: string | null): string[] => {
  if (!ogretmenBrans) return [];
  const normalizedBrans = ogretmenBrans.toLowerCase().trim();
  return bransEslestirme[normalizedBrans] || [];
};

// ==================== MÜDÜR - DENEME YÖNETİMİ ====================

// Yeni deneme sınavı oluştur (Müdür)
export const createKurumIciDeneme = async (req: AuthRequest, res: Response) => {
  try {
    const mudurId = req.user?.id;
    const userRole = req.user?.role;

    if (!mudurId || userRole !== 'mudur') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { ad, tur, hedefSiniflar, baslangicTarihi, bitisTarihi, sure, aciklama } = req.body;

    if (!ad || !tur || !hedefSiniflar || !baslangicTarihi || !bitisTarihi) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    // Branş config'i seç
    let bransConfig: Record<string, { ad: string; soruSayisi: number }>;
    if (tur === 'LGS') {
      bransConfig = LGS_BRANS_CONFIG;
    } else if (tur === 'TYT') {
      bransConfig = TYT_BRANS_CONFIG;
    } else if (tur === 'AYT') {
      bransConfig = AYT_BRANS_CONFIG;
    } else {
      return res.status(400).json({ success: false, message: 'Geçersiz sınav türü' });
    }

    // Deneme oluştur
    const deneme = await prisma.kurumIciDeneme.create({
      data: {
        ad,
        tur,
        hedefSiniflar: JSON.stringify(hedefSiniflar),
        baslangicTarihi: new Date(baslangicTarihi),
        bitisTarihi: new Date(bitisTarihi),
        sure: sure || 135, // varsayılan 135 dk
        olusturanId: mudurId,
        aciklama,
        durum: 'HAZIRLANIYOR'
      }
    });

    // Her branş için boş soru paketi oluştur
    const soruPaketleri = Object.entries(bransConfig).map(([bransKodu, config]) => ({
      denemeId: deneme.id,
      bransKodu: bransKodu as any,
      bransAdi: config.ad,
      soruSayisi: config.soruSayisi,
      ogretmenId: mudurId, // Başlangıçta müdüre atanır, sonra öğretmen atanabilir
      sorular: null,
      hazirMi: false,
      onaylandiMi: false
    }));

    await prisma.denemeSoruPaketi.createMany({
      data: soruPaketleri
    });

    res.json({
      success: true,
      message: 'Deneme sınavı oluşturuldu. Şimdi öğretmenleri atayın.',
      data: deneme
    });
  } catch (error) {
    console.error('Deneme oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Tüm denemeleri listele (Müdür)
export const getKurumIciDenemeler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const where: any = {};
    
    // Müdür tüm denemeleri görür, öğretmen sadece atandıklarını
    if (userRole === 'ogretmen') {
      where.soruPaketleri = {
        some: { ogretmenId: userId }
      };
    }

    const denemeler = await prisma.kurumIciDeneme.findMany({
      where,
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true } },
        soruPaketleri: {
          include: {
            ogretmen: { select: { id: true, ad: true, soyad: true, brans: true } }
          }
        },
        _count: { select: { oturumlar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Her deneme için ilerleme hesapla
    const denemelerWithProgress = denemeler.map(deneme => {
      const toplamPaket = deneme.soruPaketleri.length;
      const hazirPaket = deneme.soruPaketleri.filter(p => p.hazirMi).length;
      const onaylananPaket = deneme.soruPaketleri.filter(p => p.onaylandiMi).length;

      return {
        ...deneme,
        hedefSiniflar: JSON.parse(deneme.hedefSiniflar),
        ilerleme: {
          toplamPaket,
          hazirPaket,
          onaylananPaket,
          yuzde: toplamPaket > 0 ? Math.round((hazirPaket / toplamPaket) * 100) : 0
        },
        katilimciSayisi: deneme._count.oturumlar
      };
    });

    res.json({ success: true, data: denemelerWithProgress });
  } catch (error) {
    console.error('Denemeler listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Deneme detayı (Müdür)
export const getKurumIciDenemeDetay = async (req: AuthRequest, res: Response) => {
  try {
    const { denemeId } = req.params;

    const deneme = await prisma.kurumIciDeneme.findUnique({
      where: { id: denemeId },
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true } },
        soruPaketleri: {
          include: {
            ogretmen: { select: { id: true, ad: true, soyad: true, brans: true } }
          },
          orderBy: { bransAdi: 'asc' }
        },
        oturumlar: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
          }
        }
      }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı' });
    }

    // Soruları parse et
    const paketlerWithSorular = deneme.soruPaketleri.map(paket => ({
      ...paket,
      sorular: paket.sorular ? JSON.parse(paket.sorular) : []
    }));

    res.json({
      success: true,
      data: {
        ...deneme,
        hedefSiniflar: JSON.parse(deneme.hedefSiniflar),
        soruPaketleri: paketlerWithSorular
      }
    });
  } catch (error) {
    console.error('Deneme detay hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğretmen ata (Müdür)
export const ataSoruPaketiOgretmen = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'mudur') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { paketId, ogretmenId } = req.body;

    // Öğretmenin branşını kontrol et
    const ogretmen = await prisma.user.findUnique({
      where: { id: ogretmenId },
      select: { id: true, brans: true, ad: true, soyad: true }
    });

    if (!ogretmen) {
      return res.status(404).json({ success: false, message: 'Öğretmen bulunamadı' });
    }

    const paket = await prisma.denemeSoruPaketi.findUnique({
      where: { id: paketId }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı' });
    }

    // Branş uyumluluğunu kontrol et
    const uygunBranslar = getOgretmenSinavBranslari(ogretmen.brans);
    if (!uygunBranslar.includes(paket.bransKodu)) {
      return res.status(400).json({ 
        success: false, 
        message: `${ogretmen.ad} ${ogretmen.soyad} (${ogretmen.brans}) bu branş için uygun değil` 
      });
    }

    await prisma.denemeSoruPaketi.update({
      where: { id: paketId },
      data: { ogretmenId }
    });

    res.json({ success: true, message: 'Öğretmen atandı' });
  } catch (error) {
    console.error('Öğretmen atama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soru paketini onayla (Müdür)
export const onaylaSoruPaketi = async (req: AuthRequest, res: Response) => {
  try {
    const mudurId = req.user?.id;
    const userRole = req.user?.role;
    
    if (userRole !== 'mudur') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { paketId } = req.params;
    const { onayla, geriBildirim } = req.body;

    const paket = await prisma.denemeSoruPaketi.findUnique({
      where: { id: paketId }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı' });
    }

    if (!paket.hazirMi) {
      return res.status(400).json({ success: false, message: 'Öğretmen henüz tamamlamadı' });
    }

    await prisma.denemeSoruPaketi.update({
      where: { id: paketId },
      data: {
        onaylandiMi: onayla,
        onaylayanId: onayla ? mudurId : null,
        onayTarihi: onayla ? new Date() : null,
        geriBildirim: geriBildirim || null,
        hazirMi: onayla ? true : false // Reddedilirse tekrar hazırlanması gerekir
      }
    });

    res.json({ 
      success: true, 
      message: onayla ? 'Soru paketi onaylandı' : 'Soru paketi reddedildi, öğretmene bildirildi' 
    });
  } catch (error) {
    console.error('Onaylama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Denemeyi yayınla (Müdür)
export const yayinlaKurumIciDeneme = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'mudur') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { denemeId } = req.params;

    const deneme = await prisma.kurumIciDeneme.findUnique({
      where: { id: denemeId },
      include: { soruPaketleri: true }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı' });
    }

    // Tüm paketlerin onaylanmış olması gerekir
    const onaysizPaketler = deneme.soruPaketleri.filter(p => !p.onaylandiMi);
    if (onaysizPaketler.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${onaysizPaketler.length} branş henüz onaylanmadı`,
        onaysizBranslar: onaysizPaketler.map(p => p.bransAdi)
      });
    }

    await prisma.kurumIciDeneme.update({
      where: { id: denemeId },
      data: { durum: 'AKTIF' }
    });

    res.json({ success: true, message: 'Deneme sınavı yayınlandı!' });
  } catch (error) {
    console.error('Yayınlama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRETMEN - SORU HAZIRLAMA ====================

// Öğretmenin atandığı soru paketlerini listele
export const getOgretmenSoruPaketleri = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;

    const paketler = await prisma.denemeSoruPaketi.findMany({
      where: { ogretmenId },
      include: {
        deneme: {
          select: { id: true, ad: true, tur: true, durum: true, baslangicTarihi: true, bitisTarihi: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const paketlerWithSorular = paketler.map(paket => ({
      ...paket,
      sorular: paket.sorular ? JSON.parse(paket.sorular) : [],
      soruSayisiMevcut: paket.sorular ? JSON.parse(paket.sorular).length : 0
    }));

    res.json({ success: true, data: paketlerWithSorular });
  } catch (error) {
    console.error('Soru paketleri hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soru ekle/güncelle (Öğretmen)
export const updateSoruPaketi = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { paketId } = req.params;
    const { sorular } = req.body;

    const paket = await prisma.denemeSoruPaketi.findFirst({
      where: { id: paketId, ogretmenId },
      include: { deneme: true }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı veya yetkiniz yok' });
    }

    if (paket.deneme.durum !== 'HAZIRLANIYOR') {
      return res.status(400).json({ success: false, message: 'Bu deneme artık düzenlenemez' });
    }

    if (paket.onaylandiMi) {
      return res.status(400).json({ success: false, message: 'Onaylanmış paket düzenlenemez' });
    }

    await prisma.denemeSoruPaketi.update({
      where: { id: paketId },
      data: { sorular: JSON.stringify(sorular) }
    });

    res.json({ success: true, message: 'Sorular kaydedildi' });
  } catch (error) {
    console.error('Soru güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soru paketini tamamla (Öğretmen)
export const tamamlaSoruPaketi = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { paketId } = req.params;

    const paket = await prisma.denemeSoruPaketi.findFirst({
      where: { id: paketId, ogretmenId }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı' });
    }

    const sorular = paket.sorular ? JSON.parse(paket.sorular) : [];
    if (sorular.length !== paket.soruSayisi) {
      return res.status(400).json({
        success: false,
        message: `${paket.soruSayisi} soru gerekli, ${sorular.length} soru mevcut`
      });
    }

    await prisma.denemeSoruPaketi.update({
      where: { id: paketId },
      data: { hazirMi: true }
    });

    res.json({ success: true, message: 'Soru paketi tamamlandı, müdür onayı bekleniyor' });
  } catch (error) {
    console.error('Tamamlama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ - DENEME ÇÖZME ====================

// Aktif denemeleri listele (Öğrenci)
export const getAktifDenemeler = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const now = new Date();

    // Öğrencinin sınıf bilgisini al
    const ogrenci = await prisma.user.findUnique({
      where: { id: ogrenciId },
      include: { sinif: { select: { ad: true } } }
    });

    if (!ogrenci?.sinif) {
      return res.status(400).json({ success: false, message: 'Sınıf bilginiz bulunamadı' });
    }

    const denemeler = await prisma.kurumIciDeneme.findMany({
      where: {
        durum: 'AKTIF',
        baslangicTarihi: { lte: now },
        bitisTarihi: { gte: now }
      },
      include: {
        oturumlar: {
          where: { ogrenciId },
          select: { id: true, tamamlandi: true, toplamNet: true }
        },
        soruPaketleri: {
          select: { bransAdi: true, soruSayisi: true }
        }
      }
    });

    // Hedef sınıfa göre filtrele
    const uygunDenemeler = denemeler.filter(d => {
      const hedefSiniflar = JSON.parse(d.hedefSiniflar);
      return hedefSiniflar.includes(ogrenci.sinif!.ad);
    });

    const denemelerWithStatus = uygunDenemeler.map(d => ({
      id: d.id,
      ad: d.ad,
      tur: d.tur,
      sure: d.sure,
      bitisTarihi: d.bitisTarihi,
      toplamSoru: d.soruPaketleri.reduce((sum, p) => sum + p.soruSayisi, 0),
      branslar: d.soruPaketleri.map(p => ({ ad: p.bransAdi, soruSayisi: p.soruSayisi })),
      girildiMi: d.oturumlar.length > 0,
      tamamlandiMi: d.oturumlar.some(o => o.tamamlandi),
      toplamNet: d.oturumlar.find(o => o.tamamlandi)?.toplamNet
    }));

    res.json({ success: true, data: denemelerWithStatus });
  } catch (error) {
    console.error('Aktif denemeler hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Denemeye başla (Öğrenci)
export const baslatDeneme = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { denemeId } = req.params;
    const now = new Date();

    // Denemeyi kontrol et
    const deneme = await prisma.kurumIciDeneme.findFirst({
      where: {
        id: denemeId,
        durum: 'AKTIF',
        baslangicTarihi: { lte: now },
        bitisTarihi: { gte: now }
      },
      include: {
        soruPaketleri: {
          where: { onaylandiMi: true },
          orderBy: { bransAdi: 'asc' }
        }
      }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı veya aktif değil' });
    }

    // Mevcut oturum var mı kontrol et
    let oturum = await prisma.denemeOturumu.findUnique({
      where: { denemeId_ogrenciId: { denemeId, ogrenciId: ogrenciId! } }
    });

    if (oturum?.tamamlandi) {
      return res.status(400).json({ success: false, message: 'Bu denemeyi zaten tamamladınız' });
    }

    if (!oturum) {
      oturum = await prisma.denemeOturumu.create({
        data: {
          denemeId,
          ogrenciId: ogrenciId!
        }
      });
    }

    // Soruları hazırla (doğru cevapları gizle)
    const sorular = deneme.soruPaketleri.map(paket => ({
      bransKodu: paket.bransKodu,
      bransAdi: paket.bransAdi,
      sorular: paket.sorular ? JSON.parse(paket.sorular).map((s: any, i: number) => ({
        index: i,
        soruMetni: s.soruMetni,
        secenekler: s.secenekler,
        resimUrl: s.resimUrl
        // dogruCevap gizlendi!
      })) : []
    }));

    res.json({
      success: true,
      data: {
        oturumId: oturum.id,
        denemeAd: deneme.ad,
        tur: deneme.tur,
        sure: deneme.sure,
        baslangicZamani: oturum.baslangicZamani,
        sorular
      }
    });
  } catch (error) {
    console.error('Deneme başlatma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Denemeyi bitir (Öğrenci)
export const bitirDeneme = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { oturumId } = req.params;
    const { cevaplar } = req.body; // { "LGS_TURKCE": ["A", "B", ...], ... }

    const oturum = await prisma.denemeOturumu.findFirst({
      where: { id: oturumId, ogrenciId, tamamlandi: false },
      include: {
        deneme: {
          include: { soruPaketleri: true }
        }
      }
    });

    if (!oturum) {
      return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
    }

    // Sonuçları hesapla
    const sonuclar: Record<string, { dogru: number; yanlis: number; bos: number; net: number }> = {};
    let toplamNet = 0;

    for (const paket of oturum.deneme.soruPaketleri) {
      const paketSorular = paket.sorular ? JSON.parse(paket.sorular) : [];
      const ogrenciCevaplari = cevaplar[paket.bransKodu] || [];

      let dogru = 0, yanlis = 0, bos = 0;

      paketSorular.forEach((soru: any, index: number) => {
        const cevap = ogrenciCevaplari[index];
        if (!cevap || cevap === '') {
          bos++;
        } else if (cevap.toUpperCase() === soru.dogruCevap.toUpperCase()) {
          dogru++;
        } else {
          yanlis++;
        }
      });

      const net = dogru - (yanlis / 4);
      sonuclar[paket.bransKodu] = { dogru, yanlis, bos, net: Math.round(net * 100) / 100 };
      toplamNet += net;
    }

    // Oturumu güncelle
    await prisma.denemeOturumu.update({
      where: { id: oturumId },
      data: {
        tamamlandi: true,
        bitisZamani: new Date(),
        cevaplar: JSON.stringify(cevaplar),
        sonuclar: JSON.stringify(sonuclar),
        toplamNet: Math.round(toplamNet * 100) / 100
      }
    });

    res.json({
      success: true,
      data: {
        sonuclar,
        toplamNet: Math.round(toplamNet * 100) / 100
      }
    });
  } catch (error) {
    console.error('Deneme bitirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== SORU RESMİ YÜKLEME ====================

// Soru için resim yükle (max 8MB)
export const uploadSoruResmi = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { paketId, soruId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Resim dosyası gerekli' });
    }

    // Paket kontrolü
    const paket = await prisma.denemeSoruPaketi.findFirst({
      where: { id: paketId, ogretmenId },
      include: { deneme: true }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı veya yetkiniz yok' });
    }

    if (paket.deneme.durum !== 'HAZIRLANIYOR') {
      return res.status(400).json({ success: false, message: 'Bu deneme artık düzenlenemez' });
    }

    // Resmi yükle (Firebase veya local)
    const uploadResult = await uploadDenemeSoruImage(file, paket.deneme.id, soruId);

    if (!uploadResult.success) {
      return res.status(400).json({ success: false, message: uploadResult.error || 'Resim yüklenemedi' });
    }

    res.json({ 
      success: true, 
      message: 'Resim yüklendi',
      data: { resimUrl: uploadResult.url }
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soru resmini sil
export const deleteSoruResmi = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { paketId } = req.params;
    const { resimUrl } = req.body;

    if (!resimUrl) {
      return res.status(400).json({ success: false, message: 'Resim URL gerekli' });
    }

    // Paket kontrolü
    const paket = await prisma.denemeSoruPaketi.findFirst({
      where: { id: paketId, ogretmenId },
      include: { deneme: true }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Soru paketi bulunamadı veya yetkiniz yok' });
    }

    // Resmi sil
    await deleteFromFirebase(resimUrl);

    res.json({ success: true, message: 'Resim silindi' });
  } catch (error) {
    console.error('Resim silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== PDF EXPORT ====================

// Deneme sorularını PDF olarak indir
export const downloadDenemePDF = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'mudur' && userRole !== 'ogretmen') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { denemeId } = req.params;
    const { cevapAnahtariDahil } = req.query;

    const deneme = await prisma.kurumIciDeneme.findUnique({
      where: { id: denemeId },
      include: {
        soruPaketleri: {
          include: {
            ogretmen: { select: { ad: true, soyad: true } }
          },
          orderBy: { bransAdi: 'asc' }
        }
      }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı' });
    }

    // Soruları PDF formatına dönüştür
    let soruNo = 1;
    const sorular = deneme.soruPaketleri.flatMap(paket => {
      const paketSorular = paket.sorular ? JSON.parse(paket.sorular) : [];
      return paketSorular.map((s: any) => ({
        soruNo: soruNo++,
        soruMetni: s.soruMetni,
        resimUrl: s.resimUrl,
        secenekA: s.secenekA || s.secenekler?.[0] || '',
        secenekB: s.secenekB || s.secenekler?.[1] || '',
        secenekC: s.secenekC || s.secenekler?.[2] || '',
        secenekD: s.secenekD || s.secenekler?.[3] || '',
        secenekE: s.secenekE || s.secenekler?.[4] || null,
        bransAdi: paket.bransAdi,
        bransKodu: paket.bransKodu
      }));
    });

    const sinavData = {
      id: deneme.id,
      baslik: deneme.ad,
      aciklama: deneme.aciklama,
      tur: deneme.tur as 'LGS' | 'TYT' | 'AYT',
      sure: deneme.sure,
      hedefSinif: JSON.parse(deneme.hedefSiniflar).join(', '),
      baslangicTarihi: deneme.baslangicTarihi,
      sorular
    };

    const pdfBuffer = await generateDenemePDF(sinavData, {
      includeAnswerKey: cevapAnahtariDahil === 'true',
      pageSize: 'A4'
    });

    // PDF'i indir
    const fileName = `${deneme.ad.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '_')}_${deneme.tur}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'PDF oluşturulurken hata oluştu' });
  }
};

// Optik form (cevap kağıdı) PDF'i indir
export const downloadOptikFormPDF = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'mudur' && userRole !== 'ogretmen') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { denemeId } = req.params;

    const deneme = await prisma.kurumIciDeneme.findUnique({
      where: { id: denemeId },
      include: {
        soruPaketleri: {
          orderBy: { bransAdi: 'asc' }
        }
      }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı' });
    }

    // Soruları formatla
    let soruNo = 1;
    const sorular = deneme.soruPaketleri.flatMap(paket => {
      const paketSorular = paket.sorular ? JSON.parse(paket.sorular) : [];
      return paketSorular.map((s: any) => ({
        soruNo: soruNo++,
        soruMetni: '',
        secenekA: '', secenekB: '', secenekC: '', secenekD: '',
        secenekE: deneme.tur === 'LGS' ? null : '',
        bransAdi: paket.bransAdi,
        bransKodu: paket.bransKodu
      }));
    });

    const sinavData = {
      id: deneme.id,
      baslik: deneme.ad,
      tur: deneme.tur as 'LGS' | 'TYT' | 'AYT',
      sure: deneme.sure,
      baslangicTarihi: deneme.baslangicTarihi,
      sorular
    };

    const pdfBuffer = await generateOptikFormPDF(sinavData);

    const fileName = `${deneme.ad.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '_')}_OptikForm.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Optik form PDF hatası:', error);
    res.status(500).json({ success: false, message: 'PDF oluşturulurken hata oluştu' });
  }
};

// Deneme sorularını JSON olarak al (önizleme için)
export const getDenemePdfData = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'mudur' && userRole !== 'ogretmen') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    const { denemeId } = req.params;

    const deneme = await prisma.kurumIciDeneme.findUnique({
      where: { id: denemeId },
      include: {
        soruPaketleri: {
          where: { onaylandiMi: true },
          include: {
            ogretmen: { select: { ad: true, soyad: true } }
          },
          orderBy: { bransAdi: 'asc' }
        }
      }
    });

    if (!deneme) {
      return res.status(404).json({ success: false, message: 'Deneme bulunamadı' });
    }

    // PDF için veri hazırla
    const pdfData = {
      baslik: deneme.ad,
      tur: deneme.tur,
      tarih: deneme.baslangicTarihi,
      sure: deneme.sure,
      branslar: deneme.soruPaketleri.map(paket => ({
        bransAdi: paket.bransAdi,
        ogretmen: `${paket.ogretmen.ad} ${paket.ogretmen.soyad}`,
        sorular: paket.sorular ? JSON.parse(paket.sorular).map((s: any, i: number) => ({
          no: i + 1,
          metin: s.soruMetni,
          secenekA: s.secenekA || s.secenekler?.[0],
          secenekB: s.secenekB || s.secenekler?.[1],
          secenekC: s.secenekC || s.secenekler?.[2],
          secenekD: s.secenekD || s.secenekler?.[3],
          secenekE: s.secenekE || s.secenekler?.[4],
          dogruCevap: s.dogruCevap,
          resimUrl: s.resimUrl
        })) : []
      })),
      cevapAnahtari: deneme.soruPaketleri.flatMap(paket => {
        const sorular = paket.sorular ? JSON.parse(paket.sorular) : [];
        return sorular.map((s: any, i: number) => ({
          brans: paket.bransAdi,
          soruNo: i + 1,
          cevap: s.dogruCevap
        }));
      })
    };

    res.json({ success: true, data: pdfData });
  } catch (error) {
    console.error('PDF data hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== BRANS CONFIG EXPORT ====================

// Branş config tipi
type BransConfig = Record<string, { ad: string; soruSayisi: number; bransKodu: string }>;

// Branş konfigürasyonlarını al
export const getBransConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { tur } = req.params;

    let config: BransConfig;
    switch (tur?.toUpperCase()) {
      case 'LGS':
        config = LGS_BRANS_CONFIG;
        break;
      case 'TYT':
        config = TYT_BRANS_CONFIG;
        break;
      case 'AYT':
        config = AYT_BRANS_CONFIG;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Geçersiz sınav türü. Geçerli türler: LGS, TYT, AYT' 
        });
    }

    const branslar = Object.entries(config).map(([kod, value]) => ({
      kod,
      ad: value.ad,
      soruSayisi: value.soruSayisi
    }));

    const toplamSoru = Object.values(config).reduce((sum, c) => sum + c.soruSayisi, 0);

    res.json({ 
      success: true, 
      data: {
        tur: tur?.toUpperCase(),
        branslar,
        toplamSoru
      }
    });
  } catch (error) {
    console.error('Branş config hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

