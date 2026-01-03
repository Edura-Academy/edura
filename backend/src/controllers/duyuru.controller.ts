import { Response } from 'express';
import prisma from '../lib/prisma';
import { DuyuruHedef, DuyuruOncelik } from '@prisma/client';
import { AuthRequest } from '../types';
import { pushService } from '../services/push.service';

// ==================== DUYURU YÖNETİMİ (Personel) ====================

// Tüm duyuruları getir (yönetim için)
export const getAllDuyurular = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const kursId = req.user?.kursId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const duyurular = await prisma.duyuru.findMany({
      where: kursId ? { kursId } : {},
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true, role: true } },
        kurs: { select: { id: true, ad: true } },
        _count: { select: { okuyanlar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: duyurular });
  } catch (error) {
    console.error('Duyurular alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Yeni duyuru oluştur
export const createDuyuru = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const kursId = req.user?.kursId;
    const { baslik, icerik, hedef, oncelik, sinifIds, dosyaUrl, dosyaAd, yayinTarihi, bitisTarihi } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    if (!baslik || !icerik) {
      return res.status(400).json({ success: false, error: 'Başlık ve içerik gerekli' });
    }

    // Duyuruyu oluştur
    const duyuru = await prisma.duyuru.create({
      data: {
        baslik,
        icerik,
        hedef: hedef || 'HERKESE',
        oncelik: oncelik || 'NORMAL',
        sinifIds: sinifIds ? JSON.stringify(sinifIds) : null,
        dosyaUrl,
        dosyaAd,
        olusturanId: userId,
        kursId,
        yayinTarihi: yayinTarihi ? new Date(yayinTarihi) : new Date(),
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null
      },
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true } }
      }
    });

    // Hedef kitleye bildirim gönder
    await sendDuyuruNotifications(duyuru, kursId || undefined);

    res.status(201).json({ success: true, data: duyuru });
  } catch (error) {
    console.error('Duyuru oluşturulurken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Duyuru güncelle
export const updateDuyuru = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { duyuruId } = req.params;
    const { baslik, icerik, hedef, oncelik, sinifIds, dosyaUrl, dosyaAd, aktif, bitisTarihi } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Duyurunun var olduğunu kontrol et
    const existingDuyuru = await prisma.duyuru.findUnique({
      where: { id: duyuruId }
    });

    if (!existingDuyuru) {
      return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
    }

    const updatedDuyuru = await prisma.duyuru.update({
      where: { id: duyuruId },
      data: {
        ...(baslik && { baslik }),
        ...(icerik && { icerik }),
        ...(hedef && { hedef }),
        ...(oncelik && { oncelik }),
        ...(sinifIds !== undefined && { sinifIds: sinifIds ? JSON.stringify(sinifIds) : null }),
        ...(dosyaUrl !== undefined && { dosyaUrl }),
        ...(dosyaAd !== undefined && { dosyaAd }),
        ...(aktif !== undefined && { aktif }),
        ...(bitisTarihi !== undefined && { bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null })
      }
    });

    res.json({ success: true, data: updatedDuyuru });
  } catch (error) {
    console.error('Duyuru güncellenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Duyuru sil
export const deleteDuyuru = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { duyuruId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Önce okumaları sil
    await prisma.duyuruOkuma.deleteMany({
      where: { duyuruId }
    });

    // Sonra duyuruyu sil
    await prisma.duyuru.delete({
      where: { id: duyuruId }
    });

    res.json({ success: true, message: 'Duyuru silindi' });
  } catch (error) {
    console.error('Duyuru silinirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== DUYURU GÖRÜNTÜLEME (Tüm Kullanıcılar) ====================

// Kullanıcının görebileceği duyuruları getir
export const getMyDuyurular = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const kursId = req.user?.kursId;
    const sinifId = req.user?.sinifId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const now = new Date();

    // Hedef filtreleme
    const hedefFilter: DuyuruHedef[] = ['HERKESE'];
    
    if (role === 'ogrenci') {
      hedefFilter.push('OGRENCILER', 'SINIF');
    } else if (role === 'ogretmen') {
      hedefFilter.push('OGRETMENLER', 'PERSONEL');
    } else if (role === 'mudur' || role === 'sekreter') {
      hedefFilter.push('PERSONEL');
    }

    const duyurular = await prisma.duyuru.findMany({
      where: {
        aktif: true,
        yayinTarihi: { lte: now },
        OR: [
          { bitisTarihi: null },
          { bitisTarihi: { gte: now } }
        ],
        hedef: { in: hedefFilter },
        ...(kursId ? { OR: [{ kursId }, { kursId: null }] } : {})
      },
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true, role: true } },
        okuyanlar: {
          where: { userId },
          select: { okunmaTarihi: true }
        }
      },
      orderBy: [
        { oncelik: 'desc' },
        { yayinTarihi: 'desc' }
      ]
    });

    // Sınıf filtreleme (SINIF hedefli duyurular için)
    const filteredDuyurular = duyurular.filter(d => {
      if (d.hedef !== 'SINIF') return true;
      if (!d.sinifIds || !sinifId) return false;
      
      try {
        const sinifIdList = JSON.parse(d.sinifIds);
        return sinifIdList.includes(sinifId);
      } catch {
        return false;
      }
    });

    // Response formatla
    const formattedDuyurular = filteredDuyurular.map(d => ({
      id: d.id,
      baslik: d.baslik,
      icerik: d.icerik,
      hedef: d.hedef,
      oncelik: d.oncelik,
      dosyaUrl: d.dosyaUrl,
      dosyaAd: d.dosyaAd,
      olusturan: `${d.olusturan.ad} ${d.olusturan.soyad}`,
      olusturanRol: d.olusturan.role,
      yayinTarihi: d.yayinTarihi,
      okundu: d.okuyanlar.length > 0,
      okunmaTarihi: d.okuyanlar[0]?.okunmaTarihi || null
    }));

    // İstatistikler
    const istatistik = {
      toplam: formattedDuyurular.length,
      okunmamis: formattedDuyurular.filter(d => !d.okundu).length,
      acil: formattedDuyurular.filter(d => d.oncelik === 'ACIL').length,
      onemli: formattedDuyurular.filter(d => d.oncelik === 'ONEMLI').length
    };

    res.json({
      success: true,
      data: {
        duyurular: formattedDuyurular,
        istatistik
      }
    });
  } catch (error) {
    console.error('Duyurular alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Duyuruyu okundu olarak işaretle
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { duyuruId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    // Upsert - zaten okunmuşsa hata verme
    await prisma.duyuruOkuma.upsert({
      where: {
        duyuruId_userId: { duyuruId, userId }
      },
      update: {},
      create: {
        duyuruId,
        userId
      }
    });

    res.json({ success: true, message: 'Duyuru okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Duyuru okundu işaretlenirken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// Tek duyuru detayı
export const getDuyuruById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { duyuruId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' });
    }

    const duyuru = await prisma.duyuru.findUnique({
      where: { id: duyuruId },
      include: {
        olusturan: { select: { id: true, ad: true, soyad: true, role: true } },
        _count: { select: { okuyanlar: true } }
      }
    });

    if (!duyuru) {
      return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
    }

    // Okundu olarak işaretle
    await prisma.duyuruOkuma.upsert({
      where: {
        duyuruId_userId: { duyuruId, userId }
      },
      update: {},
      create: {
        duyuruId,
        userId
      }
    });

    res.json({ success: true, data: duyuru });
  } catch (error) {
    console.error('Duyuru alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

// ==================== YARDIMCI FONKSİYONLAR ====================

// Duyuru bildirimlerini gönder
async function sendDuyuruNotifications(duyuru: any, kursId?: string) {
  try {
    // Hedef kullanıcıları belirle
    let userFilter: any = { aktif: true };

    if (kursId) {
      userFilter.kursId = kursId;
    }

    switch (duyuru.hedef) {
      case 'OGRETMENLER':
        userFilter.role = 'ogretmen';
        break;
      case 'OGRENCILER':
        userFilter.role = 'ogrenci';
        break;
      case 'PERSONEL':
        userFilter.role = { in: ['mudur', 'ogretmen', 'sekreter'] };
        break;
      case 'SINIF':
        if (duyuru.sinifIds) {
          try {
            const sinifIdList = JSON.parse(duyuru.sinifIds);
            userFilter.sinifId = { in: sinifIdList };
          } catch {}
        }
        break;
      // HERKESE - filtre yok
    }

    const users = await prisma.user.findMany({
      where: userFilter,
      select: { id: true }
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) return;

    // Uygulama içi bildirim
    await prisma.notification.createMany({
      data: userIds.map(uid => ({
        userId: uid,
        tip: duyuru.oncelik === 'ACIL' ? 'SISTEM' : 'BILDIRIM',
        baslik: duyuru.oncelik === 'ACIL' ? '🚨 Acil Duyuru' : '📢 Yeni Duyuru',
        mesaj: duyuru.baslik
      }))
    });

    // Push notification
    const oncelikEmoji = duyuru.oncelik === 'ACIL' ? '🚨' : duyuru.oncelik === 'ONEMLI' ? '⚠️' : '📢';
    
    pushService.sendToUsers(userIds, {
      title: `${oncelikEmoji} ${duyuru.baslik}`,
      body: duyuru.icerik.substring(0, 100) + (duyuru.icerik.length > 100 ? '...' : ''),
      click_action: '/tr/duyurular',
      data: {
        type: 'ANNOUNCEMENT',
        duyuruId: duyuru.id,
        oncelik: duyuru.oncelik
      }
    }).catch(err => console.error('Push notification hatası:', err));

  } catch (error) {
    console.error('Duyuru bildirimi gönderilirken hata:', error);
  }
}

// Sınıfları getir (duyuru oluştururken seçmek için)
export const getSiniflar = async (req: AuthRequest, res: Response) => {
  try {
    const kursId = req.user?.kursId;

    const siniflar = await prisma.sinif.findMany({
      where: kursId ? { kursId, aktif: true } : { aktif: true },
      select: {
        id: true,
        ad: true,
        seviye: true,
        _count: { select: { ogrenciler: true } }
      },
      orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
    });

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Sınıflar alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
};

