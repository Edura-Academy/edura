import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    // Azra'yı bul
    const azra = await prisma.user.findFirst({
      where: { ad: 'Azra', role: 'ogrenci' },
      select: { id: true, ad: true, soyad: true, sinifId: true, sinif: { select: { ad: true, id: true } } }
    });
    console.log('\n=== AZRA BİLGİLERİ ===');
    console.log('Ad:', azra?.ad, azra?.soyad);
    console.log('Sinif ID:', azra?.sinifId);
    console.log('Sinif Ad:', azra?.sinif?.ad);

    // Aktif sınavları getir
    const sinavlar = await prisma.onlineSinav.findMany({
      where: { durum: 'AKTIF' },
      select: {
        id: true,
        baslik: true,
        courseId: true,
        hedefSiniflar: true,
        dersAdi: true,
        baslangicTarihi: true,
        bitisTarihi: true,
        ogretmen: { select: { ad: true, soyad: true } },
        course: { select: { ad: true, sinif: { select: { ad: true, id: true } } } }
      }
    });
    
    console.log('\n=== AKTİF SINAVLAR ===');
    const now = new Date();
    sinavlar.forEach(s => {
      console.log('Başlık:', s.baslik);
      console.log('  - courseId:', s.courseId);
      console.log('  - hedefSiniflar:', s.hedefSiniflar);
      console.log('  - dersAdi:', s.dersAdi);
      console.log('  - başlangıç:', s.baslangicTarihi);
      console.log('  - bitiş:', s.bitisTarihi);
      console.log('  - şu an aktif mi:', s.baslangicTarihi <= now && s.bitisTarihi >= now ? 'EVET' : 'HAYIR');
      
      // Azra'nın sınıfı hedefler içinde mi?
      if (azra && s.hedefSiniflar) {
        try {
          const hedefler = JSON.parse(s.hedefSiniflar);
          console.log('  - Azra sınıfı hedeflerde:', hedefler.includes(azra.sinifId) ? 'EVET ✅' : 'HAYIR ❌');
        } catch (e) {
          console.log('  - hedefSiniflar parse error');
        }
      } else if (!s.hedefSiniflar && !s.courseId) {
        console.log('  - Herkese açık sınav');
      }
      console.log('---');
    });

    // Tüm sınıfları göster
    const siniflar = await prisma.sinif.findMany({
      select: { id: true, ad: true, seviye: true }
    });
    console.log('\n=== TÜM SINIFLAR ===');
    siniflar.forEach(s => {
      console.log(`${s.ad} (id: ${s.id}, seviye: ${s.seviye})`);
    });

    // 5-B öğrencilerini bul
    const ogrenciler5B = await prisma.user.findMany({
      where: { 
        role: 'ogrenci',
        sinif: { ad: { contains: '5' } }
      },
      select: { 
        id: true, 
        ad: true, 
        soyad: true,
        sinifId: true, 
        sinif: { select: { ad: true, id: true } } 
      }
    });
    console.log('\n=== 5. SINIF ÖĞRENCİLERİ ===');
    ogrenciler5B.forEach(o => {
      console.log(`${o.ad} ${o.soyad} - sinifId: ${o.sinifId} - sinif: ${o.sinif?.ad} (${o.sinif?.id})`);
    });

    // Ali Kaya'nın sınavlarını kontrol et
    const aliKaya = await prisma.user.findFirst({
      where: { ad: 'Ali', soyad: 'Kaya', role: 'ogretmen' }
    });
    if (aliKaya) {
      const aliSinavlari = await prisma.onlineSinav.findMany({
        where: { ogretmenId: aliKaya.id },
        select: {
          id: true,
          baslik: true,
          durum: true,
          courseId: true,
          hedefSiniflar: true,
          baslangicTarihi: true,
          bitisTarihi: true
        }
      });
      console.log('\n=== ALİ KAYA SINAVLARI ===');
      aliSinavlari.forEach(s => {
        console.log('Başlık:', s.baslik);
        console.log('  - durum:', s.durum);
        console.log('  - courseId:', s.courseId);
        console.log('  - hedefSiniflar:', s.hedefSiniflar);
        console.log('  - başlangıç:', s.baslangicTarihi);
        console.log('  - bitiş:', s.bitisTarihi);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();

