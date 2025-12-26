import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        sonAktiviteTarihi: new Date()
      },
      select: {
        xpPuani: true,
        streak: true
      }
    });

    // Streak rozetlerini kontrol et
    await checkStreakBadges(userId, yeniStreak);
    await checkXpBadges(userId, updated.xpPuani);

    res.json(updated);
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
        streak: true,
        sonAktiviteTarihi: true,
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

    res.json({
      xpPuani: user.xpPuani,
      streak: user.streak,
      streakAktif,
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

// Günün sorusunu getir
export const getGununSorusu = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    let soru = await prisma.gununSorusu.findUnique({
      where: { tarih: bugun }
    });

    // Yoksa örnek soru oluştur (gerçek uygulamada admin panelinden eklenir)
    if (!soru) {
      soru = await prisma.gununSorusu.create({
        data: {
          tarih: bugun,
          soruMetni: 'Bir üçgenin iç açılarının toplamı kaç derecedir?',
          secenekler: JSON.stringify(['90°', '180°', '270°', '360°']),
          dogruCevap: '180°',
          aciklama: 'Bir üçgenin iç açılarının toplamı her zaman 180 derecedir.',
          zorluk: 1,
          xpOdulu: 15,
          konu: 'Matematik'
        }
      });
    }

    // Kullanıcının cevabını kontrol et
    const cevap = await prisma.gununSorusuCevap.findUnique({
      where: {
        gununSorusuId_userId: {
          gununSorusuId: soru.id,
          userId
        }
      }
    });

    res.json({
      ...soru,
      secenekler: JSON.parse(soru.secenekler),
      cevaplandi: !!cevap,
      kullaniciCevabi: cevap?.cevap,
      dogruMu: cevap?.dogruMu
    });
  } catch (error) {
    console.error('Günün sorusu hatası:', error);
    res.status(500).json({ error: 'Soru alınamadı' });
  }
};

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

    const dogruMu = cevap === soru.dogruCevap;
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

    res.json({
      ...yeniCevap,
      dogruCevap: soru.dogruCevap,
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
    const { tip } = req.query; // haftalik, aylik, tumzamanlar

    // Kullanıcının sınıfını al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sinifId: true, kursId: true }
    });

    // Tüm öğrencileri XP'ye göre sırala
    const ogrenciler = await prisma.user.findMany({
      where: {
        role: 'ogrenci',
        kursId: user?.kursId
      },
      select: {
        id: true,
        ad: true,
        soyad: true,
        xpPuani: true,
        streak: true,
        sinif: {
          select: { ad: true }
        }
      },
      orderBy: { xpPuani: 'desc' },
      take: 50
    });

    // Kullanıcının sırasını bul
    const userRank = ogrenciler.findIndex(o => o.id === userId) + 1;

    res.json({
      leaderboard: ogrenciler.map((o, i) => ({
        ...o,
        rank: i + 1,
        isCurrentUser: o.id === userId
      })),
      userRank
    });
  } catch (error) {
    console.error('Leaderboard hatası:', error);
    res.status(500).json({ error: 'Leaderboard alınamadı' });
  }
};

// ==================== ROZETLER ====================

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

