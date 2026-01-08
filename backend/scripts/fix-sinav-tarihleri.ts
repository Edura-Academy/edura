import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  try {
    // Bitiş tarihini 1 hafta sonraya çek
    const yeniBitis = new Date();
    yeniBitis.setDate(yeniBitis.getDate() + 7);
    
    const result = await prisma.onlineSinav.updateMany({
      where: { 
        durum: 'AKTIF',
        bitisTarihi: { lt: new Date() }
      },
      data: { bitisTarihi: yeniBitis }
    });
    
    console.log('✅ Güncellenen sınav sayısı:', result.count);
    
    // Güncel sınavları göster
    const aktifSinavlar = await prisma.onlineSinav.findMany({
      where: { durum: 'AKTIF' },
      select: {
        baslik: true,
        bitisTarihi: true,
        hedefSiniflar: true
      }
    });
    
    console.log('\n=== GÜNCEL AKTİF SINAVLAR ===');
    aktifSinavlar.forEach(s => {
      console.log(`${s.baslik} - Bitiş: ${s.bitisTarihi}`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();

