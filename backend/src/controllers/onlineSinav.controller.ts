import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { pushService } from '../services/push.service';

// ==================== ÖĞRETMEN - SINAV YÖNETİMİ ====================

// Sınav oluştur
export const createSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    
    if (!ogretmenId) {
      return res.status(401).json({ success: false, message: 'Yetkilendirme hatası' });
    }
    
    const { 
      baslik, aciklama, courseId, dersAdi, bransKodu, sure, 
      baslangicTarihi, bitisTarihi, maksimumPuan,
      karistir, geriDonus, sonucGoster,
      sorular 
    } = req.body;

    let finalCourseId = courseId;

    // Eğer courseId verilmişse (gerçek bir ders seçilmişse) kontrol et
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, ogretmenId }
      });

      if (!course) {
        return res.status(403).json({ success: false, message: 'Bu derse erişim yetkiniz yok' });
      }
    }
    // courseId yoksa ama bransKodu varsa, bu bir deneme sınavıdır - genel kullanım için

    // Sınavı oluştur
    const sinav = await prisma.onlineSinav.create({
      data: {
        baslik,
        aciklama,
        courseId: finalCourseId || null,
        dersAdi: dersAdi || null,
        bransKodu: bransKodu || null,
        ogretmenId: ogretmenId!,
        sure,
        maksimumPuan: maksimumPuan || 100,
        baslangicTarihi: new Date(baslangicTarihi),
        bitisTarihi: new Date(bitisTarihi),
        karistir: karistir ?? true,
        geriDonus: geriDonus ?? false,
        sonucGoster: sonucGoster ?? true,
        durum: 'TASLAK'
      }
    });

    // Soruları ekle (varsa)
    if (sorular && sorular.length > 0) {
      const soruData = sorular.map((soru: any, index: number) => ({
        sinavId: sinav.id,
        soruMetni: soru.soruMetni,
        soruTipi: soru.soruTipi || 'COKTAN_SECMELI',
        puan: soru.puan || 10,
        siraNo: index + 1,
        secenekler: soru.secenekler ? JSON.stringify(soru.secenekler) : null,
        dogruCevap: soru.dogruCevap,
        resimUrl: soru.resimUrl
      }));

      await prisma.onlineSoru.createMany({ data: soruData });
    }

    res.json({
      success: true,
      message: 'Sınav oluşturuldu',
      data: sinav
    });
  } catch (error) {
    console.error('Sınav oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınavları listele (öğretmen)
export const getOgretmenSinavlari = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { courseId, durum } = req.query;

    const where: any = { ogretmenId };
    if (courseId) where.courseId = courseId;
    if (durum) where.durum = durum;

    const sinavlar = await prisma.onlineSinav.findMany({
      where,
      include: {
        course: { select: { id: true, ad: true } },
        sorular: { select: { id: true } },
        oturumlar: { select: { id: true, tamamlandi: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sinavlarWithStats = sinavlar.map(sinav => ({
      ...sinav,
      // Course yoksa dersAdi kullan
      course: sinav.course || { id: sinav.bransKodu || 'deneme', ad: sinav.dersAdi || 'Deneme Sınavı' },
      soruSayisi: sinav.sorular.length,
      katilimciSayisi: sinav.oturumlar.length,
      tamamlayanSayisi: sinav.oturumlar.filter(o => o.tamamlandi).length
    }));

    res.json({ success: true, data: sinavlarWithStats });
  } catch (error) {
    console.error('Sınavları listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınav detayı (öğretmen)
export const getSinavDetay = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;

    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId },
      include: {
        course: { select: { id: true, ad: true } },
        sorular: { orderBy: { siraNo: 'asc' } },
        oturumlar: {
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    // Soruları parse et
    const sorularParsed = sinav.sorular.map(soru => ({
      ...soru,
      secenekler: soru.secenekler ? JSON.parse(soru.secenekler) : null
    }));

    res.json({
      success: true,
      data: {
        ...sinav,
        sorular: sorularParsed
      }
    });
  } catch (error) {
    console.error('Sınav detay hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınav güncelle
export const updateSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;
    const { 
      baslik, aciklama, courseId, dersAdi, bransKodu, sure, 
      baslangicTarihi, bitisTarihi, maksimumPuan,
      karistir, geriDonus, sonucGoster
    } = req.body;

    // Sınavın öğretmene ait olduğunu kontrol et
    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    // Aktif sınav düzenlenemez
    if (sinav.durum === 'AKTIF') {
      return res.status(400).json({ 
        success: false, 
        message: 'Aktif sınav düzenlenemez. Önce taslağa alın.' 
      });
    }

    // Eğer courseId değiştirildiyse yetki kontrolü
    if (courseId && courseId !== sinav.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, ogretmenId }
      });
      if (!course) {
        return res.status(403).json({ success: false, message: 'Bu derse erişim yetkiniz yok' });
      }
    }

    const updatedSinav = await prisma.onlineSinav.update({
      where: { id: sinavId },
      data: {
        baslik,
        aciklama,
        courseId: courseId || null,
        dersAdi: dersAdi || null,
        bransKodu: bransKodu || null,
        sure,
        maksimumPuan,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : undefined,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : undefined,
        karistir,
        geriDonus,
        sonucGoster
      },
      include: {
        course: { select: { id: true, ad: true } },
        sorular: { orderBy: { siraNo: 'asc' } }
      }
    });

    res.json({ success: true, message: 'Sınav güncellendi', data: updatedSinav });
  } catch (error) {
    console.error('Sınav güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınavı taslağa al (yayından kaldır)
export const unpublishSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;

    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId },
      include: { oturumlar: { where: { tamamlandi: false } } }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    if (sinav.durum !== 'AKTIF') {
      return res.status(400).json({ success: false, message: 'Sadece aktif sınavlar taslağa alınabilir' });
    }

    // Devam eden oturumlar varsa uyarı ver
    if (sinav.oturumlar.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `${sinav.oturumlar.length} öğrenci henüz sınavı tamamlamadı. Önce bekleyin veya sınavı bitirin.` 
      });
    }

    await prisma.onlineSinav.update({
      where: { id: sinavId },
      data: { durum: 'TASLAK' }
    });

    res.json({ success: true, message: 'Sınav taslağa alındı' });
  } catch (error) {
    console.error('Sınav taslağa alma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınav sil
export const deleteSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;

    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId },
      include: { oturumlar: true }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    // Aktif sınav silinemez
    if (sinav.durum === 'AKTIF') {
      return res.status(400).json({ 
        success: false, 
        message: 'Aktif sınav silinemez. Önce taslağa alın.' 
      });
    }

    // Eğer oturum varsa (birileri girmiş), sınav silinemez
    if (sinav.oturumlar.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu sınava katılım olmuş, silinemez. Arşivlemeyi düşünün.' 
      });
    }

    // Önce soruları sil (cascade değilse)
    await prisma.onlineSoru.deleteMany({ where: { sinavId } });
    
    // Sonra sınavı sil
    await prisma.onlineSinav.delete({ where: { id: sinavId } });

    res.json({ success: true, message: 'Sınav silindi' });
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soru ekle
export const addSoru = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;
    const { soruMetni, soruTipi, puan, secenekler, dogruCevap, resimUrl } = req.body;

    // Sınavın öğretmene ait olduğunu kontrol et
    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    // Son sıra numarasını bul
    const sonSoru = await prisma.onlineSoru.findFirst({
      where: { sinavId },
      orderBy: { siraNo: 'desc' }
    });

    const soru = await prisma.onlineSoru.create({
      data: {
        sinavId,
        soruMetni,
        soruTipi: soruTipi || 'COKTAN_SECMELI',
        puan: puan || 10,
        siraNo: (sonSoru?.siraNo || 0) + 1,
        secenekler: secenekler ? JSON.stringify(secenekler) : null,
        dogruCevap,
        resimUrl
      }
    });

    res.json({ success: true, data: soru });
  } catch (error) {
    console.error('Soru ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soruyu güncelle
export const updateSoru = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { soruId } = req.params;
    const { soruMetni, soruTipi, puan, secenekler, dogruCevap, resimUrl } = req.body;

    // Sorunun sınavının öğretmene ait olduğunu kontrol et
    const soru = await prisma.onlineSoru.findFirst({
      where: { id: soruId },
      include: { sinav: { select: { ogretmenId: true } } }
    });

    if (!soru || soru.sinav.ogretmenId !== ogretmenId) {
      return res.status(404).json({ success: false, message: 'Soru bulunamadı' });
    }

    const updatedSoru = await prisma.onlineSoru.update({
      where: { id: soruId },
      data: {
        soruMetni,
        soruTipi,
        puan,
        secenekler: secenekler ? JSON.stringify(secenekler) : null,
        dogruCevap,
        resimUrl
      }
    });

    res.json({ success: true, data: updatedSoru });
  } catch (error) {
    console.error('Soru güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Soruyu sil
export const deleteSoru = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { soruId } = req.params;

    const soru = await prisma.onlineSoru.findFirst({
      where: { id: soruId },
      include: { sinav: { select: { ogretmenId: true } } }
    });

    if (!soru || soru.sinav.ogretmenId !== ogretmenId) {
      return res.status(404).json({ success: false, message: 'Soru bulunamadı' });
    }

    await prisma.onlineSoru.delete({ where: { id: soruId } });

    res.json({ success: true, message: 'Soru silindi' });
  } catch (error) {
    console.error('Soru silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınavı yayınla
export const publishSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;

    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId },
      include: {
        sorular: true,
        course: {
          include: {
            kayitlar: {
              where: { aktif: true },
              include: { ogrenci: { select: { id: true } } }
            }
          }
        }
      }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    if (sinav.sorular.length === 0) {
      return res.status(400).json({ success: false, message: 'Sınavda en az bir soru olmalı' });
    }

    await prisma.onlineSinav.update({
      where: { id: sinavId },
      data: { durum: 'AKTIF' }
    });

    // Öğrencilere bildirim gönder (sadece course bağlı sınavlar için)
    if (sinav.course) {
      const ogrenciIds = sinav.course.kayitlar.map(k => k.ogrenci.id);
      if (ogrenciIds.length > 0) {
        await pushService.sendToUsers(ogrenciIds, {
          title: 'Yeni Online Sınav',
          body: `${sinav.baslik} sınavı yayınlandı. Başlangıç: ${new Date(sinav.baslangicTarihi).toLocaleString('tr-TR')}`
        });
      }
    }

    res.json({ success: true, message: 'Sınav yayınlandı' });
  } catch (error) {
    console.error('Sınav yayınlama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınav sonuçları (öğretmen)
export const getSinavSonuclari = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;
    const { sinavId } = req.params;

    const sinav = await prisma.onlineSinav.findFirst({
      where: { id: sinavId, ogretmenId },
      include: {
        sorular: { orderBy: { siraNo: 'asc' } },
        oturumlar: {
          where: { tamamlandi: true },
          include: {
            ogrenci: { select: { id: true, ad: true, soyad: true, ogrenciNo: true } },
            cevaplar: true
          },
          orderBy: { toplamPuan: 'desc' }
        }
      }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    // İstatistikler
    const puanlar = sinav.oturumlar.map(o => o.toplamPuan || 0);
    const maxPuan = sinav.sorular.reduce((sum, s) => sum + s.puan, 0);
    
    const istatistik = {
      katilimci: sinav.oturumlar.length,
      ortalama: puanlar.length > 0 ? Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length) : 0,
      enYuksek: puanlar.length > 0 ? Math.max(...puanlar) : 0,
      enDusuk: puanlar.length > 0 ? Math.min(...puanlar) : 0,
      maxPuan,
      gecenSayisi: puanlar.filter(p => p >= maxPuan * 0.5).length
    };

    // Soru bazlı analiz
    const soruAnaliz = sinav.sorular.map(soru => {
      const cevaplar = sinav.oturumlar.flatMap(o => o.cevaplar).filter(c => c.soruId === soru.id);
      const dogruSayisi = cevaplar.filter(c => c.dogruMu).length;
      
      return {
        soruId: soru.id,
        siraNo: soru.siraNo,
        dogruOrani: cevaplar.length > 0 ? Math.round((dogruSayisi / cevaplar.length) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        sinav: { id: sinav.id, baslik: sinav.baslik },
        istatistik,
        soruAnaliz,
        oturumlar: sinav.oturumlar
      }
    });
  } catch (error) {
    console.error('Sınav sonuçları hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖĞRENCİ - SINAV ÇÖZME ====================

// Aktif sınavları listele (öğrenci)
export const getAktifSinavlar = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const now = new Date();

    // Öğrencinin kayıtlı olduğu derslerin sınavları
    const kayitlar = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      select: { courseId: true }
    });

    const courseIds = kayitlar.map(k => k.courseId);

    const sinavlar = await prisma.onlineSinav.findMany({
      where: {
        courseId: { in: courseIds },
        durum: 'AKTIF',
        baslangicTarihi: { lte: now },
        bitisTarihi: { gte: now }
      },
      include: {
        course: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } },
        sorular: { select: { id: true } },
        oturumlar: {
          where: { ogrenciId },
          select: { id: true, tamamlandi: true, toplamPuan: true }
        }
      },
      orderBy: { bitisTarihi: 'asc' }
    });

    const sinavlarWithStatus = sinavlar.map(sinav => ({
      id: sinav.id,
      baslik: sinav.baslik,
      aciklama: sinav.aciklama,
      course: sinav.course,
      ogretmen: sinav.ogretmen,
      sure: sinav.sure,
      bitisTarihi: sinav.bitisTarihi,
      soruSayisi: sinav.sorular.length,
      girildiMi: sinav.oturumlar.length > 0,
      tamamlandiMi: sinav.oturumlar.some(o => o.tamamlandi),
      puan: sinav.oturumlar.find(o => o.tamamlandi)?.toplamPuan
    }));

    res.json({ success: true, data: sinavlarWithStatus });
  } catch (error) {
    console.error('Aktif sınavlar hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınava başla
export const startSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { sinavId } = req.params;
    const now = new Date();

    // Sınavı kontrol et
    const sinav = await prisma.onlineSinav.findFirst({
      where: {
        id: sinavId,
        durum: 'AKTIF',
        baslangicTarihi: { lte: now },
        bitisTarihi: { gte: now }
      },
      include: {
        sorular: { orderBy: { siraNo: 'asc' } },
        course: {
          include: {
            kayitlar: { where: { ogrenciId, aktif: true } }
          }
        }
      }
    });

    if (!sinav) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı veya aktif değil' });
    }

    // Course'a bağlı sınavlar için kayıt kontrolü yap
    // Branş bazlı denemeler (courseId null) için bu kontrol atlanır
    if (sinav.course && sinav.course.kayitlar.length === 0) {
      return res.status(403).json({ success: false, message: 'Bu derse kayıtlı değilsiniz' });
    }

    // Mevcut oturum var mı kontrol et
    let oturum = await prisma.sinavOturumu.findUnique({
      where: { sinavId_ogrenciId: { sinavId, ogrenciId: ogrenciId! } },
      include: { cevaplar: true }
    });

    if (oturum?.tamamlandi) {
      return res.status(400).json({ success: false, message: 'Bu sınavı zaten tamamladınız' });
    }

    // Soru sırasını belirle
    let soruSirasi = sinav.sorular.map(s => s.id);
    if (sinav.karistir) {
      soruSirasi = soruSirasi.sort(() => Math.random() - 0.5);
    }

    if (!oturum) {
      // Yeni oturum oluştur
      oturum = await prisma.sinavOturumu.create({
        data: {
          sinavId,
          ogrenciId: ogrenciId!,
          soruSirasi: JSON.stringify(soruSirasi)
        },
        include: { cevaplar: true }
      });
    }

    // Soruları sıraya göre getir (doğru cevapları gizle)
    const siraliSorular = soruSirasi.map(soruId => {
      const soru = sinav.sorular.find(s => s.id === soruId)!;
      return {
        id: soru.id,
        soruMetni: soru.soruMetni,
        soruTipi: soru.soruTipi,
        puan: soru.puan,
        secenekler: soru.secenekler ? JSON.parse(soru.secenekler) : null,
        resimUrl: soru.resimUrl,
        cevap: oturum!.cevaplar.find(c => c.soruId === soru.id)?.cevap || null
      };
    });

    // Kalan süreyi hesapla
    const gecenSure = Math.floor((now.getTime() - oturum.baslangicZamani.getTime()) / 1000 / 60);
    const kalanSure = Math.max(0, sinav.sure - gecenSure);

    res.json({
      success: true,
      data: {
        oturumId: oturum.id,
        sinav: {
          id: sinav.id,
          baslik: sinav.baslik,
          sure: sinav.sure,
          kalanSure,
          geriDonus: sinav.geriDonus,
          sonucGoster: sinav.sonucGoster
        },
        sorular: siraliSorular
      }
    });
  } catch (error) {
    console.error('Sınav başlatma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Cevap kaydet
export const saveCevap = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { oturumId, soruId, cevap } = req.body;

    // Oturumu kontrol et
    const oturum = await prisma.sinavOturumu.findFirst({
      where: { id: oturumId, ogrenciId, tamamlandi: false }
    });

    if (!oturum) {
      return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
    }

    // Cevabı kaydet/güncelle
    await prisma.sinavCevap.upsert({
      where: { oturumId_soruId: { oturumId, soruId } },
      update: { cevap },
      create: { oturumId, soruId, cevap }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınavı bitir
export const finishSinav = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { oturumId } = req.params;

    // Oturumu kontrol et
    const oturum = await prisma.sinavOturumu.findFirst({
      where: { id: oturumId, ogrenciId, tamamlandi: false },
      include: {
        sinav: {
          include: { sorular: true }
        },
        cevaplar: true
      }
    });

    if (!oturum) {
      return res.status(404).json({ success: false, message: 'Oturum bulunamadı' });
    }

    // Değerlendirme yap
    let dogruSayisi = 0;
    let yanlisSayisi = 0;
    let toplamPuan = 0;

    for (const soru of oturum.sinav.sorular) {
      const cevap = oturum.cevaplar.find(c => c.soruId === soru.id);
      
      if (!cevap || !cevap.cevap) {
        // Boş bırakılmış
        continue;
      }

      const dogruMu = cevap.cevap.toUpperCase() === soru.dogruCevap.toUpperCase();
      
      await prisma.sinavCevap.update({
        where: { id: cevap.id },
        data: {
          dogruMu,
          alinanPuan: dogruMu ? soru.puan : 0
        }
      });

      if (dogruMu) {
        dogruSayisi++;
        toplamPuan += soru.puan;
      } else {
        yanlisSayisi++;
      }
    }

    const bosSayisi = oturum.sinav.sorular.length - dogruSayisi - yanlisSayisi;
    const maxPuan = oturum.sinav.sorular.reduce((sum, s) => sum + s.puan, 0);
    const yuzde = maxPuan > 0 ? Math.round((toplamPuan / maxPuan) * 100) : 0;

    // Oturumu güncelle
    const updatedOturum = await prisma.sinavOturumu.update({
      where: { id: oturumId },
      data: {
        tamamlandi: true,
        bitisZamani: new Date(),
        toplamPuan,
        dogruSayisi,
        yanlisSayisi,
        bosSayisi,
        yuzde
      }
    });

    res.json({
      success: true,
      data: {
        toplamPuan,
        maxPuan,
        dogruSayisi,
        yanlisSayisi,
        bosSayisi,
        yuzde,
        sonucGoster: oturum.sinav.sonucGoster
      }
    });
  } catch (error) {
    console.error('Sınav bitirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınav sonucunu görüntüle (öğrenci)
export const getOgrenciSonuc = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;
    const { sinavId } = req.params;

    const oturum = await prisma.sinavOturumu.findFirst({
      where: { sinavId, ogrenciId, tamamlandi: true },
      include: {
        sinav: {
          include: { sorular: { orderBy: { siraNo: 'asc' } } }
        },
        cevaplar: true
      }
    });

    if (!oturum) {
      return res.status(404).json({ success: false, message: 'Sonuç bulunamadı' });
    }

    // Sonuç gösterilecek mi kontrolü
    if (!oturum.sinav.sonucGoster) {
      return res.json({
        success: true,
        data: {
          sinav: { id: oturum.sinav.id, baslik: oturum.sinav.baslik },
          toplamPuan: oturum.toplamPuan,
          maxPuan: oturum.sinav.sorular.reduce((sum, s) => sum + s.puan, 0),
          yuzde: oturum.yuzde,
          detayGoster: false
        }
      });
    }

    // Detaylı sonuç
    const sorularWithCevap = oturum.sinav.sorular.map(soru => {
      const cevap = oturum.cevaplar.find(c => c.soruId === soru.id);
      return {
        id: soru.id,
        soruMetni: soru.soruMetni,
        soruTipi: soru.soruTipi,
        secenekler: soru.secenekler ? JSON.parse(soru.secenekler) : null,
        dogruCevap: soru.dogruCevap,
        verilenCevap: cevap?.cevap || null,
        dogruMu: cevap?.dogruMu || false,
        puan: soru.puan,
        alinanPuan: cevap?.alinanPuan || 0
      };
    });

    res.json({
      success: true,
      data: {
        sinav: { id: oturum.sinav.id, baslik: oturum.sinav.baslik },
        toplamPuan: oturum.toplamPuan,
        maxPuan: oturum.sinav.sorular.reduce((sum, s) => sum + s.puan, 0),
        dogruSayisi: oturum.dogruSayisi,
        yanlisSayisi: oturum.yanlisSayisi,
        bosSayisi: oturum.bosSayisi,
        yuzde: oturum.yuzde,
        detayGoster: true,
        sorular: sorularWithCevap
      }
    });
  } catch (error) {
    console.error('Öğrenci sonuç hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğrencinin tüm sınav geçmişi
export const getOgrenciSinavGecmisi = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    const oturumlar = await prisma.sinavOturumu.findMany({
      where: { ogrenciId, tamamlandi: true },
      include: {
        sinav: {
          include: {
            course: { select: { id: true, ad: true } },
            sorular: { select: { puan: true } }
          }
        }
      },
      orderBy: { bitisZamani: 'desc' }
    });

    const gecmis = oturumlar.map(oturum => ({
      sinavId: oturum.sinav.id,
      baslik: oturum.sinav.baslik,
      ders: oturum.sinav.course,
      tarih: oturum.bitisZamani,
      toplamPuan: oturum.toplamPuan,
      maxPuan: oturum.sinav.sorular.reduce((sum, s) => sum + s.puan, 0),
      yuzde: oturum.yuzde,
      dogruSayisi: oturum.dogruSayisi,
      yanlisSayisi: oturum.yanlisSayisi
    }));

    res.json({ success: true, data: gecmis });
  } catch (error) {
    console.error('Sınav geçmişi hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

