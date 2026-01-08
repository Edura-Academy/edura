import { Request, Response } from 'express';
import { PrismaClient, XPSeviye } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== SEVİYE SİSTEMİ ====================

// XP'ye göre seviye hesaplama
function calculateLevel(xp: number): { seviye: XPSeviye; sonrakiSeviyeXp: number; mevcutSeviyeXp: number } {
  if (xp >= 30000) {
    return { seviye: 'EFSANE', sonrakiSeviyeXp: 50000, mevcutSeviyeXp: 30000 };
  } else if (xp >= 15000) {
    return { seviye: 'UZMAN', sonrakiSeviyeXp: 30000, mevcutSeviyeXp: 15000 };
  } else if (xp >= 5000) {
    return { seviye: 'USTA', sonrakiSeviyeXp: 15000, mevcutSeviyeXp: 5000 };
  } else if (xp >= 1000) {
    return { seviye: 'CIRAK', sonrakiSeviyeXp: 5000, mevcutSeviyeXp: 1000 };
  } else {
    return { seviye: 'BASLANGIC', sonrakiSeviyeXp: 1000, mevcutSeviyeXp: 0 };
  }
}

// Seviye bilgileri
const seviyeBilgileri: Record<XPSeviye, { ad: string; renk: string; icon: string; minXp: number }> = {
  BASLANGIC: { ad: 'Başlangıç', renk: '#9CA3AF', icon: '⚪', minXp: 0 },
  CIRAK: { ad: 'Çırak', renk: '#CD7F32', icon: '🥉', minXp: 1000 },
  USTA: { ad: 'Usta', renk: '#C0C0C0', icon: '🥈', minXp: 5000 },
  UZMAN: { ad: 'Uzman', renk: '#FFD700', icon: '🥇', minXp: 15000 },
  EFSANE: { ad: 'Efsane', renk: '#B9F2FF', icon: '💎', minXp: 30000 }
};

// Kullanıcı seviyesini güncelle
async function updateUserLevel(userId: string, newXp: number) {
  const { seviye } = calculateLevel(newXp);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xpSeviye: true }
  });

  if (user && user.xpSeviye !== seviye) {
    await prisma.user.update({
      where: { id: userId },
      data: { xpSeviye: seviye }
    });

    // Seviye atlama bildirimi
    const seviyeInfo = seviyeBilgileri[seviye];
    await prisma.notification.create({
      data: {
        userId,
        tip: 'BILDIRIM',
        baslik: '🎉 Seviye Atladın!',
        mesaj: `Tebrikler! ${seviyeInfo.icon} ${seviyeInfo.ad} seviyesine ulaştın!`
      }
    });

    return true; // Seviye atladı
  }
  return false;
}

// ==================== STREAK VE XP ==================== 

// Günlük aktiviteyi kaydet ve streak güncelle
export const recordActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { xpKazanilan } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xpPuani: true,
        streak: true,
        sonAktiviteTarihi: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const sonAktivite = user.sonAktiviteTarihi ? new Date(user.sonAktiviteTarihi) : null;
    if (sonAktivite) sonAktivite.setHours(0, 0, 0, 0);

    let yeniStreak = user.streak;

    if (!sonAktivite) {
      // İlk aktivite
      yeniStreak = 1;
    } else {
      const gunFarki = Math.floor((bugun.getTime() - sonAktivite.getTime()) / (1000 * 60 * 60 * 24));
      
      if (gunFarki === 0) {
        // Bugün zaten aktivite yapılmış, streak değişmez
      } else if (gunFarki === 1) {
        // Ardışık gün, streak artar
        yeniStreak = user.streak + 1;
      } else {
        // Gün kaçırılmış, streak sıfırlanır
        yeniStreak = 1;
      }
    }

    // Kullanıcıyı güncelle
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xpPuani: { increment: xpKazanilan || 0 },
        streak: yeniStreak,
        enYuksekStreak: yeniStreak > user.streak ? yeniStreak : undefined,
        sonAktiviteTarihi: new Date()
      },
      select: {
        xpPuani: true,
        streak: true,
        enYuksekStreak: true,
        xpSeviye: true
      }
    });

    // Streak rozetlerini kontrol et
    await checkStreakBadges(userId, yeniStreak);
    await checkXpBadges(userId, updated.xpPuani);
    
    // Seviye güncellemesi kontrol et
    const seviyeAtladi = await updateUserLevel(userId, updated.xpPuani);
    const seviyeInfo = calculateLevel(updated.xpPuani);

    res.json({
      ...updated,
      seviyeAtladi,
      seviyeInfo: {
        ...seviyeBilgileri[seviyeInfo.seviye],
        ilerleme: Math.round(((updated.xpPuani - seviyeInfo.mevcutSeviyeXp) / (seviyeInfo.sonrakiSeviyeXp - seviyeInfo.mevcutSeviyeXp)) * 100)
      }
    });
  } catch (error) {
    console.error('Aktivite kaydetme hatası:', error);
    res.status(500).json({ error: 'Aktivite kaydedilemedi' });
  }
};

// Streak rozet kontrolü
async function checkStreakBadges(userId: string, streak: number) {
  const rozetler: Array<{ streak: number; tip: 'STREAK_7' | 'STREAK_30' | 'STREAK_100' }> = [
    { streak: 7, tip: 'STREAK_7' },
    { streak: 30, tip: 'STREAK_30' },
    { streak: 100, tip: 'STREAK_100' }
  ];

  for (const rozet of rozetler) {
    if (streak >= rozet.streak) {
      // Zaten var mı kontrol et
      const mevcut = await prisma.rozet.findUnique({
        where: { userId_tip: { userId, tip: rozet.tip } }
      });

      if (!mevcut) {
        await prisma.rozet.create({
          data: { userId, tip: rozet.tip }
        });

        await prisma.notification.create({
          data: {
            userId,
            tip: 'BILDIRIM',
            baslik: '🏆 Yeni Rozet Kazandın!',
            mesaj: `Tebrikler! ${rozet.streak} günlük streak rozetini kazandın!`
          }
        });
      }
    }
  }
}

// XP rozet kontrolü
async function checkXpBadges(userId: string, xp: number) {
  const rozetler: Array<{ xp: number; tip: 'XP_1000' | 'XP_5000' | 'XP_10000' }> = [
    { xp: 1000, tip: 'XP_1000' },
    { xp: 5000, tip: 'XP_5000' },
    { xp: 10000, tip: 'XP_10000' }
  ];

  for (const rozet of rozetler) {
    if (xp >= rozet.xp) {
      const mevcut = await prisma.rozet.findUnique({
        where: { userId_tip: { userId, tip: rozet.tip } }
      });

      if (!mevcut) {
        await prisma.rozet.create({
          data: { userId, tip: rozet.tip }
        });

        await prisma.notification.create({
          data: {
            userId,
            tip: 'BILDIRIM',
            baslik: '🏆 Yeni Rozet Kazandın!',
            mesaj: `Tebrikler! ${rozet.xp} XP rozetini kazandın!`
          }
        });
      }
    }
  }
}

// Kullanıcı istatistiklerini getir
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xpPuani: true,
        xpSeviye: true,
        streak: true,
        enYuksekStreak: true,
        sonAktiviteTarihi: true,
        toplamCozulenSoru: true,
        toplamDogruCevap: true,
        toplamTeslimOdev: true,
        toplamKatilinanDers: true,
        rozetler: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Bugünkü görevleri al
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const gunlukGorevler = await prisma.gunlukGorev.findMany({
      where: {
        userId,
        tarih: bugun
      }
    });

    // Streak durumu
    const sonAktivite = user.sonAktiviteTarihi ? new Date(user.sonAktiviteTarihi) : null;
    let streakAktif = false;
    
    if (sonAktivite) {
      sonAktivite.setHours(0, 0, 0, 0);
      const gunFarki = Math.floor((bugun.getTime() - sonAktivite.getTime()) / (1000 * 60 * 60 * 24));
      streakAktif = gunFarki <= 1;
    }

    // Seviye bilgisi hesapla
    const seviyeInfo = calculateLevel(user.xpPuani);
    const seviyeData = seviyeBilgileri[seviyeInfo.seviye];

    res.json({
      xpPuani: user.xpPuani,
      streak: user.streak,
      enYuksekStreak: user.enYuksekStreak,
      streakAktif,
      
      // Seviye bilgileri
      seviye: {
        ad: seviyeData.ad,
        renk: seviyeData.renk,
        icon: seviyeData.icon,
        mevcutXp: user.xpPuani,
        mevcutSeviyeXp: seviyeInfo.mevcutSeviyeXp,
        sonrakiSeviyeXp: seviyeInfo.sonrakiSeviyeXp,
        ilerleme: Math.round(((user.xpPuani - seviyeInfo.mevcutSeviyeXp) / (seviyeInfo.sonrakiSeviyeXp - seviyeInfo.mevcutSeviyeXp)) * 100)
      },
      
      // İstatistikler
      istatistikler: {
        toplamCozulenSoru: user.toplamCozulenSoru,
        toplamDogruCevap: user.toplamDogruCevap,
        toplamTeslimOdev: user.toplamTeslimOdev,
        toplamKatilinanDers: user.toplamKatilinanDers,
        basariOrani: user.toplamCozulenSoru > 0 
          ? Math.round((user.toplamDogruCevap / user.toplamCozulenSoru) * 100) 
          : 0
      },
      
      rozetler: user.rozetler,
      gunlukGorevler,
      tamamlananGorevSayisi: gunlukGorevler.filter(g => g.tamamlandi).length
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
};

// ==================== GÜNLÜK GÖREVLER ====================

// Günlük görevleri oluştur/getir
export const getGunlukGorevler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    // Bugünkü görevleri kontrol et
    let gorevler = await prisma.gunlukGorev.findMany({
      where: {
        userId,
        tarih: bugun
      }
    });

    // Yoksa oluştur
    if (gorevler.length === 0) {
      const yeniGorevler = [
        { tip: 'SORU_COZ' as const, hedef: 10, xpOdulu: 15 },
        { tip: 'GUN_SORUSU' as const, hedef: 1, xpOdulu: 20 },
        { tip: 'MATERYAL_INCELE' as const, hedef: 2, xpOdulu: 10 }
      ];

      await prisma.gunlukGorev.createMany({
        data: yeniGorevler.map(g => ({
          userId,
          tarih: bugun,
          ...g
        }))
      });

      gorevler = await prisma.gunlukGorev.findMany({
        where: { userId, tarih: bugun }
      });
    }

    res.json(gorevler);
  } catch (error) {
    console.error('Günlük görev hatası:', error);
    res.status(500).json({ error: 'Görevler alınamadı' });
  }
};

// Görev ilerlemesini güncelle
export const updateGorevIlerleme = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gorevId, ilerleme } = req.body;

    const gorev = await prisma.gunlukGorev.findFirst({
      where: { id: gorevId, userId }
    });

    if (!gorev) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }

    const yeniIlerleme = Math.min(gorev.hedef, gorev.ilerleme + ilerleme);
    const tamamlandi = yeniIlerleme >= gorev.hedef;

    const updated = await prisma.gunlukGorev.update({
      where: { id: gorevId },
      data: {
        ilerleme: yeniIlerleme,
        tamamlandi
      }
    });

    // Tamamlandıysa XP ver
    if (tamamlandi && !gorev.tamamlandi) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xpPuani: { increment: gorev.xpOdulu }
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    res.status(500).json({ error: 'Görev güncellenemedi' });
  }
};

// ==================== GÜNÜN SORUSU ====================

// Günün sorusunu getir (her öğrenci için farklı soru - havuzdan rastgele)
export const getGununSorusu = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Kullanıcının kurs bilgisini al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sinif: true, kurs: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    // Bugün için bu kullanıcıya atanmış bir günün sorusu var mı kontrol et
    let soru = await prisma.gununSorusu.findFirst({
      where: {
        tarih: bugun,
        cevaplar: {
          some: { userId }
        }
      }
    });

    // Kullanıcı bugün bir soruyu cevaplamış mı kontrol et
    const bugunkuCevap = await prisma.gununSorusuCevap.findFirst({
      where: {
        userId,
        gununSorusu: {
          tarih: bugun
        }
      },
      include: {
        gununSorusu: true
      }
    });

    if (bugunkuCevap) {
      // Bugün zaten cevaplamış, aynı soruyu göster
      const cevaplanmisSoru = bugunkuCevap.gununSorusu;
      const seceneklerArr = JSON.parse(cevaplanmisSoru.secenekler);
      
      // Doğru cevabı harf yerine metin olarak döndür
      const dogruCevapIndex = cevaplanmisSoru.dogruCevap.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      const dogruCevapMetni = seceneklerArr[dogruCevapIndex] || cevaplanmisSoru.dogruCevap;
      
      return res.json({
        ...cevaplanmisSoru,
        secenekler: seceneklerArr,
        dogruCevap: dogruCevapMetni,
        cevaplandi: true,
        kullaniciCevabi: bugunkuCevap.cevap,
        dogruMu: bugunkuCevap.dogruMu
      });
    }

    // Kullanıcının sınıf seviyesine göre soru havuzundan soru seç
    const sinifSeviyesi = user?.sinif?.seviye || 8; // Default 8. sınıf

    // Kullanıcının daha önce cevapladığı soruları al
    const cevapladigiSoruIds = await prisma.gununSorusuCevap.findMany({
      where: { userId },
      select: { gununSorusu: { select: { soruHavuzuId: true } } }
    });
    const cevapladigiHavuzIds = cevapladigiSoruIds
      .map(c => c.gununSorusu?.soruHavuzuId)
      .filter(id => id != null);

    // Soru havuzundan uygun bir soru seç
    const uygunSorular = await prisma.soruHavuzu.findMany({
      where: {
        aktif: true,
        onaylandiMi: true,
        id: { notIn: cevapladigiHavuzIds },
        OR: [
          { sinifSeviyesi: { lte: sinifSeviyesi } },
          { sinifSeviyesi: null }
        ]
      }
    });

    if (uygunSorular.length === 0) {
      // Tüm sorular cevaplanmış, rastgele bir soru seç
      const tumSorular = await prisma.soruHavuzu.findMany({
        where: { aktif: true, onaylandiMi: true }
      });
      
      if (tumSorular.length === 0) {
        return res.status(404).json({ error: 'Soru havuzunda soru bulunamadı' });
      }
      
      // Rastgele bir soru seç
      const rastgeleSoru = tumSorular[Math.floor(Math.random() * tumSorular.length)];
      
      // Bu soru için günün sorusu oluştur
      soru = await prisma.gununSorusu.create({
        data: {
          tarih: bugun,
          sinifSeviyesi: sinifSeviyesi,
          soruHavuzuId: rastgeleSoru.id,
          soruMetni: rastgeleSoru.soruMetni,
          secenekler: rastgeleSoru.secenekler,
          dogruCevap: rastgeleSoru.dogruCevap,
          aciklama: rastgeleSoru.aciklama,
          zorluk: rastgeleSoru.zorluk,
          xpOdulu: getXpByZorluk(rastgeleSoru.zorluk),
          konu: rastgeleSoru.konu
        }
      });
    } else {
      // Rastgele bir soru seç
      const rastgeleSoru = uygunSorular[Math.floor(Math.random() * uygunSorular.length)];
      
      // Bu kullanıcı için benzersiz günün sorusu oluştur
      // Aynı tarih ve sınıf seviyesi için çakışma olmaması için benzersiz bir seviye kullan
      const uniqueSeviye = sinifSeviyesi * 1000 + Math.floor(Math.random() * 999);
      
      try {
        soru = await prisma.gununSorusu.create({
          data: {
            tarih: bugun,
            sinifSeviyesi: uniqueSeviye, // Her öğrenci için benzersiz
            soruHavuzuId: rastgeleSoru.id,
            soruMetni: rastgeleSoru.soruMetni,
            secenekler: rastgeleSoru.secenekler,
            dogruCevap: rastgeleSoru.dogruCevap,
            aciklama: rastgeleSoru.aciklama,
            zorluk: rastgeleSoru.zorluk,
            xpOdulu: getXpByZorluk(rastgeleSoru.zorluk),
            konu: rastgeleSoru.konu
          }
        });
      } catch (e) {
        // Unique constraint hatası durumunda mevcut bir soruyu bul
        soru = await prisma.gununSorusu.findFirst({
          where: {
            tarih: bugun,
            soruHavuzuId: rastgeleSoru.id
          }
        });
        
        if (!soru) {
          // Hala bulunamazsa yeni bir tane oluştur
          const yeniSeviye = sinifSeviyesi * 10000 + Date.now() % 10000;
          soru = await prisma.gununSorusu.create({
            data: {
              tarih: bugun,
              sinifSeviyesi: yeniSeviye,
              soruHavuzuId: rastgeleSoru.id,
              soruMetni: rastgeleSoru.soruMetni,
              secenekler: rastgeleSoru.secenekler,
              dogruCevap: rastgeleSoru.dogruCevap,
              aciklama: rastgeleSoru.aciklama,
              zorluk: rastgeleSoru.zorluk,
              xpOdulu: getXpByZorluk(rastgeleSoru.zorluk),
              konu: rastgeleSoru.konu
            }
          });
        }
      }
    }

    res.json({
      ...soru,
      secenekler: JSON.parse(soru!.secenekler),
      cevaplandi: false,
      kullaniciCevabi: null,
      dogruMu: null
    });
  } catch (error) {
    console.error('Günün sorusu hatası:', error);
    res.status(500).json({ error: 'Soru alınamadı' });
  }
};

// Zorluk seviyesine göre XP hesapla
function getXpByZorluk(zorluk: number): number {
  const xpMap: Record<number, number> = {
    1: 10,  // Çok Kolay
    2: 15,  // Kolay
    3: 20,  // Orta
    4: 30,  // Zor
    5: 50   // Çok Zor
  };
  return xpMap[zorluk] || 15;
}

// Günün sorusunu cevapla
export const answerGununSorusu = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { soruId, cevap, ipucuKullanildi } = req.body;

    // Zaten cevaplanmış mı kontrol et
    const mevcutCevap = await prisma.gununSorusuCevap.findUnique({
      where: {
        gununSorusuId_userId: {
          gununSorusuId: soruId,
          userId
        }
      }
    });

    if (mevcutCevap) {
      return res.status(400).json({ error: 'Bu soruyu zaten cevapladınız' });
    }

    const soru = await prisma.gununSorusu.findUnique({
      where: { id: soruId }
    });

    if (!soru) {
      return res.status(404).json({ error: 'Soru bulunamadı' });
    }

    // Cevap karşılaştırması - Frontend cevap metnini, DB ise harf (A,B,C,D) tutuyor
    // Frontend'den gelen cevap metnini seçenekler içindeki indeksine göre harfe çevir
    const secenekler = JSON.parse(soru.secenekler);
    const cevapIndex = secenekler.indexOf(cevap);
    const cevapHarfi = cevapIndex >= 0 ? String.fromCharCode(65 + cevapIndex) : cevap; // A=65, B=66, C=67, D=68
    
    const dogruMu = cevapHarfi === soru.dogruCevap;
    let kazanilanXp = 0;

    if (dogruMu) {
      kazanilanXp = ipucuKullanildi ? Math.floor(soru.xpOdulu / 2) : soru.xpOdulu;
      
      // XP ekle
      await prisma.user.update({
        where: { id: userId },
        data: {
          xpPuani: { increment: kazanilanXp }
        }
      });

      // Günlük görevi güncelle
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);

      await prisma.gunlukGorev.updateMany({
        where: {
          userId,
          tarih: bugun,
          tip: 'GUN_SORUSU'
        },
        data: {
          ilerleme: 1,
          tamamlandi: true
        }
      });
    }

    const yeniCevap = await prisma.gununSorusuCevap.create({
      data: {
        gununSorusuId: soruId,
        userId,
        cevap,
        dogruMu,
        ipucuKullanildi,
        kazanilanXp
      }
    });

    // Doğru cevabı harf yerine metin olarak döndür (frontend'in göstermesi için)
    const dogruCevapIndex = soru.dogruCevap.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    const dogruCevapMetni = secenekler[dogruCevapIndex] || soru.dogruCevap;
    
    res.json({
      ...yeniCevap,
      dogruCevap: dogruCevapMetni,
      aciklama: soru.aciklama
    });
  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({ error: 'Cevap kaydedilemedi' });
  }
};

// ==================== LEADERBOARD ====================

// Liderlik tablosu
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tip, sinifId } = req.query; // tip: haftalik, aylik, tumzamanlar | sinifId: belirli sınıf

    // Kullanıcının sınıfını al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sinifId: true, kursId: true }
    });

    // Where koşulları
    const whereCondition: any = {
      role: 'ogrenci',
      kursId: user?.kursId,
      aktif: true
    };

    // Sınıf filtresi
    if (sinifId) {
      whereCondition.sinifId = sinifId as string;
    }

    // Tüm öğrencileri XP'ye göre sırala
    const ogrenciler = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        ad: true,
        soyad: true,
        xpPuani: true,
        xpSeviye: true,
        streak: true,
        enYuksekStreak: true,
        sinif: {
          select: { id: true, ad: true }
        }
      },
      orderBy: { xpPuani: 'desc' },
      take: 100
    });

    // Kullanıcının sırasını bul
    const userRank = ogrenciler.findIndex(o => o.id === userId) + 1;

    res.json({
      leaderboard: ogrenciler.map((o, i) => ({
        ...o,
        rank: i + 1,
        isCurrentUser: o.id === userId,
        seviyeInfo: seviyeBilgileri[o.xpSeviye]
      })),
      userRank,
      filteredBy: sinifId ? 'sinif' : 'kurs'
    });
  } catch (error) {
    console.error('Leaderboard hatası:', error);
    res.status(500).json({ error: 'Leaderboard alınamadı' });
  }
};

// ==================== SINIF YARIŞMASI ====================

// Sınıflar arası yarışma (toplam XP'ye göre)
export const getSinifYarismasi = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tip } = req.query; // haftalik, aylik, tumzamanlar

    // Kullanıcının kursunu al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kursId: true, sinifId: true }
    });

    if (!user?.kursId) {
      return res.status(400).json({ error: 'Kurs bilgisi bulunamadı' });
    }

    // Tüm sınıfları al
    const siniflar = await prisma.sinif.findMany({
      where: { kursId: user.kursId, aktif: true },
      select: { id: true, ad: true, seviye: true }
    });

    // Her sınıf için XP toplamı ve öğrenci sayısı hesapla
    const sinifIstatistikleri = await Promise.all(
      siniflar.map(async (sinif) => {
        const ogrenciler = await prisma.user.findMany({
          where: {
            sinifId: sinif.id,
            role: 'ogrenci',
            aktif: true
          },
          select: {
            xpPuani: true,
            streak: true
          }
        });

        const toplamXp = ogrenciler.reduce((sum, o) => sum + o.xpPuani, 0);
        const ortalamaXp = ogrenciler.length > 0 ? Math.round(toplamXp / ogrenciler.length) : 0;
        const toplamStreak = ogrenciler.reduce((sum, o) => sum + o.streak, 0);
        const ortalamaStreak = ogrenciler.length > 0 ? Math.round(toplamStreak / ogrenciler.length) : 0;

        return {
          sinifId: sinif.id,
          sinifAd: sinif.ad,
          seviye: sinif.seviye,
          ogrenciSayisi: ogrenciler.length,
          toplamXp,
          ortalamaXp,
          ortalamaStreak,
          isCurrentClass: sinif.id === user.sinifId
        };
      })
    );

    // Ortalama XP'ye göre sırala
    const siraliSiniflar = sinifIstatistikleri.sort((a, b) => b.ortalamaXp - a.ortalamaXp);

    // Kullanıcının sınıfının sırasını bul
    const userClassRank = siraliSiniflar.findIndex(s => s.sinifId === user.sinifId) + 1;

    res.json({
      yarismaSonuclari: siraliSiniflar.map((s, i) => ({
        ...s,
        rank: i + 1
      })),
      userClassRank,
      toplamSinif: siniflar.length
    });
  } catch (error) {
    console.error('Sınıf yarışması hatası:', error);
    res.status(500).json({ error: 'Sınıf yarışması alınamadı' });
  }
};

// ==================== SEVİYE BİLGİLERİ ====================

// Tüm seviye bilgilerini getir
export const getSeviyeler = async (req: Request, res: Response) => {
  try {
    const seviyeler = Object.entries(seviyeBilgileri).map(([key, value]) => ({
      kod: key,
      ...value
    }));

    res.json({ seviyeler });
  } catch (error) {
    console.error('Seviye bilgileri hatası:', error);
    res.status(500).json({ error: 'Seviye bilgileri alınamadı' });
  }
};

// XP Kazanım logları (son aktiviteler)
export const getXpKazanimLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 20 } = req.query;

    // Son günün sorusu cevapları
    const gunSorusuCevaplari = await prisma.gununSorusuCevap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        kazanilanXp: true,
        dogruMu: true,
        createdAt: true,
        gununSorusu: {
          select: { konu: true }
        }
      }
    });

    // Son tamamlanan görevler
    const tamamlananGorevler = await prisma.gunlukGorev.findMany({
      where: { userId, tamamlandi: true },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        tip: true,
        xpOdulu: true,
        updatedAt: true
      }
    });

    // Son kazanılan rozetler
    const rozetler = await prisma.rozet.findMany({
      where: { userId },
      orderBy: { kazanilanTarih: 'desc' },
      take: 10,
      select: {
        tip: true,
        kazanilanXp: true,
        kazanilanTarih: true
      }
    });

    // Aktiviteleri birleştir ve sırala
    const aktiviteler = [
      ...gunSorusuCevaplari.map(g => ({
        tip: 'gun_sorusu' as const,
        xp: g.kazanilanXp,
        detay: g.gununSorusu?.konu || 'Günün Sorusu',
        basarili: g.dogruMu,
        tarih: g.createdAt
      })),
      ...tamamlananGorevler.map(g => ({
        tip: 'gorev' as const,
        xp: g.xpOdulu,
        detay: g.tip,
        basarili: true,
        tarih: g.updatedAt
      })),
      ...rozetler.map(r => ({
        tip: 'rozet' as const,
        xp: r.kazanilanXp,
        detay: r.tip,
        basarili: true,
        tarih: r.kazanilanTarih
      }))
    ].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
     .slice(0, parseInt(limit as string));

    res.json({ aktiviteler });
  } catch (error) {
    console.error('XP kazanım log hatası:', error);
    res.status(500).json({ error: 'XP kazanım logları alınamadı' });
  }
};

// ==================== ROZETLER ====================

// ==================== KURUM İÇİ SIRALAMA ====================

// Kurum içi detaylı sıralama (XP, rozetler, istatistikler)
export const getKurumIciSiralama = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sinifId, limit = 50 } = req.query;

    // Kullanıcının bilgilerini al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kursId: true, sinifId: true, sinif: { select: { ad: true } } }
    });

    if (!user?.kursId) {
      return res.status(400).json({ error: 'Kurs bilgisi bulunamadı' });
    }

    // Where koşulları
    const whereCondition: any = {
      role: 'ogrenci',
      kursId: user.kursId,
      aktif: true
    };

    // Sınıf filtresi
    if (sinifId) {
      whereCondition.sinifId = sinifId as string;
    }

    // Tüm öğrencileri XP'ye göre sırala
    const ogrenciler = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilFoto: true,
        xpPuani: true,
        xpSeviye: true,
        streak: true,
        enYuksekStreak: true,
        toplamCozulenSoru: true,
        toplamDogruCevap: true,
        toplamTeslimOdev: true,
        toplamKatilinanDers: true,
        seciliRozetId: true,
        sinif: {
          select: { id: true, ad: true }
        },
        rozetler: {
          select: { tip: true, kazanilanTarih: true }
        }
      },
      orderBy: { xpPuani: 'desc' },
      take: parseInt(limit as string)
    });

    // Kullanıcının sırasını bul
    const tumOgrenciler = await prisma.user.findMany({
      where: {
        role: 'ogrenci',
        kursId: user.kursId,
        aktif: true
      },
      select: { id: true, xpPuani: true },
      orderBy: { xpPuani: 'desc' }
    });

    const userRank = tumOgrenciler.findIndex(o => o.id === userId) + 1;
    const totalStudents = tumOgrenciler.length;

    // Sınıfları al (filtre için)
    const siniflar = await prisma.sinif.findMany({
      where: { kursId: user.kursId, aktif: true },
      select: { id: true, ad: true, seviye: true },
      orderBy: { seviye: 'asc' }
    });

    // Rozet bilgileri
    const rozetBilgileri: Record<string, { ad: string; icon: string; renk: string }> = {
      STREAK_7: { ad: '7 Gün Streak', icon: '🔥', renk: '#F97316' },
      STREAK_30: { ad: '30 Gün Streak', icon: '🌟', renk: '#EAB308' },
      STREAK_100: { ad: '100 Gün Streak', icon: '💎', renk: '#06B6D4' },
      STREAK_365: { ad: 'Yıllık Efsane', icon: '👑', renk: '#8B5CF6' },
      ILK_ODEV: { ad: 'İlk Adım', icon: '📝', renk: '#22C55E' },
      ODEV_10: { ad: '10 Ödev', icon: '📚', renk: '#3B82F6' },
      ODEV_50: { ad: 'Ödev Ustası', icon: '📖', renk: '#6366F1' },
      ODEV_100: { ad: 'Ödev Şampiyonu', icon: '🎓', renk: '#EC4899' },
      ILK_SINAV: { ad: 'İlk Sınav', icon: '✍️', renk: '#14B8A6' },
      SINAV_90: { ad: 'Sınav Şampiyonu', icon: '🏆', renk: '#F59E0B' },
      SINAV_100: { ad: 'Mükemmeliyetçi', icon: '💯', renk: '#EF4444' },
      SINAV_10: { ad: '10 Sınav', icon: '📋', renk: '#8B5CF6' },
      ERKEN_KUS: { ad: 'Erken Kuş', icon: '🐤', renk: '#FCD34D' },
      GECE_KUSU: { ad: 'Gece Kuşu', icon: '🦉', renk: '#6B7280' },
      HAFTA_SONU: { ad: 'Hafta Sonu Çalışkanı', icon: '📅', renk: '#10B981' },
      SOSYAL_KELEBEK: { ad: 'Sosyal Kelebek', icon: '🦋', renk: '#EC4899' },
      YARDIMCI: { ad: 'Yardımsever', icon: '🤝', renk: '#06B6D4' },
      CANLI_DERS_10: { ad: '10 Canlı Ders', icon: '📹', renk: '#EF4444' },
      CANLI_DERS_50: { ad: 'Canlı Ders Ustası', icon: '🎥', renk: '#8B5CF6' },
      XP_1000: { ad: 'Bronz XP', icon: '🥉', renk: '#CD7F32' },
      XP_5000: { ad: 'Gümüş XP', icon: '🥈', renk: '#C0C0C0' },
      XP_10000: { ad: 'Altın XP', icon: '🥇', renk: '#FFD700' },
      XP_25000: { ad: 'Platin XP', icon: '💠', renk: '#E5E4E2' },
      XP_50000: { ad: 'XP Kralı', icon: '👑', renk: '#9333EA' },
      GUN_SORUSU_7: { ad: '7 Günün Sorusu', icon: '❓', renk: '#F97316' },
      GUN_SORUSU_30: { ad: '30 Günün Sorusu', icon: '❔', renk: '#EAB308' },
      GUN_SORUSU_DOGRU_10: { ad: '10 Doğru Cevap', icon: '✅', renk: '#22C55E' },
      HIZ_SAMPIYONU: { ad: 'Hız Şampiyonu', icon: '⚡', renk: '#FBBF24' },
      ERKEN_TESLIM: { ad: 'Erken Teslimci', icon: '⏰', renk: '#3B82F6' },
      SISTEM_MIMARI: { ad: 'Sistem Mimarı', icon: '🏛️', renk: '#6366F1' },
      BETA_TESTER: { ad: 'Beta Tester', icon: '🔬', renk: '#10B981' },
      KUSURSUZ_HAFTA: { ad: 'Kusursuz Hafta', icon: '⭐', renk: '#F59E0B' }
    };

    // Leaderboard verisini formatla
    const leaderboard = ogrenciler.map((o, i) => {
      const basariOrani = o.toplamCozulenSoru > 0 
        ? Math.round((o.toplamDogruCevap / o.toplamCozulenSoru) * 100) 
        : 0;

      return {
        rank: i + 1,
        id: o.id,
        ad: o.ad,
        soyad: o.soyad,
        profilFoto: o.profilFoto,
        xpPuani: o.xpPuani,
        xpSeviye: o.xpSeviye,
        seviyeInfo: seviyeBilgileri[o.xpSeviye],
        streak: o.streak,
        enYuksekStreak: o.enYuksekStreak,
        sinif: o.sinif,
        isCurrentUser: o.id === userId,
        istatistikler: {
          toplamCozulenSoru: o.toplamCozulenSoru,
          toplamDogruCevap: o.toplamDogruCevap,
          toplamTeslimOdev: o.toplamTeslimOdev,
          toplamKatilinanDers: o.toplamKatilinanDers,
          basariOrani
        },
        rozetSayisi: o.rozetler.length,
        rozetler: o.rozetler.slice(0, 5).map(r => ({
          tip: r.tip,
          ...rozetBilgileri[r.tip]
        })),
        seciliRozet: o.seciliRozetId ? rozetBilgileri[o.seciliRozetId as keyof typeof rozetBilgileri] : null
      };
    });

    // Kullanıcının kendi bilgilerini bul
    const currentUserData = leaderboard.find(o => o.id === userId);
    
    // Kullanıcı listede yoksa (limit dışında kaldıysa), ayrıca ekle
    let currentUserInfo = currentUserData;
    if (!currentUserData) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          ad: true,
          soyad: true,
          profilFoto: true,
          xpPuani: true,
          xpSeviye: true,
          streak: true,
          enYuksekStreak: true,
          toplamCozulenSoru: true,
          toplamDogruCevap: true,
          toplamTeslimOdev: true,
          toplamKatilinanDers: true,
          sinif: { select: { id: true, ad: true } },
          rozetler: { select: { tip: true } }
        }
      });

      if (currentUser) {
        const basariOrani = currentUser.toplamCozulenSoru > 0 
          ? Math.round((currentUser.toplamDogruCevap / currentUser.toplamCozulenSoru) * 100) 
          : 0;

        currentUserInfo = {
          rank: userRank,
          id: currentUser.id,
          ad: currentUser.ad,
          soyad: currentUser.soyad,
          profilFoto: currentUser.profilFoto,
          xpPuani: currentUser.xpPuani,
          xpSeviye: currentUser.xpSeviye,
          seviyeInfo: seviyeBilgileri[currentUser.xpSeviye],
          streak: currentUser.streak,
          enYuksekStreak: currentUser.enYuksekStreak,
          sinif: currentUser.sinif,
          isCurrentUser: true,
          istatistikler: {
            toplamCozulenSoru: currentUser.toplamCozulenSoru,
            toplamDogruCevap: currentUser.toplamDogruCevap,
            toplamTeslimOdev: currentUser.toplamTeslimOdev,
            toplamKatilinanDers: currentUser.toplamKatilinanDers,
            basariOrani
          },
          rozetSayisi: currentUser.rozetler.length,
          rozetler: currentUser.rozetler.slice(0, 5).map(r => ({
            tip: r.tip,
            ...rozetBilgileri[r.tip]
          })),
          seciliRozet: null
        };
      }
    }

    // İstatistik özeti
    const toplamXP = tumOgrenciler.reduce((sum, o) => sum + o.xpPuani, 0);
    const ortalamaXP = totalStudents > 0 ? Math.round(toplamXP / totalStudents) : 0;

    res.json({
      leaderboard,
      currentUser: currentUserInfo,
      userRank,
      totalStudents,
      siniflar,
      filteredBy: sinifId ? 'sinif' : 'kurs',
      istatistikler: {
        toplamXP,
        ortalamaXP,
        enYuksekXP: tumOgrenciler[0]?.xpPuani || 0
      }
    });
  } catch (error) {
    console.error('Kurum içi sıralama hatası:', error);
    res.status(500).json({ error: 'Sıralama alınamadı' });
  }
};

// Kullanıcının profilini getir (sıralama sayfasından tıklandığında)
export const getOgrenciProfil = async (req: Request, res: Response) => {
  try {
    const { ogrenciId } = req.params;
    const currentUserId = (req as any).user.id;

    // Mevcut kullanıcının kursunu al
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { kursId: true }
    });

    // Hedef öğrenciyi al
    const ogrenci = await prisma.user.findUnique({
      where: { id: ogrenciId },
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilFoto: true,
        xpPuani: true,
        xpSeviye: true,
        streak: true,
        enYuksekStreak: true,
        toplamCozulenSoru: true,
        toplamDogruCevap: true,
        toplamTeslimOdev: true,
        toplamKatilinanDers: true,
        kursId: true,
        sinif: { select: { id: true, ad: true } },
        rozetler: {
          select: { tip: true, kazanilanTarih: true },
          orderBy: { kazanilanTarih: 'desc' }
        }
      }
    });

    if (!ogrenci) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }

    // Aynı kursta mı kontrol et (gizlilik)
    if (ogrenci.kursId !== currentUser?.kursId) {
      return res.status(403).json({ error: 'Bu öğrencinin profilini görüntüleme yetkiniz yok' });
    }

    // Kurum içi sıralamasını hesapla
    const kurumSirasi = await prisma.user.count({
      where: {
        role: 'ogrenci',
        kursId: ogrenci.kursId,
        aktif: true,
        xpPuani: { gt: ogrenci.xpPuani }
      }
    }) + 1;

    // Sınıf sıralamasını hesapla
    const sinifSirasi = ogrenci.sinif ? await prisma.user.count({
      where: {
        role: 'ogrenci',
        sinifId: ogrenci.sinif.id,
        aktif: true,
        xpPuani: { gt: ogrenci.xpPuani }
      }
    }) + 1 : null;

    // Rozet bilgileri
    const rozetBilgileri: Record<string, { ad: string; icon: string; aciklama: string }> = {
      STREAK_7: { ad: '7 Gün Streak', icon: '🔥', aciklama: '7 gün ard arda aktif ol' },
      STREAK_30: { ad: '30 Gün Streak', icon: '🌟', aciklama: '30 gün ard arda aktif ol' },
      STREAK_100: { ad: '100 Gün Streak', icon: '💎', aciklama: '100 gün ard arda aktif ol' },
      XP_1000: { ad: 'Bronz XP', icon: '🥉', aciklama: '1000 XP topla' },
      XP_5000: { ad: 'Gümüş XP', icon: '🥈', aciklama: '5000 XP topla' },
      XP_10000: { ad: 'Altın XP', icon: '🥇', aciklama: '10000 XP topla' }
    };

    const basariOrani = ogrenci.toplamCozulenSoru > 0 
      ? Math.round((ogrenci.toplamDogruCevap / ogrenci.toplamCozulenSoru) * 100) 
      : 0;

    res.json({
      id: ogrenci.id,
      ad: ogrenci.ad,
      soyad: ogrenci.soyad,
      profilFoto: ogrenci.profilFoto,
      xpPuani: ogrenci.xpPuani,
      xpSeviye: ogrenci.xpSeviye,
      seviyeInfo: seviyeBilgileri[ogrenci.xpSeviye],
      streak: ogrenci.streak,
      enYuksekStreak: ogrenci.enYuksekStreak,
      sinif: ogrenci.sinif,
      kurumSirasi,
      sinifSirasi,
      istatistikler: {
        toplamCozulenSoru: ogrenci.toplamCozulenSoru,
        toplamDogruCevap: ogrenci.toplamDogruCevap,
        toplamTeslimOdev: ogrenci.toplamTeslimOdev,
        toplamKatilinanDers: ogrenci.toplamKatilinanDers,
        basariOrani
      },
      rozetler: ogrenci.rozetler.map(r => ({
        tip: r.tip,
        kazanilanTarih: r.kazanilanTarih,
        ...rozetBilgileri[r.tip]
      }))
    });
  } catch (error) {
    console.error('Öğrenci profil hatası:', error);
    res.status(500).json({ error: 'Profil alınamadı' });
  }
};

// Kullanıcının rozetlerini getir
export const getUserRozetler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const rozetler = await prisma.rozet.findMany({
      where: { userId },
      orderBy: { kazanilanTarih: 'desc' }
    });

    // Tüm rozet tiplerini ve açıklamalarını ekle
    const rozetBilgileri: Record<string, { ad: string; aciklama: string; icon: string }> = {
      STREAK_7: { ad: '7 Günlük Streak', aciklama: '7 gün ard arda aktif ol', icon: '🔥' },
      STREAK_30: { ad: '30 Günlük Streak', aciklama: '30 gün ard arda aktif ol', icon: '🌟' },
      STREAK_100: { ad: '100 Günlük Streak', aciklama: '100 gün ard arda aktif ol', icon: '💎' },
      ILK_ODEV: { ad: 'İlk Adım', aciklama: 'İlk ödevini teslim et', icon: '📝' },
      ODEV_USTASI: { ad: 'Ödev Ustası', aciklama: '50 ödev teslim et', icon: '📚' },
      SINAV_SAMPIYONU: { ad: 'Sınav Şampiyonu', aciklama: '10 sınavda %90+ al', icon: '🏆' },
      ERKEN_KUS: { ad: 'Erken Kuş', aciklama: 'Sabah 8\'den önce görev yap', icon: '🐤' },
      GECE_KUSU: { ad: 'Gece Kuşu', aciklama: 'Gece 22\'den sonra görev yap', icon: '🦉' },
      SOSYAL_KELEBEK: { ad: 'Sosyal Kelebek', aciklama: '10 mesaj gönder', icon: '🦋' },
      CANLI_DERS_KATILIMCISI: { ad: 'Canlı Ders Fanatiği', aciklama: '20 canlı derse katıl', icon: '📹' },
      XP_1000: { ad: 'Bronz XP', aciklama: '1000 XP topla', icon: '🥉' },
      XP_5000: { ad: 'Gümüş XP', aciklama: '5000 XP topla', icon: '🥈' },
      XP_10000: { ad: 'Altın XP', aciklama: '10000 XP topla', icon: '🥇' }
    };

    const kazanilanTipler = new Set(rozetler.map(r => r.tip));
    
    const tumRozetler = Object.entries(rozetBilgileri).map(([tip, bilgi]) => ({
      tip,
      ...bilgi,
      kazanildi: kazanilanTipler.has(tip as any),
      kazanilanTarih: rozetler.find(r => r.tip === tip)?.kazanilanTarih
    }));

    res.json({
      kazanilanlar: rozetler.length,
      toplam: Object.keys(rozetBilgileri).length,
      rozetler: tumRozetler
    });
  } catch (error) {
    console.error('Rozet hatası:', error);
    res.status(500).json({ error: 'Rozetler alınamadı' });
  }
};

