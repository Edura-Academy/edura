import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ==================== ROL BAZLI SİSTEM PROMPTLARI ====================

const SYSTEM_PROMPTS: Record<string, string> = {
  ogrenci: `Sen Edu, Edura eğitim platformunun kişisel asistanısın.
Öğrencilere samimi ve motive edici bir şekilde yardımcı oluyorsun.

✅ YAPABİLECEKLERİN:
- Sınav/deneme sonuçlarını detaylı analiz et
- Bekleyen ödevleri ve son tarihleri bildir
- Ders programını ve canlı dersleri söyle
- XP, seviye, streak, rozet bilgisi ver
- Liderlik tablosundaki sıralamayı söyle
- Günün sorusu hakkında bilgi ver
- Motivasyon ve çalışma tavsiyeleri ver
- Duyuruları oku

🚫 YAPMAYACAKLARIN:
- Sınav sorularını okuma/cevaplama
- Ödev yapma
- Kopya çekmeye yardım

ÖNEMLİ: Öğrenciyi motive et, başarılarını kutla, gelişim alanlarını nazikçe belirt.`,

  ogretmen: `Sen Edu, Edura eğitim platformunun öğretmen asistanısın.
Öğretmenlere profesyonel ve verimli şekilde yardımcı oluyorsun.

✅ YAPABİLECEKLERİN:
- Bugünkü ve haftalık ders programını söyle
- Sınıf listelerini ve öğrenci sayılarını ver
- Ödev teslim durumlarını ve değerlendirme bekleyenleri bildir
- Sınav sonuç analizleri sun (ortalama, en yüksek, en düşük)
- Canlı ders bilgilerini ver
- Yoklama durumlarını özetle
- Materyal ve kaynak bilgisi ver
- Duyuruları oku

KURALLAR: Özet ve net bilgiler ver. Verimlilik odaklı ol.`,

  veli: `Sen Edu, Edura eğitim platformunun veli asistanısın.
Velilere çocuklarının eğitim durumu hakkında detaylı ve anlaşılır bilgi veriyorsun.

✅ YAPABİLECEKLERİN:
- Çocuğun sınav sonuçlarını ve performans analizini ver
- Ödev durumlarını ve teslim tarihlerini bildir
- Devamsızlık durumunu ve geçmişini göster
- Ödeme durumunu ve taksitleri söyle
- Ders programını ve canlı dersleri bildir
- XP, rozet ve başarı durumunu anlat
- Öğretmenlerle iletişim bilgisi ver
- Duyuruları oku

KURALLAR: Anlaşılır ve samimi ol. Çocuğun gelişimini pozitif sun.`,

  mudur: `Sen Edu, Edura eğitim platformunun yönetici asistanısın.
Kurs müdürlerine operasyonel ve stratejik bilgiler sunuyorsun.

✅ YAPABİLECEKLERİN:
- Kurs istatistiklerini kapsamlı ver (öğrenci, öğretmen, sınıf, ders sayıları)
- Bugünkü ve haftalık ders programını özetle
- Devamsızlık oranlarını ve uyarıları bildir
- Ödeme durumlarını ve gecikmeleri özetle
- Bekleyen onayları (sınav, izin vb.) listele
- Personel bilgilerini ver
- Son kayıtları ve çıkışları bildir
- Duyuruları ve etkinlikleri oku

KURALLAR: Özet ve aksiyon odaklı bilgiler ver. Kritik konuları vurgula.`,

  sekreter: `Sen Edu, Edura eğitim platformunun sekreter asistanısın.
Sekreterlere idari işlerde hızlı ve pratik yardım sunuyorsun.

✅ YAPABİLECEKLERİN:
- Ödeme bekleyen ve geciken öğrencileri listele
- Bugünkü ders programını göster
- Son kayıtları ve başvuruları bildir
- Devamsızlık kayıtlarını ver
- Yaklaşan son teslim tarihlerini hatırlat
- İletişim bilgilerini bul
- Duyuruları oku

KURALLAR: Hızlı ve pratik bilgiler ver. Liste formatı kullan.`,

  kursSahibi: `Sen Edu, Edura eğitim platformunun kurs sahibi asistanısın.
Kurs sahiplerine üst düzey yönetim ve finansal bilgiler sunuyorsun.

✅ YAPABİLECEKLERİN:
- Kurs genel istatistiklerini ver
- Finansal özeti sun (gelir, bekleyen, tahsilat oranı)
- Müdür ve personel bilgilerini ver
- Büyüme metriklerini göster
- Öğrenci ve kayıt durumlarını özetle
- Karşılaştırmalı analizler sun
- Duyuruları oku

KURALLAR: Stratejik ve özet bilgiler ver. Rakamları net sun.`,

  admin: `Sen Edu, Edura sistem yöneticisi asistanısın.
Sistem yöneticilerine teknik ve operasyonel bilgiler sunuyorsun.

✅ YAPABİLECEKLERİN:
- Sistem durumunu bildir
- Toplam kurs ve kullanıcı sayılarını ver
- Son destek taleplerini göster
- Hata ve uyarıları bildir
- Güncel aktiviteleri özetle

KURALLAR: Teknik ve net ol.`
};

// Kopya anahtar kelimeleri
const KOPYA_KEYWORDS = [
  'soruyu oku', 'cevabı söyle', 'doğru cevap', 'şıkkı işaretle',
  'ödevi yap', 'çözümü göster', 'kopya', 'hile', 'cevap ne',
  'hangi şık', 'doğru şık', 'a şıkkı', 'b şıkkı', 'c şıkkı', 'd şıkkı'
];

function isKopyaGirisimi(message: string, role: string): boolean {
  if (role !== 'ogrenci') return false;
  const lower = message.toLowerCase();
  return KOPYA_KEYWORDS.some(k => lower.includes(k));
}

// ==================== KULLANICI BİLGİLERİ ====================

async function getUserContext(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sinif: true,
        kurs: true,
      cocuklari: { select: { id: true, ad: true, soyad: true, sinif: { select: { ad: true } } } } 
    }
    });
    if (!user) return null;
    return {
    id: user.id,
      ad: user.ad,
      soyad: user.soyad,
    role: user.role,
    sinifId: user.sinifId,
      sinif: user.sinif?.ad,
    kursId: user.kursId,
    kursAd: user.kurs?.ad,
    cocuklar: user.cocuklari,
    brans: user.brans
  };
}

// ==================== ÖĞRENCİ FONKSİYONLARI ====================

async function getOgrenciBilgileri(userId: string, messageLower: string, sinifId?: string | null) {
  let data = '';

  // Genel durum özeti
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet', 'genel'].some(k => messageLower.includes(k))) {
    const [odevSayisi, sonSinav, user] = await Promise.all([
      prisma.odev.count({
        where: {
          aktif: true,
          sonTeslimTarihi: { gte: new Date() },
          OR: sinifId ? [{ course: { sinifId } }, { hedefSiniflar: { contains: sinifId } }] : []
        }
      }),
      prisma.denemeSonucu.findFirst({
        where: { ogrenciId: userId },
        orderBy: { createdAt: 'desc' },
        include: { sinav: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { xpPuani: true, streak: true, xpSeviye: true }
      })
    ]);
    
    data += `\n📋 Günlük Özetin:`;
    data += `\n• Bekleyen ödev: ${odevSayisi}`;
    if (sonSinav) data += `\n• Son deneme: ${sonSinav.sinav.ad} - ${sonSinav.toplamNet?.toFixed(1)} net`;
    if (user) {
      data += `\n• XP: ${user.xpPuani} | 🔥 Streak: ${user.streak} gün`;
    }
  }

  // Ödevler
  if (messageLower.includes('ödev') || messageLower.includes('odev')) {
    if (sinifId) {
      const odevler = await prisma.odev.findMany({
      where: {
          aktif: true,
          sonTeslimTarihi: { gte: new Date() },
          OR: [{ course: { sinifId } }, { hedefSiniflar: { contains: sinifId } }]
        },
        include: { course: true, ogretmen: { select: { ad: true, soyad: true } } },
        take: 5,
        orderBy: { sonTeslimTarihi: 'asc' }
      });
      
      if (odevler.length > 0) {
        const now = new Date();
        data += `\n📚 Bekleyen Ödevler (${odevler.length}):`;
        for (const o of odevler) {
          const gun = Math.ceil((o.sonTeslimTarihi!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const acil = gun <= 2 ? '🔴' : gun <= 5 ? '🟡' : '🟢';
          data += `\n${acil} ${o.baslik} (${o.course?.ad || 'Genel'}) - ${gun} gün kaldı`;
        }
      } else {
        data += '\n✅ Harika! Bekleyen ödevin yok.';
      }
    }
  }

  // Sınav sonuçları
  if (['sınav', 'sinav', 'sonuç', 'sonuc', 'puan', 'net', 'deneme', 'not'].some(k => messageLower.includes(k))) {
    const [denemeler, onlineSinavlar] = await Promise.all([
      prisma.denemeSonucu.findMany({
        where: { ogrenciId: userId },
        include: { sinav: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sinavOturumu.findMany({
        where: { ogrenciId: userId, tamamlandi: true },
        include: { sinav: { select: { baslik: true, dersAdi: true } } },
      take: 5,
        orderBy: { bitisZamani: 'desc' }
      })
    ]);

    if (denemeler.length > 0) {
      data += `\n📊 Son Deneme Sonuçların:`;
      for (const s of denemeler) {
        const emoji = s.toplamNet && s.toplamNet >= 80 ? '🌟' : s.toplamNet && s.toplamNet >= 60 ? '👍' : '💪';
        data += `\n${emoji} ${s.sinav.ad}: ${s.toplamDogru}D ${s.toplamYanlis}Y - ${s.toplamNet?.toFixed(1)} net`;
      }
    }

    if (onlineSinavlar.length > 0) {
      data += `\n📝 Online Sınav Sonuçların:`;
      for (const o of onlineSinavlar) {
        const emoji = (o.yuzde || 0) >= 80 ? '🌟' : (o.yuzde || 0) >= 60 ? '👍' : '💪';
        data += `\n${emoji} ${o.sinav.baslik}: %${o.yuzde} (${o.dogruSayisi}D ${o.yanlisSayisi}Y)`;
      }
    }

    if (denemeler.length === 0 && onlineSinavlar.length === 0) {
      data += '\n📊 Henüz sınav sonucun yok. İlk sınavını sabırsızlıkla bekliyorum!';
    }
  }

  // XP ve Gamification
  if (['xp', 'seviye', 'streak', 'rozet', 'başarı', 'puan', 'level'].some(k => messageLower.includes(k))) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        xpPuani: true, xpSeviye: true, streak: true, enYuksekStreak: true,
        toplamCozulenSoru: true, toplamDogruCevap: true, toplamTeslimOdev: true,
        rozetler: { select: { tip: true } }
      }
    });
    
    if (user) {
      const seviyeAd: Record<string, string> = { 
        BASLANGIC: '🌱 Başlangıç', CIRAK: '📘 Çırak', USTA: '⚔️ Usta', 
        UZMAN: '🎓 Uzman', EFSANE: '👑 Efsane' 
      };
      const basariOrani = user.toplamCozulenSoru > 0 
        ? Math.round((user.toplamDogruCevap / user.toplamCozulenSoru) * 100) : 0;

      data += `\n🎮 Oyunlaştırma Durumun:`;
      data += `\n• XP: ${user.xpPuani} puan`;
      data += `\n• Seviye: ${seviyeAd[user.xpSeviye] || user.xpSeviye}`;
      data += `\n• 🔥 Streak: ${user.streak} gün (En yüksek: ${user.enYuksekStreak})`;
      data += `\n• Çözülen soru: ${user.toplamCozulenSoru} (Başarı: %${basariOrani})`;
      data += `\n• Teslim edilen ödev: ${user.toplamTeslimOdev}`;
      data += `\n• Rozetler: ${user.rozetler?.length || 0} adet`;
      
      if (user.streak >= 7) data += `\n🎉 Harika streak! Devam et!`;
    }
  }

  // Ders programı
  if (['ders', 'program', 'bugün', 'bugun', 'saat'].some(k => messageLower.includes(k))) {
    if (sinifId) {
      const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
      const bugun = gunler[new Date().getDay()];
      const dersler = await prisma.course.findMany({
        where: { sinifId, gun: bugun, aktif: true },
        include: { ogretmen: { select: { ad: true, soyad: true } } },
        orderBy: { baslangicSaati: 'asc' }
      });
      
      if (dersler.length > 0) {
        data += `\n📅 Bugünkü Derslerin (${bugun}):`;
        for (const d of dersler) {
          data += `\n• ${d.baslangicSaati}-${d.bitisSaati}: ${d.ad}`;
          if (d.ogretmen) data += ` (${d.ogretmen.ad} ${d.ogretmen.soyad})`;
        }
      } else {
        data += `\n📅 Bugün (${bugun}) dersin yok. İyi tatiller! 🎉`;
      }
    }
  }

  // Canlı dersler
  if (['canlı', 'canli', 'online ders', 'video'].some(k => messageLower.includes(k))) {
    const canliDersler = await prisma.canliDers.findMany({
      where: {
        course: { sinifId: sinifId || undefined },
        baslangicTarihi: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        bitisTarihi: { gte: new Date() },
        durum: 'PLANLANMIS'
      },
      include: { course: true, ogretmen: { select: { ad: true, soyad: true } } },
      take: 5
    });
    
    if (canliDersler.length > 0) {
      data += `\n🎥 Yaklaşan Canlı Dersler:`;
      for (const d of canliDersler) {
        const saat = d.baslangicTarihi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        data += `\n• ${d.baslik} - ${saat} (${d.ogretmen?.ad} ${d.ogretmen?.soyad})`;
      }
    }
  }

  // Liderlik
  if (['lider', 'sıralama', 'siralama', 'kaçıncı', 'kacinci', 'arkadaş'].some(k => messageLower.includes(k))) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      select: { kursId: true, xpPuani: true } 
    });
    
    if (user?.kursId) {
      const ogrenciler = await prisma.user.findMany({
        where: { kursId: user.kursId, role: 'ogrenci', aktif: true },
        orderBy: { xpPuani: 'desc' },
        select: { id: true, ad: true, xpPuani: true },
        take: 10
      });
      
      const sira = ogrenciler.findIndex(o => o.id === userId) + 1;
      data += `\n🏆 Liderlik Tablosu (Top 10):`;
      
      for (let i = 0; i < Math.min(5, ogrenciler.length); i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const isYou = ogrenciler[i].id === userId ? ' (Sen!)' : '';
        data += `\n${medal} ${ogrenciler[i].ad} - ${ogrenciler[i].xpPuani} XP${isYou}`;
      }
      
      if (sira > 5) {
        data += `\n...\n${sira}. Sen - ${user.xpPuani} XP`;
      }
    }
  }

  // Günün sorusu
  if (['günün', 'gunun', 'soru', 'challenge'].some(k => messageLower.includes(k))) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    
    const gununSorusu = await prisma.gununSorusu.findFirst({
      where: { tarih: { gte: bugun } }
    });
    
    if (gununSorusu) {
      const cevapladi = await prisma.gununSorusuCevap.findFirst({
        where: { gununSorusuId: gununSorusu.id, userId: userId }
      });
      
      if (cevapladi) {
        data += `\n❓ Günün sorusunu zaten çözdün! ${cevapladi.dogruMu ? '✅ Doğru!' : '❌ Yanlış'}`;
      } else {
        data += `\n❓ Günün sorusu hazır! Ana sayfandan çözebilirsin. (+${gununSorusu.xpOdulu} XP)`;
      }
    } else {
      data += `\n❓ Bugün için günün sorusu henüz eklenmemiş.`;
    }
  }

  return data;
}

// ==================== ÖĞRETMEN FONKSİYONLARI ====================

async function getOgretmenBilgileri(userId: string, messageLower: string) {
  let data = '';

  // Genel özet
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet', 'genel'].some(k => messageLower.includes(k))) {
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugun = gunler[new Date().getDay()];
    
    const [dersSayisi, bekleyenOdev, sinifSayisi] = await Promise.all([
      prisma.course.count({ where: { ogretmenId: userId, gun: bugun, aktif: true } }),
      prisma.odevTeslim.count({
        where: { odev: { ogretmenId: userId }, durum: 'TESLIM_EDILDI' }
      }),
      prisma.course.findMany({
        where: { ogretmenId: userId, aktif: true },
        select: { sinifId: true },
        distinct: ['sinifId']
      })
    ]);

    data += `\n📋 Günlük Özetiniz:`;
    data += `\n• Bugünkü ders: ${dersSayisi}`;
    data += `\n• Değerlendirme bekleyen ödev: ${bekleyenOdev}`;
    data += `\n• Toplam sınıf: ${sinifSayisi.length}`;
  }

  // Bugünkü dersler
  if (['ders', 'bugün', 'bugun', 'program', 'saat'].some(k => messageLower.includes(k))) {
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugun = gunler[new Date().getDay()];
    
    const dersler = await prisma.course.findMany({
      where: { ogretmenId: userId, gun: bugun, aktif: true },
      include: { sinif: true },
      orderBy: { baslangicSaati: 'asc' }
    });
    
    if (dersler.length > 0) {
      data += `\n📅 Bugünkü Dersleriniz (${bugun}):`;
      for (const d of dersler) {
        data += `\n• ${d.baslangicSaati}-${d.bitisSaati}: ${d.ad} (${d.sinif?.ad || '-'})`;
      }
    } else {
      data += `\n📅 Bugün (${bugun}) dersiniz yok.`;
    }
  }

  // Haftalık program
  if (['hafta', 'haftalık', 'tüm dersler', 'hepsi'].some(k => messageLower.includes(k))) {
    const dersler = await prisma.course.findMany({
      where: { ogretmenId: userId, aktif: true },
      include: { sinif: true },
      orderBy: [{ gun: 'asc' }, { baslangicSaati: 'asc' }]
    });

    if (dersler.length > 0) {
      const gunlereGore = dersler.reduce((acc, d) => {
        if (!acc[d.gun || '']) acc[d.gun || ''] = [];
        acc[d.gun || ''].push(d);
        return acc;
      }, {} as Record<string, typeof dersler>);

      data += `\n📅 Haftalık Programınız:`;
      for (const [gun, gunDersleri] of Object.entries(gunlereGore)) {
        data += `\n${gun.charAt(0).toUpperCase() + gun.slice(1)}:`;
        for (const d of gunDersleri) {
          data += ` ${d.baslangicSaati} ${d.ad},`;
        }
      }
    }
  }

  // Sınıflar ve öğrenciler
  if (['sınıf', 'sinif', 'öğrenci', 'ogrenci', 'liste', 'kaç'].some(k => messageLower.includes(k))) {
    const dersler = await prisma.course.findMany({
      where: { ogretmenId: userId, aktif: true },
      include: { 
        sinif: { 
          include: { 
            ogrenciler: { where: { role: 'ogrenci', aktif: true }, select: { id: true } } 
          } 
        } 
      },
      distinct: ['sinifId']
    });

    const siniflar = dersler.map(d => d.sinif).filter(Boolean);
    if (siniflar.length > 0) {
      data += `\n👥 Sınıflarınız (${siniflar.length}):`;
      for (const s of siniflar) {
        data += `\n• ${s!.ad}: ${s!.ogrenciler?.length || 0} öğrenci`;
      }
      const toplamOgrenci = siniflar.reduce((acc, s) => acc + (s?.ogrenciler?.length || 0), 0);
      data += `\n📊 Toplam: ${toplamOgrenci} öğrenci`;
    }
  }

  // Ödev durumları
  if (['ödev', 'odev', 'teslim', 'değerlendir', 'bekleyen'].some(k => messageLower.includes(k))) {
    const odevler = await prisma.odev.findMany({
      where: { ogretmenId: userId, aktif: true },
      include: { 
        teslimler: true, 
        course: true 
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    if (odevler.length > 0) {
      const bekleyenToplam = odevler.reduce((acc, o) => 
        acc + o.teslimler.filter(t => t.durum === 'TESLIM_EDILDI').length, 0);
      
      data += `\n📚 Ödev Durumları:`;
      data += `\n⚠️ Değerlendirme bekleyen: ${bekleyenToplam} teslim`;
      
      for (const o of odevler.slice(0, 5)) {
        const teslimEdilen = o.teslimler.filter(t => t.durum !== 'BEKLEMEDE').length;
        const bekleyen = o.teslimler.filter(t => t.durum === 'TESLIM_EDILDI').length;
        const emoji = bekleyen > 0 ? '🔴' : '🟢';
        data += `\n${emoji} ${o.baslik}: ${teslimEdilen} teslim${bekleyen > 0 ? `, ${bekleyen} bekliyor` : ''}`;
      }
    } else {
      data += '\n📚 Henüz ödev oluşturmamışsınız.';
    }
  }

  // Sınav sonuçları analizi
  if (['sınav', 'sinav', 'sonuç', 'analiz', 'ortalama'].some(k => messageLower.includes(k))) {
    const sinavlar = await prisma.onlineSinav.findMany({
      where: { ogretmenId: userId },
      include: {
        oturumlar: { where: { tamamlandi: true } },
        course: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (sinavlar.length > 0) {
      data += `\n📊 Sınav Sonuç Analizleri:`;
      for (const s of sinavlar) {
        if (s.oturumlar.length > 0) {
          const puanlar = s.oturumlar.map(o => o.yuzde || 0);
          const ort = Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length);
          const max = Math.max(...puanlar);
          const min = Math.min(...puanlar);
          data += `\n• ${s.baslik}: ${s.oturumlar.length} katılım`;
          data += `\n  Ort: %${ort} | En yüksek: %${max} | En düşük: %${min}`;
        } else {
          data += `\n• ${s.baslik}: Henüz katılım yok`;
        }
      }
    }
  }

  // Canlı ders
  if (['canlı', 'canli', 'video', 'online'].some(k => messageLower.includes(k))) {
    const canliDersler = await prisma.canliDers.findMany({
      where: {
        ogretmenId: userId,
        bitisTarihi: { gte: new Date() },
        durum: 'PLANLANMIS'
      },
      include: { course: true },
      orderBy: { baslangicTarihi: 'asc' },
      take: 5
    });

    if (canliDersler.length > 0) {
      data += `\n🎥 Yaklaşan Canlı Dersleriniz:`;
      for (const d of canliDersler) {
        const tarih = d.baslangicTarihi.toLocaleDateString('tr-TR');
        const saat = d.baslangicTarihi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        data += `\n• ${d.baslik} - ${tarih} ${saat}`;
      }
    } else {
      data += `\n🎥 Planlanmış canlı ders yok.`;
    }
  }

  return data;
}

// ==================== VELİ FONKSİYONLARI ====================

async function getVeliBilgileri(userId: string, messageLower: string) {
  let data = '';

  const veli = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      cocuklari: { 
        include: { 
          sinif: true,
          denemeSonuclari: { take: 3, orderBy: { createdAt: 'desc' }, include: { sinav: true } },
          sinavOturumlari: { take: 3, where: { tamamlandi: true }, orderBy: { bitisZamani: 'desc' }, include: { sinav: true } }
        } 
      } 
    }
  });

  if (!veli?.cocuklari || veli.cocuklari.length === 0) {
    return '\n❌ Kayıtlı çocuk bulunamadı.';
  }

  const cocuklar = veli.cocuklari;

  // Genel özet
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet', 'genel'].some(k => messageLower.includes(k))) {
    data += `\n👨‍👩‍👧 Çocuklarınız (${cocuklar.length}):`;
    for (const c of cocuklar) {
      const user = await prisma.user.findUnique({
        where: { id: c.id },
        select: { xpPuani: true, streak: true }
      });
      data += `\n• ${c.ad} ${c.soyad} (${c.sinif?.ad || '-'})`;
      if (user) data += ` - ${user.xpPuani} XP, 🔥 ${user.streak} gün streak`;
    }
  }

  // Sınav sonuçları
  if (['sınav', 'sinav', 'sonuç', 'sonuc', 'not', 'puan'].some(k => messageLower.includes(k))) {
    for (const cocuk of cocuklar) {
      if (cocuk.denemeSonuclari.length > 0 || cocuk.sinavOturumlari.length > 0) {
        data += `\n📊 ${cocuk.ad}'in Sınav Sonuçları:`;
        
        for (const s of cocuk.denemeSonuclari) {
          const emoji = s.toplamNet && s.toplamNet >= 80 ? '🌟' : s.toplamNet && s.toplamNet >= 60 ? '👍' : '💪';
          data += `\n${emoji} ${s.sinav.ad}: ${s.toplamNet?.toFixed(1)} net`;
        }
        
        for (const o of cocuk.sinavOturumlari) {
          const emoji = (o.yuzde || 0) >= 80 ? '🌟' : (o.yuzde || 0) >= 60 ? '👍' : '💪';
          data += `\n${emoji} ${o.sinav.baslik}: %${o.yuzde}`;
        }
      }
    }
  }

  // Ödevler
  if (messageLower.includes('ödev') || messageLower.includes('odev')) {
    for (const cocuk of cocuklar) {
      const teslimler = await prisma.odevTeslim.findMany({
        where: { ogrenciId: cocuk.id },
        include: { odev: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      const bekleyen = teslimler.filter(t => t.durum === 'BEKLEMEDE').length;
      const teslimEdilen = teslimler.filter(t => t.durum !== 'BEKLEMEDE').length;
      
      data += `\n📚 ${cocuk.ad}'in Ödev Durumu:`;
      data += `\n• Teslim edilen: ${teslimEdilen}`;
      data += `\n• Bekleyen: ${bekleyen}`;
      
      if (teslimler.length > 0) {
        const sonOdev = teslimler[0];
        data += `\n• Son ödev: ${sonOdev.odev.baslik} (${sonOdev.durum === 'BEKLEMEDE' ? '⏳ Bekliyor' : '✅ Teslim edildi'})`;
      }
    }
  }

  // Devamsızlık
  if (['devamsızlık', 'devamsizlik', 'yoklama', 'gelmedi'].some(k => messageLower.includes(k))) {
    for (const cocuk of cocuklar) {
      const yoklamalar = await prisma.yoklama.findMany({
        where: { ogrenciId: cocuk.id, durum: { not: 'KATILDI' } },
        include: { course: true },
        take: 10,
        orderBy: { tarih: 'desc' }
      });
      
      data += `\n📋 ${cocuk.ad}'in Devamsızlık Durumu:`;
      if (yoklamalar.length > 0) {
        data += `\n• Toplam devamsızlık: ${yoklamalar.length} ders`;
        const sonDevamsizlik = yoklamalar[0];
        data += `\n• Son: ${sonDevamsizlik.tarih.toLocaleDateString('tr-TR')} - ${sonDevamsizlik.course?.ad || 'Ders'}`;
      } else {
        data += `\n✅ Devamsızlık yok. Tebrikler!`;
      }
    }
  }

  // XP ve başarılar
  if (['xp', 'başarı', 'basari', 'rozet', 'puan'].some(k => messageLower.includes(k))) {
    for (const cocuk of cocuklar) {
    const user = await prisma.user.findUnique({
        where: { id: cocuk.id },
        select: { xpPuani: true, xpSeviye: true, streak: true, rozetler: { select: { tip: true } } }
      });
      
      if (user) {
        const seviyeAd: Record<string, string> = { 
          BASLANGIC: '🌱 Başlangıç', CIRAK: '📘 Çırak', USTA: '⚔️ Usta', 
          UZMAN: '🎓 Uzman', EFSANE: '👑 Efsane' 
        };
        
        data += `\n🎮 ${cocuk.ad}'in Başarıları:`;
        data += `\n• XP: ${user.xpPuani} puan`;
        data += `\n• Seviye: ${seviyeAd[user.xpSeviye] || user.xpSeviye}`;
        data += `\n• 🔥 Streak: ${user.streak} gün`;
        data += `\n• Rozetler: ${user.rozetler?.length || 0} adet`;
      }
    }
  }

  // Ders programı
  if (['ders', 'program', 'bugün'].some(k => messageLower.includes(k))) {
    for (const cocuk of cocuklar) {
      if (cocuk.sinifId) {
        const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
        const bugun = gunler[new Date().getDay()];
        
        const dersler = await prisma.course.findMany({
          where: { sinifId: cocuk.sinifId, gun: bugun, aktif: true },
          orderBy: { baslangicSaati: 'asc' }
        });
        
        data += `\n📅 ${cocuk.ad}'in Bugünkü Dersleri:`;
        if (dersler.length > 0) {
          for (const d of dersler) {
            data += `\n• ${d.baslangicSaati}-${d.bitisSaati}: ${d.ad}`;
          }
        } else {
          data += `\n• Bugün ders yok.`;
        }
      }
    }
  }

  // Ödeme
  if (['ödeme', 'odeme', 'borç', 'borc', 'taksit', 'para'].some(k => messageLower.includes(k))) {
    data += '\n💰 Ödeme bilgileri için "Ödemeler" sayfasını ziyaret edin.';
  }

  return data;
}

// ==================== MÜDÜR FONKSİYONLARI ====================

async function getMudurBilgileri(userId: string, messageLower: string, kursId: string) {
  let data = '';

  // Genel istatistikler
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet', 'genel', 'istatistik'].some(k => messageLower.includes(k))) {
    const [ogrenciSayisi, ogretmenSayisi, sinifSayisi, dersSayisi, aktifOdev] = await Promise.all([
      prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } }),
      prisma.user.count({ where: { kursId, role: 'ogretmen', aktif: true } }),
      prisma.sinif.count({ where: { kursId, aktif: true } }),
      prisma.course.count({ where: { sinif: { kursId }, aktif: true } }),
      prisma.odev.count({ where: { course: { sinif: { kursId } }, aktif: true, sonTeslimTarihi: { gte: new Date() } } })
    ]);
    
    data += `\n📊 Kurs İstatistikleri:`;
    data += `\n• 👨‍🎓 Öğrenci: ${ogrenciSayisi}`;
    data += `\n• 👨‍🏫 Öğretmen: ${ogretmenSayisi}`;
    data += `\n• 🏫 Sınıf: ${sinifSayisi}`;
    data += `\n• 📚 Aktif ders: ${dersSayisi}`;
    data += `\n• 📝 Aktif ödev: ${aktifOdev}`;
  }

  // Bugünkü dersler
  if (['ders', 'bugün', 'bugun', 'program'].some(k => messageLower.includes(k))) {
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugun = gunler[new Date().getDay()];

    const dersler = await prisma.course.findMany({
      where: { sinif: { kursId }, gun: bugun, aktif: true },
      include: { sinif: true, ogretmen: { select: { ad: true, soyad: true } } },
      orderBy: { baslangicSaati: 'asc' }
    });
    
    data += `\n📅 Bugünkü Dersler (${dersler.length}):`;
    if (dersler.length > 0) {
      for (const d of dersler.slice(0, 10)) {
        data += `\n• ${d.baslangicSaati}: ${d.ad} (${d.sinif?.ad}) - ${d.ogretmen?.ad || 'Öğretmen'}`;
      }
      if (dersler.length > 10) data += `\n... ve ${dersler.length - 10} ders daha`;
    } else {
      data += `\n• Bugün ders yok.`;
    }
  }

  // Personel
  if (['personel', 'öğretmen', 'ogretmen', 'sekreter', 'çalışan'].some(k => messageLower.includes(k))) {
    const personel = await prisma.user.findMany({
      where: { kursId, role: { in: ['ogretmen', 'sekreter'] }, aktif: true },
      select: { ad: true, soyad: true, role: true, brans: true },
      orderBy: { role: 'asc' }
    });
    
    data += `\n👥 Personel Listesi (${personel.length}):`;
    
    const ogretmenler = personel.filter(p => p.role === 'ogretmen');
    const sekreterler = personel.filter(p => p.role === 'sekreter');
    
    if (ogretmenler.length > 0) {
      data += `\n\n📚 Öğretmenler (${ogretmenler.length}):`;
      for (const o of ogretmenler.slice(0, 8)) {
        data += `\n• ${o.ad} ${o.soyad} (${o.brans || 'Branş belirtilmemiş'})`;
      }
    }
    
    if (sekreterler.length > 0) {
      data += `\n\n📝 Sekreterler (${sekreterler.length}):`;
      for (const s of sekreterler) {
        data += `\n• ${s.ad} ${s.soyad}`;
      }
    }
  }

  // Devamsızlık
  if (['devamsızlık', 'devamsizlik', 'yoklama'].some(k => messageLower.includes(k))) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    
    const devamsizlik = await prisma.yoklama.count({
      where: {
        course: { sinif: { kursId } },
        durum: { not: 'KATILDI' },
        tarih: { gte: bugun }
      }
    });
    
    const toplamOgrenci = await prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } });
    const oran = toplamOgrenci > 0 ? Math.round((devamsizlik / toplamOgrenci) * 100) : 0;
    
    data += `\n📋 Bugünkü Devamsızlık:`;
    data += `\n• ${devamsizlik} öğrenci gelmedi`;
    data += `\n• Devamsızlık oranı: %${oran}`;
  }

  // Bekleyen onaylar
  if (['onay', 'bekleyen', 'pending'].some(k => messageLower.includes(k))) {
    const bekleyenSinavlar = await prisma.onlineSinav.count({
      where: { course: { sinif: { kursId } }, durum: 'TASLAK' }
    });
    
    data += `\n⏳ Bekleyen Onaylar:`;
    data += `\n• Sınav onayı: ${bekleyenSinavlar}`;
  }

  // Duyurular
  if (['duyuru', 'haber', 'bildirim'].some(k => messageLower.includes(k))) {
    const duyurular = await prisma.duyuru.findMany({
      where: { kursId, aktif: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (duyurular.length > 0) {
      data += `\n📢 Son Duyurular:`;
      for (const d of duyurular) {
        data += `\n• ${d.baslik} (${d.createdAt.toLocaleDateString('tr-TR')})`;
      }
    }
  }

  return data;
}

// ==================== SEKRETER FONKSİYONLARI ====================

async function getSekreterBilgileri(userId: string, messageLower: string, kursId: string) {
  let data = '';

  // Genel özet
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet'].some(k => messageLower.includes(k))) {
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugun = gunler[new Date().getDay()];
    
    const [ogrenciSayisi, bugunkuDers] = await Promise.all([
      prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } }),
      prisma.course.count({ where: { sinif: { kursId }, gun: bugun, aktif: true } })
    ]);
    
    data += `\n📋 Günlük Özet:`;
    data += `\n• Toplam öğrenci: ${ogrenciSayisi}`;
    data += `\n• Bugünkü ders: ${bugunkuDers}`;
  }

  // Bugünkü dersler
  if (['ders', 'bugün', 'bugun', 'program'].some(k => messageLower.includes(k))) {
    const gunler = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'];
    const bugun = gunler[new Date().getDay()];
    
    const dersler = await prisma.course.findMany({
      where: { sinif: { kursId }, gun: bugun, aktif: true },
      include: { sinif: true, ogretmen: { select: { ad: true, soyad: true } } },
      orderBy: { baslangicSaati: 'asc' }
    });
    
    if (dersler.length > 0) {
      data += `\n📅 Bugünkü Dersler:`;
      for (const d of dersler.slice(0, 10)) {
        data += `\n• ${d.baslangicSaati}: ${d.sinif?.ad} - ${d.ad}`;
      }
    } else {
      data += `\n📅 Bugün ders yok.`;
    }
  }

  // Son kayıtlar
  if (['kayıt', 'kayit', 'yeni', 'öğrenci'].some(k => messageLower.includes(k))) {
    const sonKayitlar = await prisma.user.findMany({
      where: { kursId, role: 'ogrenci' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { ad: true, soyad: true, createdAt: true, sinif: { select: { ad: true } } }
    });
    
    if (sonKayitlar.length > 0) {
      data += `\n📝 Son Kayıtlar:`;
      for (const k of sonKayitlar) {
        data += `\n• ${k.ad} ${k.soyad} (${k.sinif?.ad || '-'}) - ${k.createdAt.toLocaleDateString('tr-TR')}`;
      }
    }
  }

  // Ödeme durumları
  if (['ödeme', 'odeme', 'borç', 'borc', 'bekleyen'].some(k => messageLower.includes(k))) {
    const toplamOgrenci = await prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } });
    data += `\n💰 Toplam ${toplamOgrenci} öğrenci kayıtlı.`;
    data += `\nDetaylı ödeme bilgisi için "Ödemeler" sayfasını kontrol edin.`;
  }

  // Duyurular
  if (['duyuru', 'haber'].some(k => messageLower.includes(k))) {
    const duyurular = await prisma.duyuru.findMany({
      where: { kursId, aktif: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (duyurular.length > 0) {
      data += `\n📢 Son Duyurular:`;
      for (const d of duyurular) {
        data += `\n• ${d.baslik}`;
      }
    }
  }

  return data;
}

// ==================== KURS SAHİBİ FONKSİYONLARI ====================

async function getKursSahibiBilgileri(userId: string, messageLower: string, kursId: string) {
  let data = '';

  // Genel durum
  if (['merhaba', 'selam', 'nasıl', 'durum', 'özet', 'genel', 'rapor'].some(k => messageLower.includes(k))) {
    const [kurs, ogrenciSayisi, ogretmenSayisi, sinifSayisi, mudurSayisi] = await Promise.all([
      prisma.kurs.findUnique({ where: { id: kursId } }),
      prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } }),
      prisma.user.count({ where: { kursId, role: 'ogretmen', aktif: true } }),
      prisma.sinif.count({ where: { kursId, aktif: true } }),
      prisma.user.count({ where: { kursId, role: 'mudur', aktif: true } })
    ]);
    
    data += `\n🏢 ${kurs?.ad || 'Kurs'} Genel Durumu:`;
    data += `\n• 👨‍🎓 Öğrenci: ${ogrenciSayisi}`;
    data += `\n• 👨‍🏫 Öğretmen: ${ogretmenSayisi}`;
    data += `\n• 👔 Müdür: ${mudurSayisi}`;
    data += `\n• 🏫 Sınıf: ${sinifSayisi}`;
  }

  // Finansal (basit özet)
  if (['finans', 'gelir', 'ödeme', 'para', 'mali'].some(k => messageLower.includes(k))) {
    const toplamOgrenci = await prisma.user.count({ where: { kursId, role: 'ogrenci', aktif: true } });
    data += `\n💰 Finansal Özet:`;
    data += `\n• Aktif öğrenci: ${toplamOgrenci}`;
    data += `\nDetaylı finansal raporlar için "Raporlar" sayfasını ziyaret edin.`;
  }

  // Müdürler
  if (['müdür', 'mudur', 'yönetici', 'yonetici'].some(k => messageLower.includes(k))) {
    const mudurler = await prisma.user.findMany({
      where: { kursId, role: 'mudur', aktif: true },
      select: { ad: true, soyad: true, email: true, telefon: true }
    });
    
    if (mudurler.length > 0) {
      data += `\n👔 Müdürler (${mudurler.length}):`;
      for (const m of mudurler) {
        data += `\n• ${m.ad} ${m.soyad}`;
        if (m.telefon) data += ` - ${m.telefon}`;
      }
    } else {
      data += `\n👔 Henüz müdür atanmamış.`;
    }
  }

  // Personel özeti
  if (['personel', 'çalışan', 'calisan'].some(k => messageLower.includes(k))) {
    const [ogretmenSayisi, sekreterSayisi] = await Promise.all([
      prisma.user.count({ where: { kursId, role: 'ogretmen', aktif: true } }),
      prisma.user.count({ where: { kursId, role: 'sekreter', aktif: true } })
    ]);
    
    data += `\n👥 Personel Özeti:`;
    data += `\n• Öğretmen: ${ogretmenSayisi}`;
    data += `\n• Sekreter: ${sekreterSayisi}`;
  }

  return data;
}

// ==================== DUYURULAR (TÜM ROLLER) ====================

async function getDuyurular(kursId?: string) {
  const duyurular = await prisma.duyuru.findMany({
    where: { aktif: true, ...(kursId && { kursId }) },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  
  if (duyurular.length > 0) {
    let data = `\n📢 Son Duyurular:`;
    for (const d of duyurular) {
      data += `\n• ${d.baslik} (${d.createdAt.toLocaleDateString('tr-TR')})`;
    }
    return data;
  }
  return '';
}

// ==================== ANA MESAJ İŞLEYİCİ ====================

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = (req as any).user?.id;

    if (!message) return res.status(400).json({ success: false, error: 'Mesaj gerekli' });
    if (!userId) return res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });

    const userContext = await getUserContext(userId);
    if (!userContext) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });

    const role = userContext.role;
    const messageLower = message.toLowerCase();

    // Kopya kontrolü (sadece öğrenci)
    if (isKopyaGirisimi(message, role)) {
      return res.json({
        success: true,
        response: '🚫 Sınav sorularını okumak veya cevaplamak benim görevim değil. Sınavını kendin çözmelisin!\n\nAma sana başka konularda yardımcı olabilirim:\n• "Sınav sonuçlarım nasıl?"\n• "Bekleyen ödevlerim var mı?"\n• "XP puanım kaç?"\n• "Bugün hangi derslerim var?"'
      });
    }

    // Rol bazlı veri toplama
    let dataContext = '';

    const roleStr = String(role);
    switch (roleStr) {
      case 'ogrenci':
        dataContext = await getOgrenciBilgileri(userId, messageLower, userContext.sinifId);
        break;
      case 'ogretmen':
        dataContext = await getOgretmenBilgileri(userId, messageLower);
        break;
      case 'veli':
        dataContext = await getVeliBilgileri(userId, messageLower);
        break;
      case 'mudur':
        if (userContext.kursId) dataContext = await getMudurBilgileri(userId, messageLower, userContext.kursId);
        break;
      case 'sekreter':
        if (userContext.kursId) dataContext = await getSekreterBilgileri(userId, messageLower, userContext.kursId);
        break;
      case 'kursSahibi':
        if (userContext.kursId) dataContext = await getKursSahibiBilgileri(userId, messageLower, userContext.kursId);
          break;
    }

    // Duyurular (tüm roller için)
    if (['duyuru', 'haber', 'bildirim', 'announcement'].some(k => messageLower.includes(k))) {
      dataContext += await getDuyurular(userContext.kursId || undefined);
    }

    // Gemini API kontrolü
    if (!process.env.GEMINI_API_KEY) {
      if (dataContext) {
        return res.json({ success: true, response: `Merhaba ${userContext.ad}! 👋${dataContext}` });
      }
      return res.json({ success: true, response: `Merhaba ${userContext.ad}! Nasıl yardımcı olabilirim?` });
    }

    // Gemini ile yanıt oluştur
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.ogrenci;

    const prompt = `${systemPrompt}

KULLANICI: ${userContext.ad} ${userContext.soyad} (${role})
${userContext.kursAd ? `Kurum: ${userContext.kursAd}` : ''}
${userContext.sinif ? `Sınıf: ${userContext.sinif}` : ''}
${userContext.brans ? `Branş: ${userContext.brans}` : ''}

VERİTABANI BİLGİLERİ:${dataContext || '\nSorguya uygun spesifik veri bulunamadı.'}

KULLANICI SORUSU: ${message}

ÖNEMLİ: Veritabanı bilgilerini kullan, kısa ve samimi yanıt ver. Emoji kullan ama abartma.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return res.json({ success: true, response: response || 'Yanıt oluşturulamadı.' });

  } catch (error: any) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      error: 'Bir hata oluştu',
      response: 'Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.' 
    });
  }
};

export const healthCheck = async (_req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', geminiConfigured: !!process.env.GEMINI_API_KEY });
};
