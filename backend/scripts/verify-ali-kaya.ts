import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ali Kaya'nın ders sayısı
  const aliKayaId = '78c071be-40a2-4c74-b736-ff597a9d47dd';
  
  const dersler = await prisma.course.findMany({
    where: { ogretmenId: aliKayaId, aktif: true },
    include: { sinif: true }
  });

  console.log(`\n=== ALİ KAYA DERS KONTROLÜ ===`);
  console.log(`Toplam ders: ${dersler.length}`);
  
  if (dersler.length > 0) {
    const uniqueSiniflar = [...new Set(dersler.map(d => d.sinif?.ad).filter(Boolean))];
    console.log(`Unique sınıflar (${uniqueSiniflar.length}): ${uniqueSiniflar.join(', ')}`);
  }

  // API simülasyonu - öğretmen olarak siniflar endpoint'i
  const sinifIds = [...new Set(dersler.map(d => d.sinifId))];
  
  const siniflar = await prisma.sinif.findMany({
    where: {
      id: { in: sinifIds },
      aktif: true
    },
    include: {
      kurs: true,
      _count: { select: { ogrenciler: true } }
    },
    orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
  });

  console.log(`\n=== API DÖNDÜRECEĞI SINIFLAR ===`);
  console.log(`Toplam: ${siniflar.length}`);
  siniflar.forEach(s => {
    console.log(`  - ${s.ad} (${s.kurs?.ad}) - ${s._count.ogrenciler} öğrenci`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

