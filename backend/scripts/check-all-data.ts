import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tüm kursları listele
  console.log('=== TÜM KURSLAR ===');
  const kurslar = await prisma.kurs.findMany({
    include: {
      _count: { select: { users: true, siniflar: true } }
    }
  });
  kurslar.forEach(k => {
    console.log(`📚 ${k.ad} - ${k._count.users} kullanıcı, ${k._count.siniflar} sınıf`);
  });

  // Tüm öğretmenleri listele
  console.log('\n=== TÜM ÖĞRETMENLER ===');
  const ogretmenler = await prisma.user.findMany({
    where: { role: 'ogretmen' },
    include: {
      kurs: true,
      ogretmenDersleri: {
        include: { sinif: true }
      }
    }
  });

  ogretmenler.forEach(og => {
    const uniqueSiniflar = new Set<string>();
    og.ogretmenDersleri.forEach(d => {
      if (d.sinif) uniqueSiniflar.add(d.sinif.ad);
    });
    
    console.log(`\n👨‍🏫 ${og.ad} ${og.soyad}`);
    console.log(`   Branş: ${og.brans}`);
    console.log(`   Kurs: ${og.kurs?.ad || 'YOK'}`);
    console.log(`   Ders sayısı: ${og.ogretmenDersleri.length}`);
    console.log(`   Sınıflar: ${Array.from(uniqueSiniflar).join(', ') || 'YOK'}`);
  });

  // Maltepe Zambak kursunun sınıflarını listele
  console.log('\n=== MALTEPE ZAMBAK SINIFLARI ===');
  const maltepeSiniflar = await prisma.sinif.findMany({
    where: {
      kurs: { ad: 'Maltepe Zambak' }
    },
    include: {
      _count: { select: { ogrenciler: true, dersler: true } }
    },
    orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
  });
  
  if (maltepeSiniflar.length === 0) {
    console.log('⚠️ Maltepe Zambak kursunda hiç sınıf yok!');
  } else {
    maltepeSiniflar.forEach(s => {
      console.log(`${s.ad} - ${s._count.ogrenciler} öğrenci, ${s._count.dersler} ders`);
    });
  }

  // Tüm sınıfların özeti
  console.log('\n=== SINIF ÖZETİ (KURSLARA GÖRE) ===');
  const tumSiniflar = await prisma.sinif.groupBy({
    by: ['kursId'],
    _count: { id: true }
  });
  
  for (const s of tumSiniflar) {
    const kurs = await prisma.kurs.findUnique({ where: { id: s.kursId } });
    console.log(`${kurs?.ad || 'Bilinmeyen'}: ${s._count.id} sınıf`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

