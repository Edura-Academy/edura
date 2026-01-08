import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { iyzicoService } from '../services/iyzico.service';
import { pushService } from '../services/push.service';
import { emailService } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

// ==================== ÖDEME PLANI YÖNETİMİ ====================

// Ödeme planı oluştur (Personel)
export const createOdemePlani = async (req: AuthRequest, res: Response) => {
  try {
    const olusturanId = req.user?.id;
    const { ogrenciId, donemAd, toplamTutar, taksitSayisi, indirimOrani, aciklama, vadeTarihleri } = req.body;

    // Öğrenciyi kontrol et
    const ogrenci = await prisma.user.findFirst({
      where: { id: ogrenciId, role: 'ogrenci' }
    });

    if (!ogrenci) {
      return res.status(404).json({ success: false, message: 'Öğrenci bulunamadı' });
    }

    // İndirim hesapla
    const indirimTutari = toplamTutar * (indirimOrani || 0) / 100;
    const netTutar = toplamTutar - indirimTutari;
    const taksitTutari = Math.ceil(netTutar / taksitSayisi);

    // Ödeme planı oluştur
    const odemePlani = await prisma.odemePlani.create({
      data: {
        ogrenciId,
        olusturanId: olusturanId!,
        donemAd,
        toplamTutar,
        taksitSayisi,
        taksitTutari,
        indirimOrani: indirimOrani || 0,
        indirimTutari,
        aciklama
      }
    });

    // Taksitleri oluştur
    const odemeler: any[] = [];
    for (let i = 0; i < taksitSayisi; i++) {
      const vadeTarihi = vadeTarihleri?.[i] 
        ? new Date(vadeTarihleri[i])
        : new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000); // Her ay bir taksit

      odemeler.push({
        odemePlaniId: odemePlani.id,
        ogrenciId,
        tip: 'TAKSIT' as const,
        tutar: taksitTutari,
        taksitNo: i + 1,
        vadeTarihi,
        durum: 'BEKLEMEDE' as const
      });
    }

    await prisma.odeme.createMany({ data: odemeler });

    // Öğrenciye ve velisine bildirim gönder
    const bildirimMesaj = `${donemAd} için ödeme planınız oluşturuldu. Toplam: ${netTutar.toLocaleString('tr-TR')} TL (${taksitSayisi} taksit)`;
    
    await pushService.sendToUser(ogrenciId, {
      title: 'Ödeme Planı Oluşturuldu',
      body: bildirimMesaj
    });

    // Veli varsa ona da bildir
    if (ogrenci.veliId) {
      await pushService.sendToUser(ogrenci.veliId, {
        title: 'Ödeme Planı Oluşturuldu',
        body: `${ogrenci.ad} ${ogrenci.soyad} için ${bildirimMesaj}`
      });
    }

    res.json({
      success: true,
      message: 'Ödeme planı oluşturuldu',
      data: odemePlani
    });
  } catch (error) {
    console.error('Ödeme planı oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ödeme planlarını listele (Personel)
export const getOdemePlanlari = async (req: AuthRequest, res: Response) => {
  try {
    const { ogrenciId, aktif } = req.query;

    const where: any = {};
    if (ogrenciId) where.ogrenciId = ogrenciId;
    if (aktif !== undefined) where.aktif = aktif === 'true';

    const planlar = await prisma.odemePlani.findMany({
      where,
      include: {
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            ogrenciNo: true,
            sinif: { select: { ad: true } }
          }
        },
        odemeler: {
          orderBy: { taksitNo: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // İstatistikleri hesapla
    const planlarWithStats = planlar.map(plan => {
      const odenenTutar = plan.odemeler
        .filter(o => o.durum === 'ODENDI')
        .reduce((sum, o) => sum + o.tutar, 0);
      
      const kalanTutar = plan.odemeler
        .filter(o => o.durum === 'BEKLEMEDE' || o.durum === 'GECIKTI')
        .reduce((sum, o) => sum + o.tutar, 0);

      const gecikmisTaksitler = plan.odemeler.filter(
        o => o.durum === 'BEKLEMEDE' && new Date(o.vadeTarihi) < new Date()
      ).length;

      return {
        ...plan,
        istatistik: {
          odenenTutar,
          kalanTutar,
          gecikmisTaksitler,
          tamamlanmaOrani: Math.round((odenenTutar / (plan.toplamTutar - (plan.indirimTutari || 0))) * 100)
        }
      };
    });

    res.json({ success: true, data: planlarWithStats });
  } catch (error) {
    console.error('Ödeme planları listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öğrencinin ödeme durumu (Öğrenci/Veli)
export const getOgrenciOdemeDurumu = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    let ogrenciId = req.params.ogrenciId || userId;

    // Veli ise çocuğunun ödemelerini görebilir
    if (role === 'veli' && req.params.ogrenciId) {
      const cocuk = await prisma.user.findFirst({
        where: { id: req.params.ogrenciId, veliId: userId }
      });
      if (!cocuk) {
        return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
      }
      ogrenciId = req.params.ogrenciId;
    }

    // Ödeme planları
    const planlar = await prisma.odemePlani.findMany({
      where: { ogrenciId, aktif: true },
      include: {
        odemeler: {
          orderBy: { vadeTarihi: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Genel özet
    const tumOdemeler = planlar.flatMap(p => p.odemeler);
    const ozet = {
      toplamBorc: tumOdemeler.reduce((sum, o) => sum + o.tutar, 0),
      odenenTutar: tumOdemeler.filter(o => o.durum === 'ODENDI').reduce((sum, o) => sum + o.tutar, 0),
      bekleyenTutar: tumOdemeler.filter(o => o.durum === 'BEKLEMEDE').reduce((sum, o) => sum + o.tutar, 0),
      gecikmisTutar: tumOdemeler.filter(o => o.durum === 'GECIKTI').reduce((sum, o) => sum + o.tutar, 0),
      siradakiOdeme: tumOdemeler.find(o => o.durum === 'BEKLEMEDE' || o.durum === 'GECIKTI')
    };

    res.json({ success: true, data: { planlar, ozet } });
  } catch (error) {
    console.error('Ödeme durumu getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖDEME İŞLEMLERİ ====================

// Kredi kartı ile ödeme (iyzico)
export const processCardPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { odemeId, cardInfo, use3ds } = req.body;

    // Ödemeyi kontrol et
    const odeme = await prisma.odeme.findUnique({
      where: { id: odemeId },
      include: {
        ogrenci: true,
        odemePlani: true
      }
    });

    if (!odeme) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }

    if (odeme.durum !== 'BEKLEMEDE' && odeme.durum !== 'GECIKTI') {
      return res.status(400).json({ success: false, message: 'Bu ödeme zaten işlenmiş' });
    }

    // Yetki kontrolü (öğrenci kendi ödemesini veya veli çocuğunun ödemesini yapabilir)
    if (odeme.ogrenciId !== userId) {
      const veli = await prisma.user.findFirst({
        where: { id: userId, cocuklari: { some: { id: odeme.ogrenciId } } }
      });
      if (!veli) {
        return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
      }
    }

    const conversationId = uuidv4();
    const ip = req.ip || '127.0.0.1';

    // iyzico ödeme isteği oluştur
    const paymentRequest = {
      conversationId,
      price: odeme.tutar.toString(),
      paidPrice: odeme.tutar.toString(),
      basketId: odeme.id,
      paymentCard: {
        cardHolderName: cardInfo.cardHolderName,
        cardNumber: cardInfo.cardNumber.replace(/\s/g, ''),
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc
      },
      buyer: {
        id: odeme.ogrenci.id,
        name: odeme.ogrenci.ad,
        surname: odeme.ogrenci.soyad,
        email: odeme.ogrenci.email,
        identityNumber: '11111111111', // TC Kimlik (zorunlu alan)
        registrationAddress: 'Türkiye',
        ip,
        city: 'Istanbul',
        country: 'Turkey'
      },
      shippingAddress: {
        contactName: `${odeme.ogrenci.ad} ${odeme.ogrenci.soyad}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye'
      },
      billingAddress: {
        contactName: `${odeme.ogrenci.ad} ${odeme.ogrenci.soyad}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye'
      },
      basketItems: [
        {
          id: odeme.id,
          name: odeme.odemePlani?.donemAd || 'Kurs Ücreti',
          category1: 'Eğitim',
          itemType: 'VIRTUAL' as const,
          price: odeme.tutar.toString()
        }
      ]
    };

    let result;
    
    if (use3ds) {
      // 3D Secure ödeme
      const callbackUrl = `${process.env.FRONTEND_URL}/odeme/callback`;
      result = await iyzicoService.initThreedsPayment({
        ...paymentRequest,
        callbackUrl
      });

      if (result.status === 'success') {
        // 3DS için HTML döndür
        return res.json({
          success: true,
          use3ds: true,
          threeDSHtml: result.threeDSHtmlContent,
          conversationId
        });
      }
    } else {
      // Normal ödeme
      result = await iyzicoService.createPayment(paymentRequest);
    }

    if (result.status === 'success') {
      // Ödemeyi güncelle
      await prisma.odeme.update({
        where: { id: odemeId },
        data: {
          durum: 'ODENDI',
          odemeYontemi: 'KREDI_KARTI',
          odemeTarihi: new Date(),
          iyzicoPaymentId: result.paymentId,
          iyzicoConversationId: conversationId
        }
      });

      // Bildirim gönder
      await pushService.sendToUser(odeme.ogrenciId, {
        title: 'Ödeme Başarılı',
        body: `${odeme.tutar.toLocaleString('tr-TR')} TL tutarındaki ödemeniz alındı.`
      });

      res.json({
        success: true,
        message: 'Ödeme başarılı',
        data: {
          paymentId: result.paymentId,
          tutar: odeme.tutar
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.errorMessage || 'Ödeme başarısız',
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    console.error('Kart ödeme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// 3DS Callback
export const threeDSCallback = async (req: Request, res: Response) => {
  try {
    const { paymentId, conversationId, mdStatus } = req.body;

    if (mdStatus !== '1') {
      return res.redirect(`${process.env.FRONTEND_URL}/odeme/basarisiz?reason=3ds`);
    }

    const result = await iyzicoService.completeThreedsPayment(paymentId, conversationId);

    if (result.status === 'success') {
      // Ödemeyi bul ve güncelle
      const odeme = await prisma.odeme.findFirst({
        where: { iyzicoConversationId: conversationId }
      });

      if (odeme) {
        await prisma.odeme.update({
          where: { id: odeme.id },
          data: {
            durum: 'ODENDI',
            odemeTarihi: new Date(),
            iyzicoPaymentId: result.paymentId
          }
        });

        await pushService.sendToUser(odeme.ogrenciId, {
          title: 'Ödeme Başarılı',
          body: `${odeme.tutar.toLocaleString('tr-TR')} TL tutarındaki ödemeniz alındı.`
        });
      }

      res.redirect(`${process.env.FRONTEND_URL}/odeme/basarili?paymentId=${result.paymentId}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/odeme/basarisiz?reason=${result.errorCode}`);
    }
  } catch (error) {
    console.error('3DS callback hatası:', error);
    res.redirect(`${process.env.FRONTEND_URL}/odeme/basarisiz?reason=error`);
  }
};

// Manuel ödeme kaydet (Personel - Nakit/Havale)
export const recordManualPayment = async (req: AuthRequest, res: Response) => {
  try {
    const onaylayanId = req.user?.id;
    const { odemeId, odemeYontemi, aciklama } = req.body;

    const odeme = await prisma.odeme.findUnique({
      where: { id: odemeId },
      include: { ogrenci: true }
    });

    if (!odeme) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }

    if (odeme.durum !== 'BEKLEMEDE' && odeme.durum !== 'GECIKTI') {
      return res.status(400).json({ success: false, message: 'Bu ödeme zaten işlenmiş' });
    }

    await prisma.odeme.update({
      where: { id: odemeId },
      data: {
        durum: 'ODENDI',
        odemeYontemi,
        odemeTarihi: new Date(),
        onaylayanId,
        aciklama
      }
    });

    // Bildirim gönder
    await pushService.sendToUser(odeme.ogrenciId, {
      title: 'Ödeme Onaylandı',
      body: `${odeme.tutar.toLocaleString('tr-TR')} TL tutarındaki ödemeniz onaylandı.`
    });

    res.json({ success: true, message: 'Ödeme kaydedildi' });
  } catch (error) {
    console.error('Manuel ödeme kayıt hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ödeme iade/iptal (Personel)
export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { odemeId, sebep } = req.body;
    const ip = req.ip || '127.0.0.1';

    const odeme = await prisma.odeme.findUnique({
      where: { id: odemeId },
      include: { ogrenci: true }
    });

    if (!odeme) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }

    if (odeme.durum !== 'ODENDI') {
      return res.status(400).json({ success: false, message: 'Sadece ödenmiş ödemeler iade edilebilir' });
    }

    // iyzico iadesi
    if (odeme.iyzicoPaymentId) {
      const result = await iyzicoService.cancelPayment(odeme.iyzicoPaymentId, ip);
      
      if (result.status !== 'success') {
        return res.status(400).json({ success: false, message: 'iyzico iade başarısız' });
      }
    }

    await prisma.odeme.update({
      where: { id: odemeId },
      data: {
        durum: 'IADE',
        aciklama: sebep
      }
    });

    await pushService.sendToUser(odeme.ogrenciId, {
      title: 'Ödeme İade Edildi',
      body: `${odeme.tutar.toLocaleString('tr-TR')} TL tutarındaki ödemeniz iade edildi.`
    });

    res.json({ success: true, message: 'Ödeme iade edildi' });
  } catch (error) {
    console.error('Ödeme iade hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== RAPORLAR ====================

// Ödeme raporu (Personel)
export const getOdemeRaporu = async (req: AuthRequest, res: Response) => {
  try {
    const { baslangic, bitis, durum } = req.query;

    const where: any = {};
    
    if (baslangic && bitis) {
      where.createdAt = {
        gte: new Date(baslangic as string),
        lte: new Date(bitis as string)
      };
    }
    
    if (durum) {
      where.durum = durum;
    }

    const odemeler = await prisma.odeme.findMany({
      where,
      include: {
        ogrenci: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            ogrenciNo: true,
            sinif: { select: { ad: true } }
          }
        },
        odemePlani: { select: { donemAd: true } },
        onaylayan: { select: { ad: true, soyad: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // İstatistikler
    const istatistik = {
      toplamOdeme: odemeler.length,
      toplamTutar: odemeler.reduce((sum, o) => sum + o.tutar, 0),
      odenenTutar: odemeler.filter(o => o.durum === 'ODENDI').reduce((sum, o) => sum + o.tutar, 0),
      bekleyenTutar: odemeler.filter(o => o.durum === 'BEKLEMEDE').reduce((sum, o) => sum + o.tutar, 0),
      gecikmisTutar: odemeler.filter(o => o.durum === 'GECIKTI').reduce((sum, o) => sum + o.tutar, 0),
      iadeTutar: odemeler.filter(o => o.durum === 'IADE').reduce((sum, o) => sum + o.tutar, 0)
    };

    // Ödeme yöntemi dağılımı
    const yontemDagilimi = {
      krediKarti: odemeler.filter(o => o.odemeYontemi === 'KREDI_KARTI' && o.durum === 'ODENDI').length,
      havale: odemeler.filter(o => o.odemeYontemi === 'HAVALE' && o.durum === 'ODENDI').length,
      nakit: odemeler.filter(o => o.odemeYontemi === 'NAKIT' && o.durum === 'ODENDI').length
    };

    res.json({
      success: true,
      data: {
        odemeler,
        istatistik,
        yontemDagilimi
      }
    });
  } catch (error) {
    console.error('Ödeme raporu hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Gecikmiş ödemeleri güncelle (Cron job için)
export const updateGecikmisodemeler = async () => {
  try {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const gecikmisodemeler = await prisma.odeme.updateMany({
      where: {
        durum: 'BEKLEMEDE',
        vadeTarihi: { lt: bugun }
      },
      data: { durum: 'GECIKTI' }
    });

    console.log(`${gecikmisodemeler.count} ödeme gecikmiş olarak güncellendi`);

    // Gecikmiş ödemeleri olan öğrencilere bildirim gönder
    const gecikmisList = await prisma.odeme.findMany({
      where: { durum: 'GECIKTI' },
      include: { ogrenci: true }
    });

    const uniqueOgrenciler = [...new Set(gecikmisList.map(o => o.ogrenciId))];
    
    for (const ogrenciId of uniqueOgrenciler) {
      await pushService.sendToUser(ogrenciId, {
        title: 'Gecikmiş Ödeme Hatırlatması',
        body: 'Vadesi geçmiş ödemeniz bulunmaktadır. Lütfen en kısa sürede ödemenizi yapınız.'
      });
    }

    return gecikmisodemeler.count;
  } catch (error) {
    console.error('Gecikmiş ödeme güncelleme hatası:', error);
    return 0;
  }
};

// Taksit seçeneklerini getir
export const getInstallmentOptions = async (req: AuthRequest, res: Response) => {
  try {
    const { binNumber, price } = req.query;

    if (!binNumber || !price) {
      return res.status(400).json({ success: false, message: 'BIN numarası ve tutar gerekli' });
    }

    const result = await iyzicoService.getInstallmentInfo(binNumber as string, price as string);

    if (result.status === 'success') {
      res.json({ success: true, data: result.installmentDetails });
    } else {
      res.status(400).json({ success: false, message: result.errorMessage });
    }
  } catch (error) {
    console.error('Taksit seçenekleri hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Test kartlarını getir (Development)
export const getTestCards = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Test kartları sadece development ortamında kullanılabilir' });
    }

    const testCards = iyzicoService.getTestCards();
    res.json({ success: true, data: testCards });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== KUPON YÖNETİMİ ====================

// Kupon oluştur
export const createKupon = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      kod, 
      aciklama, 
      indirimTipi, 
      indirimDegeri, 
      kullanimLimiti, 
      baslangicTarihi, 
      bitisTarihi, 
      minTutar,
      kursId 
    } = req.body;

    if (!kod || indirimDegeri === undefined) {
      return res.status(400).json({ success: false, message: 'Kupon kodu ve indirim değeri zorunludur' });
    }

    // Kupon kodu benzersiz mi kontrol et
    const existingKupon = await prisma.indirimKuponu.findUnique({
      where: { kod: kod.toUpperCase() }
    });

    if (existingKupon) {
      return res.status(400).json({ success: false, message: 'Bu kupon kodu zaten kullanılıyor' });
    }

    const kupon = await prisma.indirimKuponu.create({
      data: {
        kod: kod.toUpperCase(),
        aciklama,
        indirimTipi: indirimTipi || 'YUZDE',
        indirimDegeri,
        kullanimLimiti,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : new Date(),
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
        minTutar,
        kursId
      }
    });

    res.status(201).json({ success: true, data: kupon, message: 'Kupon oluşturuldu' });
  } catch (error) {
    console.error('Kupon oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Kuponları listele
export const getKuponlar = async (req: AuthRequest, res: Response) => {
  try {
    const { aktif } = req.query;

    const where: any = {};
    if (aktif !== undefined) {
      where.aktif = aktif === 'true';
    }

    const kuponlar = await prisma.indirimKuponu.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // İstatistiklerle birlikte döndür
    const kuponlarWithStats = kuponlar.map(k => ({
      ...k,
      kalanKullanim: k.kullanimLimiti ? k.kullanimLimiti - k.kullanilanAdet : 'Sınırsız',
      gecerliMi: k.aktif && (!k.bitisTarihi || new Date(k.bitisTarihi) >= new Date())
    }));

    res.json({ success: true, data: kuponlarWithStats });
  } catch (error) {
    console.error('Kupon listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Kupon doğrula
export const validateKupon = async (req: AuthRequest, res: Response) => {
  try {
    const { kod, tutar } = req.body;

    if (!kod) {
      return res.status(400).json({ success: false, message: 'Kupon kodu gerekli' });
    }

    const kupon = await prisma.indirimKuponu.findUnique({
      where: { kod: kod.toUpperCase() }
    });

    if (!kupon) {
      return res.status(404).json({ success: false, message: 'Geçersiz kupon kodu' });
    }

    // Kupon aktif mi?
    if (!kupon.aktif) {
      return res.status(400).json({ success: false, message: 'Bu kupon artık aktif değil' });
    }

    // Tarih kontrolü
    const now = new Date();
    if (kupon.bitisTarihi && new Date(kupon.bitisTarihi) < now) {
      return res.status(400).json({ success: false, message: 'Kuponun süresi dolmuş' });
    }

    if (new Date(kupon.baslangicTarihi) > now) {
      return res.status(400).json({ success: false, message: 'Kupon henüz aktif değil' });
    }

    // Kullanım limiti kontrolü
    if (kupon.kullanimLimiti && kupon.kullanilanAdet >= kupon.kullanimLimiti) {
      return res.status(400).json({ success: false, message: 'Kupon kullanım limiti dolmuş' });
    }

    // Minimum tutar kontrolü
    if (kupon.minTutar && tutar && tutar < kupon.minTutar) {
      return res.status(400).json({ 
        success: false, 
        message: `Bu kupon için minimum ${kupon.minTutar.toLocaleString('tr-TR')} TL tutarında ödeme gerekli` 
      });
    }

    // İndirim hesapla
    let indirimTutari = 0;
    if (tutar) {
      if (kupon.indirimTipi === 'YUZDE') {
        indirimTutari = tutar * kupon.indirimDegeri / 100;
      } else {
        indirimTutari = Math.min(kupon.indirimDegeri, tutar);
      }
    }

    res.json({ 
      success: true, 
      data: {
        kupon,
        indirimTutari: Math.round(indirimTutari * 100) / 100,
        sonTutar: tutar ? Math.round((tutar - indirimTutari) * 100) / 100 : null
      },
      message: 'Kupon geçerli'
    });
  } catch (error) {
    console.error('Kupon doğrulama hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Kupon güncelle
export const updateKupon = async (req: AuthRequest, res: Response) => {
  try {
    const { kuponId } = req.params;
    const { aciklama, kullanimLimiti, bitisTarihi, minTutar, aktif } = req.body;

    const kupon = await prisma.indirimKuponu.update({
      where: { id: kuponId },
      data: {
        ...(aciklama !== undefined && { aciklama }),
        ...(kullanimLimiti !== undefined && { kullanimLimiti }),
        ...(bitisTarihi !== undefined && { bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null }),
        ...(minTutar !== undefined && { minTutar }),
        ...(aktif !== undefined && { aktif })
      }
    });

    res.json({ success: true, data: kupon, message: 'Kupon güncellendi' });
  } catch (error) {
    console.error('Kupon güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== TOPLU ÖDEME PLANI ====================

// Sınıf bazlı toplu ödeme planı oluştur
export const createBulkOdemePlani = async (req: AuthRequest, res: Response) => {
  try {
    const olusturanId = req.user?.id;
    const { sinifId, donemAd, toplamTutar, taksitSayisi, indirimOrani, aciklama, vadeTarihleri } = req.body;

    if (!sinifId || !donemAd || !toplamTutar || !taksitSayisi) {
      return res.status(400).json({ success: false, message: 'Sınıf, dönem, tutar ve taksit sayısı zorunludur' });
    }

    // Sınıftaki öğrencileri bul
    const ogrenciler = await prisma.user.findMany({
      where: { sinifId, role: 'ogrenci', aktif: true },
      select: { id: true, ad: true, soyad: true, veliId: true }
    });

    if (ogrenciler.length === 0) {
      return res.status(400).json({ success: false, message: 'Seçilen sınıfta öğrenci bulunamadı' });
    }

    // Her öğrenci için ödeme planı oluştur
    const results: any[] = [];
    const errors: any[] = [];

    for (const ogrenci of ogrenciler) {
      try {
        // İndirim hesapla
        const indirimTutari = toplamTutar * (indirimOrani || 0) / 100;
        const netTutar = toplamTutar - indirimTutari;
        const taksitTutari = Math.ceil(netTutar / taksitSayisi);

        // Ödeme planı oluştur
        const odemePlani = await prisma.odemePlani.create({
          data: {
            ogrenciId: ogrenci.id,
            olusturanId: olusturanId!,
            donemAd,
            toplamTutar,
            taksitSayisi,
            taksitTutari,
            indirimOrani: indirimOrani || 0,
            indirimTutari,
            aciklama
          }
        });

        // Taksitleri oluştur
        const odemeler: any[] = [];
        for (let i = 0; i < taksitSayisi; i++) {
          const vadeTarihi = vadeTarihleri?.[i] 
            ? new Date(vadeTarihleri[i])
            : new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);

          odemeler.push({
            odemePlaniId: odemePlani.id,
            ogrenciId: ogrenci.id,
            tip: 'TAKSIT' as const,
            tutar: taksitTutari,
            taksitNo: i + 1,
            vadeTarihi,
            durum: 'BEKLEMEDE' as const
          });
        }

        await prisma.odeme.createMany({ data: odemeler });

        results.push({ ogrenciId: ogrenci.id, ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`, basarili: true });

        // Bildirim gönder
        await pushService.sendToUser(ogrenci.id, {
          title: 'Ödeme Planı Oluşturuldu',
          body: `${donemAd} için ödeme planınız oluşturuldu.`
        });

        // Veli varsa bildirim
        if (ogrenci.veliId) {
          await pushService.sendToUser(ogrenci.veliId, {
            title: 'Ödeme Planı',
            body: `${ogrenci.ad} ${ogrenci.soyad} için ödeme planı oluşturuldu.`
          });
        }
      } catch (err) {
        errors.push({ ogrenciId: ogrenci.id, ogrenciAd: `${ogrenci.ad} ${ogrenci.soyad}`, hata: 'İşlem hatası' });
      }
    }

    res.json({
      success: true,
      data: {
        toplamOgrenci: ogrenciler.length,
        basarili: results.length,
        hatali: errors.length,
        results,
        errors
      },
      message: `${results.length} öğrenci için ödeme planı oluşturuldu`
    });
  } catch (error) {
    console.error('Toplu ödeme planı hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== TAKSİT ERTELEME ====================

// Taksiti ertele
export const postponeTaksit = async (req: AuthRequest, res: Response) => {
  try {
    const { odemeId } = req.params;
    const { yeniVadeTarihi, not } = req.body;

    if (!yeniVadeTarihi) {
      return res.status(400).json({ success: false, message: 'Yeni vade tarihi gerekli' });
    }

    const odeme = await prisma.odeme.findUnique({
      where: { id: odemeId },
      include: { ogrenci: true }
    });

    if (!odeme) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }

    if (odeme.durum !== 'BEKLEMEDE' && odeme.durum !== 'GECIKTI') {
      return res.status(400).json({ success: false, message: 'Sadece bekleyen veya gecikmiş ödemeler ertelenebilir' });
    }

    // Max 2 kez erteleme
    if (odeme.ertelemeSayisi >= 2) {
      return res.status(400).json({ success: false, message: 'Bu taksit daha fazla ertelenemez (max 2)' });
    }

    const updatedOdeme = await prisma.odeme.update({
      where: { id: odemeId },
      data: {
        orijinalVadeTarihi: odeme.orijinalVadeTarihi || odeme.vadeTarihi,
        vadeTarihi: new Date(yeniVadeTarihi),
        ertelendi: true,
        ertelemeSayisi: odeme.ertelemeSayisi + 1,
        ertelemeNotu: not,
        durum: 'BEKLEMEDE' // Gecikmiş ise tekrar beklemede yap
      }
    });

    // Bildirim gönder
    await pushService.sendToUser(odeme.ogrenciId, {
      title: 'Taksit Ertelendi',
      body: `${odeme.taksitNo}. taksidiniz ${new Date(yeniVadeTarihi).toLocaleDateString('tr-TR')} tarihine ertelendi.`
    });

    res.json({ success: true, data: updatedOdeme, message: 'Taksit ertelendi' });
  } catch (error) {
    console.error('Taksit erteleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ÖDEME HATIRLATMA ====================

// Yaklaşan ödemeler için hatırlatma oluştur
export const createPaymentReminders = async (req: AuthRequest, res: Response) => {
  try {
    const { gunOnce = 3 } = req.body; // Kaç gün önce hatırlatma

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + gunOnce);
    targetDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Yaklaşan ödemeleri bul
    const yaklasanOdemeler = await prisma.odeme.findMany({
      where: {
        durum: 'BEKLEMEDE',
        vadeTarihi: {
          gte: today,
          lte: targetDate
        },
        hatirlatimaGonderildi: false
      },
      include: {
        ogrenci: { select: { id: true, ad: true, soyad: true, email: true, veliId: true } },
        odemePlani: { select: { donemAd: true } }
      }
    });

    let gonderilen = 0;

    for (const odeme of yaklasanOdemeler) {
      // Push bildirim
      await pushService.sendToUser(odeme.ogrenciId, {
        title: '💳 Ödeme Hatırlatması',
        body: `${odeme.odemePlani?.donemAd || ''} ${odeme.taksitNo}. taksit vadesi yaklaşıyor: ${new Date(odeme.vadeTarihi).toLocaleDateString('tr-TR')}`
      });

      // Veli bildirimi
      if (odeme.ogrenci.veliId) {
        await pushService.sendToUser(odeme.ogrenci.veliId, {
          title: '💳 Ödeme Hatırlatması',
          body: `${odeme.ogrenci.ad} için ${odeme.tutar.toLocaleString('tr-TR')} TL ödeme vadesi: ${new Date(odeme.vadeTarihi).toLocaleDateString('tr-TR')}`
        });
      }

      // Hatırlatma gönderildi olarak işaretle
      await prisma.odeme.update({
        where: { id: odeme.id },
        data: {
          hatirlatimaGonderildi: true,
          sonHatirlatmaTarihi: new Date()
        }
      });

      gonderilen++;
    }

    res.json({ 
      success: true, 
      data: { gonderilen },
      message: `${gonderilen} ödeme hatırlatması gönderildi`
    });
  } catch (error) {
    console.error('Hatırlatma gönderme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== PDF EXPORT ====================

// Ödeme makbuzu oluştur
export const generateMakbuz = async (req: AuthRequest, res: Response) => {
  try {
    const { odemeId } = req.params;

    const odeme = await prisma.odeme.findUnique({
      where: { id: odemeId },
      include: {
        ogrenci: {
          select: { ad: true, soyad: true, ogrenciNo: true, sinif: { select: { ad: true } } }
        },
        odemePlani: { select: { donemAd: true } },
        onaylayan: { select: { ad: true, soyad: true } }
      }
    });

    if (!odeme) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }

    if (odeme.durum !== 'ODENDI') {
      return res.status(400).json({ success: false, message: 'Sadece ödenmiş ödemeler için makbuz oluşturulabilir' });
    }

    // Makbuz numarası oluştur (yoksa)
    let makbuzNo = odeme.makbuzNo;
    if (!makbuzNo) {
      const yil = new Date().getFullYear();
      const count = await prisma.odeme.count({
        where: { makbuzNo: { startsWith: `MKB-${yil}` } }
      });
      makbuzNo = `MKB-${yil}-${String(count + 1).padStart(6, '0')}`;
      
      await prisma.odeme.update({
        where: { id: odemeId },
        data: { makbuzNo }
      });
    }

    // Makbuz bilgilerini döndür (PDF oluşturma frontend'de veya ayrı service'de yapılabilir)
    const makbuzBilgileri = {
      makbuzNo,
      tarih: odeme.odemeTarihi,
      ogrenci: {
        adSoyad: `${odeme.ogrenci.ad} ${odeme.ogrenci.soyad}`,
        ogrenciNo: odeme.ogrenci.ogrenciNo,
        sinif: odeme.ogrenci.sinif?.ad
      },
      odeme: {
        donem: odeme.odemePlani?.donemAd,
        taksitNo: odeme.taksitNo,
        tutar: odeme.tutar,
        odemeYontemi: odeme.odemeYontemi,
        kuponIndirimi: odeme.kuponIndirimi
      },
      onaylayan: odeme.onaylayan ? `${odeme.onaylayan.ad} ${odeme.onaylayan.soyad}` : null
    };

    res.json({ success: true, data: makbuzBilgileri });
  } catch (error) {
    console.error('Makbuz oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ödeme geçmişi export (CSV)
export const exportOdemeGecmisi = async (req: AuthRequest, res: Response) => {
  try {
    const { ogrenciId, baslangic, bitis } = req.query;

    const where: any = {};
    if (ogrenciId) {
      where.ogrenciId = ogrenciId;
    }
    if (baslangic && bitis) {
      where.createdAt = {
        gte: new Date(baslangic as string),
        lte: new Date(bitis as string)
      };
    }

    const odemeler = await prisma.odeme.findMany({
      where,
      include: {
        ogrenci: { select: { ad: true, soyad: true, ogrenciNo: true } },
        odemePlani: { select: { donemAd: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSV oluştur
    let csvContent = '\uFEFF'; // BOM for UTF-8
    const headers = [
      'Tarih',
      'Öğrenci No',
      'Ad Soyad',
      'Dönem',
      'Taksit No',
      'Tutar',
      'Durum',
      'Ödeme Yöntemi',
      'Ödeme Tarihi',
      'Makbuz No'
    ];
    csvContent += headers.join(';') + '\n';

    for (const odeme of odemeler) {
      const row = [
        new Date(odeme.createdAt).toLocaleDateString('tr-TR'),
        odeme.ogrenci.ogrenciNo || '-',
        `${odeme.ogrenci.ad} ${odeme.ogrenci.soyad}`,
        odeme.odemePlani?.donemAd || '-',
        odeme.taksitNo || '-',
        odeme.tutar.toLocaleString('tr-TR'),
        odeme.durum,
        odeme.odemeYontemi || '-',
        odeme.odemeTarihi ? new Date(odeme.odemeTarihi).toLocaleDateString('tr-TR') : '-',
        odeme.makbuzNo || '-'
      ];
      csvContent += row.join(';') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="odeme_gecmisi.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Export hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

