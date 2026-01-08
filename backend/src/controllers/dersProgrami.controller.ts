import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Haftalık ders programını getir (öğretmen için)
export const getOgretmenDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const ogretmenId = req.user?.id;

    const dersler = await prisma.course.findMany({
      where: { ogretmenId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true } }
      },
      orderBy: [
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    // FullCalendar formatına dönüştür
    const events = dersler.map(ders => ({
      id: ders.id,
      title: `${ders.ad} - ${ders.sinif.ad}`,
      daysOfWeek: [gunToNumber(ders.gun)],
      startTime: ders.baslangicSaati,
      endTime: ders.bitisSaati,
      extendedProps: {
        dersAd: ders.ad,
        sinifAd: ders.sinif.ad,
        sinifId: ders.sinifId,
        aciklama: ders.aciklama
      },
      backgroundColor: getDersColor(ders.ad),
      borderColor: getDersColor(ders.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Öğretmen ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğrenci ders programı
export const getOgrenciDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const ogrenciId = req.user?.id;

    // Öğrencinin kayıtlı olduğu dersler
    const kayitlar = await prisma.courseEnrollment.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        course: {
          include: {
            sinif: { select: { id: true, ad: true } },
            ogretmen: { select: { id: true, ad: true, soyad: true } }
          }
        }
      }
    });

    const events = kayitlar.map(kayit => ({
      id: kayit.course.id,
      title: kayit.course.ad,
      daysOfWeek: [gunToNumber(kayit.course.gun)],
      startTime: kayit.course.baslangicSaati,
      endTime: kayit.course.bitisSaati,
      extendedProps: {
        dersAd: kayit.course.ad,
        sinifAd: kayit.course.sinif.ad,
        ogretmenAd: `${kayit.course.ogretmen.ad} ${kayit.course.ogretmen.soyad}`,
        aciklama: kayit.course.aciklama
      },
      backgroundColor: getDersColor(kayit.course.ad),
      borderColor: getDersColor(kayit.course.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Öğrenci ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Sınıf bazlı ders programı (personel görüntülemesi için)
export const getSinifDersProgrami = async (req: AuthRequest, res: Response) => {
  try {
    const { sinifId } = req.params;

    const dersler = await prisma.course.findMany({
      where: { sinifId, aktif: true },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      },
      orderBy: [
        { gun: 'asc' },
        { baslangicSaati: 'asc' }
      ]
    });

    const events = dersler.map(ders => ({
      id: ders.id,
      title: ders.ad,
      daysOfWeek: [gunToNumber(ders.gun)],
      startTime: ders.baslangicSaati,
      endTime: ders.bitisSaati,
      extendedProps: {
        dersAd: ders.ad,
        ogretmenAd: `${ders.ogretmen.ad} ${ders.ogretmen.soyad}`,
        aciklama: ders.aciklama
      },
      backgroundColor: getDersColor(ders.ad),
      borderColor: getDersColor(ders.ad)
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Sınıf ders programı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Tüm sınıfları listele
export const getSiniflar = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const siniflar = await prisma.sinif.findMany({
      where: user?.kursId ? { kursId: user.kursId } : {},
      select: { id: true, ad: true, seviye: true },
      orderBy: { seviye: 'asc' }
    });

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Sınıflar listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Yeni ders ekle (personel)
export const createDers = async (req: AuthRequest, res: Response) => {
  try {
    const { ad, aciklama, sinifId, ogretmenId, gun, baslangicSaati, bitisSaati } = req.body;

    // Çakışma kontrolü
    const cakisma = await prisma.course.findFirst({
      where: {
        sinifId,
        gun,
        aktif: true,
        OR: [
          {
            AND: [
              { baslangicSaati: { lte: baslangicSaati } },
              { bitisSaati: { gt: baslangicSaati } }
            ]
          },
          {
            AND: [
              { baslangicSaati: { lt: bitisSaati } },
              { bitisSaati: { gte: bitisSaati } }
            ]
          }
        ]
      }
    });

    if (cakisma) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu saatte zaten ders var' 
      });
    }

    const ders = await prisma.course.create({
      data: {
        ad,
        aciklama,
        sinifId,
        ogretmenId,
        gun,
        baslangicSaati,
        bitisSaati
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.json({ success: true, data: ders });
  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ders güncelle
export const updateDers = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;
    const { ad, aciklama, gun, baslangicSaati, bitisSaati, ogretmenId } = req.body;

    const ders = await prisma.course.update({
      where: { id: dersId },
      data: {
        ...(ad && { ad }),
        ...(aciklama !== undefined && { aciklama }),
        ...(gun && { gun }),
        ...(baslangicSaati && { baslangicSaati }),
        ...(bitisSaati && { bitisSaati }),
        ...(ogretmenId && { ogretmenId })
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    res.json({ success: true, data: ders });
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ders sil
export const deleteDers = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;

    await prisma.course.update({
      where: { id: dersId },
      data: { aktif: false }
    });

    res.json({ success: true, message: 'Ders silindi' });
  } catch (error) {
    console.error('Ders silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğretmenleri listele
export const getOgretmenler = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { kursId: true }
    });

    const ogretmenler = await prisma.user.findMany({
      where: { 
        role: 'ogretmen',
        ...(user?.kursId ? { kursId: user.kursId } : {})
      },
      select: { 
        id: true, 
        ad: true, 
        soyad: true,
        brans: true
      },
      orderBy: { ad: 'asc' }
    });

    res.json({ success: true, data: ogretmenler });
  } catch (error) {
    console.error('Öğretmenler listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Yardımcı fonksiyonlar
function gunToNumber(gun: string): number {
  const gunler: Record<string, number> = {
    'Pazartesi': 1,
    'Salı': 2,
    'Çarşamba': 3,
    'Perşembe': 4,
    'Cuma': 5,
    'Cumartesi': 6,
    'Pazar': 0
  };
  return gunler[gun] ?? 1;
}

function getDersColor(dersAd: string): string {
  const colors: Record<string, string> = {
    'Matematik': '#3b82f6',
    'Türkçe': '#ef4444',
    'Fizik': '#8b5cf6',
    'Kimya': '#f59e0b',
    'Biyoloji': '#10b981',
    'Tarih': '#6366f1',
    'Coğrafya': '#14b8a6',
    'İngilizce': '#ec4899',
    'Almanca': '#f97316',
    'Felsefe': '#8b5cf6',
    'Din Kültürü': '#22c55e',
    'Geometri': '#0ea5e9'
  };
  
  // Ders adında anahtar kelime ara
  for (const [key, color] of Object.entries(colors)) {
    if (dersAd.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Varsayılan renk (hash based)
  let hash = 0;
  for (let i = 0; i < dersAd.length; i++) {
    hash = dersAd.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// ==================== iCAL EXPORT ====================

// iCal formatında ders programı export
export const exportToICal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let dersler: any[] = [];

    if (userRole === 'ogretmen') {
      dersler = await prisma.course.findMany({
        where: { ogretmenId: userId, aktif: true },
        include: {
          sinif: { select: { ad: true } }
        }
      });
    } else if (userRole === 'ogrenci') {
      const kayitlar = await prisma.courseEnrollment.findMany({
        where: { ogrenciId: userId, aktif: true },
        include: {
          course: {
            include: {
              sinif: { select: { ad: true } },
              ogretmen: { select: { ad: true, soyad: true } }
            }
          }
        }
      });
      dersler = kayitlar.map(k => ({
        ...k.course,
        ogretmenAd: `${k.course.ogretmen.ad} ${k.course.ogretmen.soyad}`
      }));
    }

    // iCal oluştur
    const icalContent = generateICalContent(dersler, userRole || 'ogrenci');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ders-programi.ics"');
    res.send(icalContent);
  } catch (error) {
    console.error('iCal export hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// iCal içeriği oluştur
function generateICalContent(dersler: any[], userRole: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Edura//Ders Programi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Edura Ders Programı'
  ];

  // Günleri ISO formatına çevir
  const gunMap: Record<string, string> = {
    'Pazartesi': 'MO',
    'Salı': 'TU',
    'Çarşamba': 'WE',
    'Perşembe': 'TH',
    'Cuma': 'FR',
    'Cumartesi': 'SA',
    'Pazar': 'SU'
  };

  // Başlangıç tarihi (bu haftanın pazartesisi)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  dersler.forEach((ders, index) => {
    const gunOffset = gunToNumber(ders.gun) - 1; // Pazartesi = 0
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + gunOffset);

    const [startHour, startMin] = ders.baslangicSaati.split(':').map(Number);
    const [endHour, endMin] = ders.bitisSaati.split(':').map(Number);

    const dtStart = formatICalDate(eventDate, startHour, startMin);
    const dtEnd = formatICalDate(eventDate, endHour, endMin);

    const summary = userRole === 'ogretmen' 
      ? `${ders.ad} - ${ders.sinif?.ad || ''}`
      : `${ders.ad}`;
    
    const description = userRole === 'ogrenci' && ders.ogretmenAd
      ? `Öğretmen: ${ders.ogretmenAd}`
      : ders.aciklama || '';

    lines.push(
      'BEGIN:VEVENT',
      `UID:edura-ders-${ders.id}@edura.com`,
      `DTSTAMP:${formatICalDate(now, now.getHours(), now.getMinutes())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${gunMap[ders.gun] || 'MO'}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `CATEGORIES:DERS`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICalDate(date: Date, hour: number, minute: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${year}${month}${day}T${h}${m}00`;
}

function escapeICalText(text: string): string {
  return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
}

// ==================== DERS DEĞİŞİKLİĞİ BİLDİRİMİ ====================

// Ders güncelleme (bildirimli)
export const updateDersWithNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;
    const { ad, aciklama, gun, baslangicSaati, bitisSaati, ogretmenId, bildirimGonder = true } = req.body;

    // Mevcut ders bilgilerini al
    const mevcutDers = await prisma.course.findUnique({
      where: { id: dersId },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } },
        kayitlar: {
          where: { aktif: true },
          select: { ogrenciId: true }
        }
      }
    });

    if (!mevcutDers) {
      return res.status(404).json({ success: false, message: 'Ders bulunamadı' });
    }

    // Değişiklikleri tespit et
    const degisiklikler: string[] = [];
    if (gun && gun !== mevcutDers.gun) degisiklikler.push(`Gün: ${mevcutDers.gun} → ${gun}`);
    if (baslangicSaati && baslangicSaati !== mevcutDers.baslangicSaati) degisiklikler.push(`Başlangıç: ${mevcutDers.baslangicSaati} → ${baslangicSaati}`);
    if (bitisSaati && bitisSaati !== mevcutDers.bitisSaati) degisiklikler.push(`Bitiş: ${mevcutDers.bitisSaati} → ${bitisSaati}`);

    // Dersi güncelle
    const ders = await prisma.course.update({
      where: { id: dersId },
      data: {
        ...(ad && { ad }),
        ...(aciklama !== undefined && { aciklama }),
        ...(gun && { gun }),
        ...(baslangicSaati && { baslangicSaati }),
        ...(bitisSaati && { bitisSaati }),
        ...(ogretmenId && { ogretmenId })
      },
      include: {
        sinif: { select: { id: true, ad: true } },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    // Bildirim gönder
    if (bildirimGonder && degisiklikler.length > 0) {
      const ogrenciIds = mevcutDers.kayitlar.map(k => k.ogrenciId);
      
      const bildirimler = ogrenciIds.map(ogrenciId => ({
        userId: ogrenciId,
        tip: 'BILDIRIM' as const,
        baslik: '📅 Ders Programı Değişikliği',
        mesaj: `${ders.ad} dersinde değişiklik yapıldı:\n${degisiklikler.join('\n')}`
      }));

      if (bildirimler.length > 0) {
        await prisma.notification.createMany({ data: bildirimler });
      }

      // Öğretmene de bildirim
      if (mevcutDers.ogretmen.id !== req.user?.id) {
        await prisma.notification.create({
          data: {
            userId: mevcutDers.ogretmen.id,
            tip: 'BILDIRIM',
            baslik: '📅 Ders Programı Değişikliği',
            mesaj: `${ders.ad} dersinde değişiklik yapıldı:\n${degisiklikler.join('\n')}`
          }
        });
      }
    }

    res.json({ 
      success: true, 
      data: ders,
      degisiklikler,
      bildirimGonderildi: bildirimGonder && degisiklikler.length > 0
    });
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== DERS İPTALİ / TELAFİ ====================

// Ders iptali
export const cancelDers = async (req: AuthRequest, res: Response) => {
  try {
    const { dersId } = req.params;
    const { iptalTarihi, sebep, telafiTarihi, telafiGun, telafiBaslangic, telafiBitis } = req.body;

    const ders = await prisma.course.findUnique({
      where: { id: dersId },
      include: {
        kayitlar: {
          where: { aktif: true },
          select: { ogrenciId: true }
        },
        ogretmen: { select: { id: true, ad: true, soyad: true } }
      }
    });

    if (!ders) {
      return res.status(404).json({ success: false, message: 'Ders bulunamadı' });
    }

    // Öğrencilere bildirim gönder
    const ogrenciIds = ders.kayitlar.map(k => k.ogrenciId);
    
    let bildirimMesaji = `${ders.ad} dersi ${new Date(iptalTarihi).toLocaleDateString('tr-TR')} tarihinde iptal edilmiştir.`;
    if (sebep) bildirimMesaji += `\nSebep: ${sebep}`;
    if (telafiTarihi) {
      bildirimMesaji += `\n\nTelafi: ${new Date(telafiTarihi).toLocaleDateString('tr-TR')} ${telafiGun || ders.gun} ${telafiBaslangic || ders.baslangicSaati} - ${telafiBitis || ders.bitisSaati}`;
    }

    const bildirimler = ogrenciIds.map(ogrenciId => ({
      userId: ogrenciId,
      tip: 'BILDIRIM' as const,
      baslik: '⚠️ Ders İptali',
      mesaj: bildirimMesaji
    }));

    // Öğretmene de bildirim
    bildirimler.push({
      userId: ders.ogretmen.id,
      tip: 'BILDIRIM' as const,
      baslik: '⚠️ Ders İptali',
      mesaj: bildirimMesaji
    });

    await prisma.notification.createMany({ data: bildirimler });

    res.json({
      success: true,
      message: 'Ders iptali bildirimi gönderildi',
      iptalBilgisi: {
        dersId: ders.id,
        dersAd: ders.ad,
        iptalTarihi,
        sebep,
        telafiTarihi,
        bildirimGonderilenSayisi: bildirimler.length
      }
    });
  } catch (error) {
    console.error('Ders iptali hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== AYLIK TAKVİM GÖRÜNÜMÜ ====================

// Aylık takvim verileri (tüm etkinlikler)
export const getAylikTakvim = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { yil, ay } = req.query;

    const year = parseInt(yil as string) || new Date().getFullYear();
    const month = parseInt(ay as string) || new Date().getMonth() + 1;

    const baslangic = new Date(year, month - 1, 1);
    const bitis = new Date(year, month, 0, 23, 59, 59);

    // Canlı dersler
    let canliDersler: any[] = [];
    // Online sınavlar
    let sinavlar: any[] = [];
    // Ödevler
    let odevler: any[] = [];

    if (userRole === 'ogretmen') {
      [canliDersler, sinavlar, odevler] = await Promise.all([
        prisma.canliDers.findMany({
          where: {
            ogretmenId: userId,
            baslangicTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            baslangicTarihi: true,
            bitisTarihi: true,
            durum: true
          }
        }),
        prisma.onlineSinav.findMany({
          where: {
            ogretmenId: userId,
            baslangicTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            baslangicTarihi: true,
            bitisTarihi: true,
            durum: true
          }
        }),
        prisma.odev.findMany({
          where: {
            ogretmenId: userId,
            sonTeslimTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            sonTeslimTarihi: true
          }
        })
      ]);
    } else if (userRole === 'ogrenci') {
      const kayitlar = await prisma.courseEnrollment.findMany({
        where: { ogrenciId: userId, aktif: true },
        select: { courseId: true }
      });
      const courseIds = kayitlar.map(k => k.courseId);

      [canliDersler, sinavlar, odevler] = await Promise.all([
        prisma.canliDers.findMany({
          where: {
            courseId: { in: courseIds },
            baslangicTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            baslangicTarihi: true,
            bitisTarihi: true,
            durum: true,
            course: { select: { ad: true } }
          }
        }),
        prisma.onlineSinav.findMany({
          where: {
            courseId: { in: courseIds },
            durum: 'AKTIF',
            baslangicTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            baslangicTarihi: true,
            bitisTarihi: true,
            sure: true
          }
        }),
        prisma.odev.findMany({
          where: {
            courseId: { in: courseIds },
            aktif: true,
            sonTeslimTarihi: { gte: baslangic, lte: bitis }
          },
          select: {
            id: true,
            baslik: true,
            sonTeslimTarihi: true,
            course: { select: { ad: true } }
          }
        })
      ]);
    }

    // Etkinlikleri birleştir
    const etkinlikler = [
      ...canliDersler.map(c => ({
        id: c.id,
        baslik: c.baslik,
        tip: 'canli_ders' as const,
        baslangic: c.baslangicTarihi,
        bitis: c.bitisTarihi,
        renk: '#8b5cf6'
      })),
      ...sinavlar.map(s => ({
        id: s.id,
        baslik: s.baslik,
        tip: 'sinav' as const,
        baslangic: s.baslangicTarihi,
        bitis: s.bitisTarihi,
        renk: '#ef4444'
      })),
      ...odevler.map(o => ({
        id: o.id,
        baslik: o.baslik,
        tip: 'odev' as const,
        baslangic: o.sonTeslimTarihi,
        bitis: o.sonTeslimTarihi,
        renk: '#f59e0b'
      }))
    ].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());

    res.json({
      success: true,
      data: {
        yil: year,
        ay: month,
        etkinlikler
      }
    });
  } catch (error) {
    console.error('Aylık takvim hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

