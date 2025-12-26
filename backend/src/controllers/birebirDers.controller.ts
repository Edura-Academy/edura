import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ==================== ÖĞRETMEN FONKSİYONLARI ====================

// Öğretmenin müsaitlik takvimini al
export const getOgretmenMusaitlik = async (req: Request, res: Response) => {
  try {
    const ogretmenId = (req as any).user.id;
    const { tarih } = req.query;

    // Belirli tarihteki randevuları getir
    const randevular = await prisma.birebirDers.findMany({
      where: {
        ogretmenId,
        tarih: tarih ? {
          gte: new Date(tarih as string),
          lt: new Date(new Date(tarih as string).setDate(new Date(tarih as string).getDate() + 7))
        } : undefined,
        durum: { not: 'IPTAL' }
      },
      include: {
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        }
      },
      orderBy: { tarih: 'asc' }
    });

    res.json(randevular);
  } catch (error) {
    console.error('Müsaitlik hatası:', error);
    res.status(500).json({ error: 'Müsaitlik alınamadı' });
  }
};

// Öğretmenin tüm birebir derslerini getir
export const getOgretmenBirebirDersleri = async (req: Request, res: Response) => {
  try {
    const ogretmenId = (req as any).user.id;
    const { durum } = req.query;

    const where: any = { ogretmenId };
    if (durum) where.durum = durum;

    const dersler = await prisma.birebirDers.findMany({
      where,
      include: {
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            ogrenciNo: true,
            sinif: {
              select: { ad: true }
            }
          }
        }
      },
      orderBy: { tarih: 'desc' }
    });

    res.json(dersler);
  } catch (error) {
    console.error('Birebir ders listesi hatası:', error);
    res.status(500).json({ error: 'Dersler alınamadı' });
  }
};

// Ders durumunu güncelle
export const updateBirebirDersDurum = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ogretmenId = (req as any).user.id;
    const { durum, ogretmenNotu } = req.body;

    const ders = await prisma.birebirDers.findFirst({
      where: { id, ogretmenId },
      include: { ogrenci: true }
    });

    if (!ders) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }

    const updated = await prisma.birebirDers.update({
      where: { id },
      data: { durum, ogretmenNotu }
    });

    // Tamamlandıysa öğrencinin paketinden saat düş
    if (durum === 'TAMAMLANDI') {
      const paket = await prisma.birebirDersPaketi.findFirst({
        where: {
          ogrenciId: ders.ogrenciId,
          aktif: true,
          kalanSaat: { gt: 0 }
        }
      });

      if (paket) {
        await prisma.birebirDersPaketi.update({
          where: { id: paket.id },
          data: {
            kullanilanSaat: { increment: 1 },
            kalanSaat: { decrement: 1 }
          }
        });
      }

      // Bildirim gönder
      await prisma.notification.create({
        data: {
          userId: ders.ogrenciId,
          tip: 'BILDIRIM',
          baslik: '✅ Birebir Ders Tamamlandı',
          mesaj: `${new Date(ders.tarih).toLocaleDateString('tr-TR')} tarihli birebir dersiniz tamamlandı.`
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    res.status(500).json({ error: 'Ders güncellenemedi' });
  }
};

// ==================== ÖĞRENCİ FONKSİYONLARI ====================

// Öğrencinin saat paketlerini getir
export const getOgrenciPaketleri = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;

    const paketler = await prisma.birebirDersPaketi.findMany({
      where: { ogrenciId },
      orderBy: { createdAt: 'desc' }
    });

    // Aktif paket özeti
    const aktivPaket = paketler.find(p => p.aktif && p.kalanSaat > 0);

    res.json({
      paketler,
      aktivPaket,
      toplamKalanSaat: paketler.reduce((acc, p) => acc + (p.aktif ? p.kalanSaat : 0), 0)
    });
  } catch (error) {
    console.error('Paket listesi hatası:', error);
    res.status(500).json({ error: 'Paketler alınamadı' });
  }
};

// Öğrencinin birebir derslerini getir
export const getOgrenciBirebirDersleri = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;
    const { durum } = req.query;

    const where: any = { ogrenciId };
    if (durum) where.durum = durum;

    const dersler = await prisma.birebirDers.findMany({
      where,
      include: {
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            brans: true
          }
        }
      },
      orderBy: { tarih: 'desc' }
    });

    res.json(dersler);
  } catch (error) {
    console.error('Birebir ders listesi hatası:', error);
    res.status(500).json({ error: 'Dersler alınamadı' });
  }
};

// Öğretmenlerin müsait saatlerini getir
export const getMusaitOgretmenler = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;
    const { tarih, brans } = req.query;

    // Öğrencinin kursundaki öğretmenleri getir
    const ogrenci = await prisma.user.findUnique({
      where: { id: ogrenciId },
      select: { kursId: true }
    });

    const where: any = {
      role: 'ogretmen',
      kursId: ogrenci?.kursId,
      aktif: true
    };

    if (brans) where.brans = brans;

    const ogretmenler = await prisma.user.findMany({
      where,
      select: {
        id: true,
        ad: true,
        soyad: true,
        brans: true,
        ogretmenBirebirDersler: {
          where: {
            tarih: tarih ? {
              gte: new Date(tarih as string),
              lt: new Date(new Date(tarih as string).setDate(new Date(tarih as string).getDate() + 1))
            } : undefined,
            durum: { not: 'IPTAL' }
          },
          select: {
            baslangicSaati: true,
            bitisSaati: true
          }
        }
      }
    });

    // Her öğretmenin müsait saatlerini hesapla
    const saatler = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    
    const result = ogretmenler.map(o => {
      const doluSaatler = o.ogretmenBirebirDersler.map(d => d.baslangicSaati);
      const musaitSaatler = saatler.filter(s => !doluSaatler.includes(s));
      
      return {
        id: o.id,
        ad: o.ad,
        soyad: o.soyad,
        brans: o.brans,
        musaitSaatler,
        doluSaatler
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Müsait öğretmenler hatası:', error);
    res.status(500).json({ error: 'Öğretmenler alınamadı' });
  }
};

// Randevu oluştur
export const createRandevu = async (req: Request, res: Response) => {
  try {
    const ogrenciId = (req as any).user.id;
    const { ogretmenId, tarih, baslangicSaati, konu, aciklama } = req.body;

    // Öğrencinin aktif paketi var mı kontrol et
    const paket = await prisma.birebirDersPaketi.findFirst({
      where: {
        ogrenciId,
        aktif: true,
        kalanSaat: { gt: 0 }
      }
    });

    if (!paket) {
      return res.status(400).json({ error: 'Aktif saat paketiniz bulunmuyor' });
    }

    // Çakışma kontrolü
    const mevcutRandevu = await prisma.birebirDers.findFirst({
      where: {
        ogretmenId,
        tarih: new Date(tarih),
        baslangicSaati,
        durum: { not: 'IPTAL' }
      }
    });

    if (mevcutRandevu) {
      return res.status(400).json({ error: 'Bu saat dolu' });
    }

    // Bitiş saatini hesapla (1 saat sonra)
    const [saat] = baslangicSaati.split(':');
    const bitisSaati = `${String(parseInt(saat) + 1).padStart(2, '0')}:00`;

    // Jitsi oda adı
    const odaAdi = `edura-birebir-${uuidv4().slice(0, 8)}`;

    const randevu = await prisma.birebirDers.create({
      data: {
        ogretmenId,
        ogrenciId,
        tarih: new Date(tarih),
        baslangicSaati,
        bitisSaati,
        konu,
        aciklama,
        odaAdi
      },
      include: {
        ogretmen: {
          select: {
            ad: true,
            soyad: true
          }
        }
      }
    });

    // Öğretmene bildirim gönder
    const ogrenci = await prisma.user.findUnique({
      where: { id: ogrenciId },
      select: { ad: true, soyad: true }
    });

    await prisma.notification.create({
      data: {
        userId: ogretmenId,
        tip: 'BILDIRIM',
        baslik: '📅 Yeni Birebir Ders Randevusu',
        mesaj: `${ogrenci?.ad} ${ogrenci?.soyad} ${new Date(tarih).toLocaleDateString('tr-TR')} tarihinde ${baslangicSaati} için randevu aldı.`
      }
    });

    res.status(201).json(randevu);
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    res.status(500).json({ error: 'Randevu oluşturulamadı' });
  }
};

// Randevu iptal et
export const cancelRandevu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const randevu = await prisma.birebirDers.findUnique({
      where: { id },
      include: {
        ogretmen: { select: { ad: true, soyad: true } },
        ogrenci: { select: { ad: true, soyad: true } }
      }
    });

    if (!randevu) {
      return res.status(404).json({ error: 'Randevu bulunamadı' });
    }

    // Yetki kontrolü
    if (userRole === 'ogrenci' && randevu.ogrenciId !== userId) {
      return res.status(403).json({ error: 'Bu randevuyu iptal edemezsiniz' });
    }

    if (userRole === 'ogretmen' && randevu.ogretmenId !== userId) {
      return res.status(403).json({ error: 'Bu randevuyu iptal edemezsiniz' });
    }

    await prisma.birebirDers.update({
      where: { id },
      data: { durum: 'IPTAL' }
    });

    // Karşı tarafa bildirim gönder
    const aliciId = userRole === 'ogrenci' ? randevu.ogretmenId : randevu.ogrenciId;
    const iptalEden = userRole === 'ogrenci' 
      ? `${randevu.ogrenci.ad} ${randevu.ogrenci.soyad}`
      : `${randevu.ogretmen.ad} ${randevu.ogretmen.soyad}`;

    await prisma.notification.create({
      data: {
        userId: aliciId,
        tip: 'BILDIRIM',
        baslik: '❌ Randevu İptal Edildi',
        mesaj: `${iptalEden} tarafından ${new Date(randevu.tarih).toLocaleDateString('tr-TR')} ${randevu.baslangicSaati} randevusu iptal edildi.`
      }
    });

    res.json({ message: 'Randevu iptal edildi' });
  } catch (error) {
    console.error('Randevu iptal hatası:', error);
    res.status(500).json({ error: 'Randevu iptal edilemedi' });
  }
};

// Birebir ders detayı
export const getBirebirDersById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ders = await prisma.birebirDers.findUnique({
      where: { id },
      include: {
        ogretmen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            brans: true
          }
        },
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            sinif: { select: { ad: true } }
          }
        }
      }
    });

    if (!ders) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }

    res.json(ders);
  } catch (error) {
    console.error('Ders detay hatası:', error);
    res.status(500).json({ error: 'Ders detayı alınamadı' });
  }
};

// ==================== YÖNETİM FONKSİYONLARI ====================

// Öğrenciye saat paketi ekle
export const createSaatPaketi = async (req: Request, res: Response) => {
  try {
    const { ogrenciId, toplamSaat, fiyat, bitisTarihi } = req.body;

    const paket = await prisma.birebirDersPaketi.create({
      data: {
        ogrenciId,
        toplamSaat,
        kalanSaat: toplamSaat,
        fiyat,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : undefined
      }
    });

    // Öğrenciye bildirim gönder
    await prisma.notification.create({
      data: {
        userId: ogrenciId,
        tip: 'BILDIRIM',
        baslik: '🎁 Yeni Saat Paketi Eklendi',
        mesaj: `Hesabınıza ${toplamSaat} saatlik birebir ders paketi eklendi.`
      }
    });

    res.status(201).json(paket);
  } catch (error) {
    console.error('Paket oluşturma hatası:', error);
    res.status(500).json({ error: 'Paket oluşturulamadı' });
  }
};

// Tüm paketleri getir (admin/müdür için)
export const getAllPaketler = async (req: Request, res: Response) => {
  try {
    const paketler = await prisma.birebirDersPaketi.findMany({
      include: {
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            ogrenciNo: true,
            sinif: { select: { ad: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(paketler);
  } catch (error) {
    console.error('Paket listesi hatası:', error);
    res.status(500).json({ error: 'Paketler alınamadı' });
  }
};

