import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ali Kaya'yı bul
  const aliKaya = await prisma.user.findFirst({
    where: { 
      ad: 'Ali',
      soyad: 'Kaya'
    },
    include: {
      kurs: true,
      sinif: true,
      ogretmenDersleri: {
        include: {
          sinif: true
        }
      }
    }
  });

  console.log('=== ALİ KAYA BİLGİLERİ ===');
  if (aliKaya) {
    console.log(`ID: ${aliKaya.id}`);
    console.log(`Ad: ${aliKaya.ad} ${aliKaya.soyad}`);
    console.log(`Rol: ${aliKaya.role}`);
    console.log(`Branş: ${aliKaya.brans}`);
    console.log(`Kurs: ${aliKaya.kurs?.ad}`);
    console.log(`Verdiği Dersler: ${aliKaya.ogretmenDersleri?.length || 0}`);
    
    if (aliKaya.ogretmenDersleri && aliKaya.ogretmenDersleri.length > 0) {
      console.log('\n--- Verdiği Dersler ve Sınıfları ---');
      const uniqueSiniflar = new Set<string>();
      aliKaya.ogretmenDersleri.forEach(course => {
        console.log(`  - ${course.ad} → Sınıf: ${course.sinif?.ad || 'Belirsiz'}`);
        if (course.sinif) uniqueSiniflar.add(course.sinif.ad);
      });
      console.log(`\n✅ Ali Kaya'nın ders verdiği unique sınıflar: ${Array.from(uniqueSiniflar).join(', ')}`);
    }
  } else {
    console.log('Ali Kaya bulunamadı!');
  }

  // Malta-Zambak kursundaki tüm öğretmenleri ve derslerini listele
  console.log('\n\n=== MALTA-ZAMBAK KURSUNDAKİ ÖĞRETMENLER ===');
  const ogretmenler = await prisma.user.findMany({
    where: {
      role: 'ogretmen',
      kurs: {
        ad: { contains: 'Malta' }
      }
    },
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
    
    console.log(`\n👨‍🏫 ${og.ad} ${og.soyad} (${og.brans})`);
    console.log(`   Kurs: ${og.kurs?.ad}`);
    console.log(`   Ders sayısı: ${og.ogretmenDersleri.length}`);
    console.log(`   Ders verdiği sınıflar: ${Array.from(uniqueSiniflar).join(', ') || 'YOK'}`);
  });

  // Tüm sınıfları listele (Malta-Zambak)
  console.log('\n\n=== MALTA-ZAMBAK SINIFLARI ===');
  const siniflar = await prisma.sinif.findMany({
    where: {
      aktif: true,
      kurs: { ad: { contains: 'Malta' } }
    },
    include: {
      kurs: true,
      _count: { select: { ogrenciler: true } }
    },
    orderBy: [{ seviye: 'asc' }, { ad: 'asc' }]
  });

  siniflar.forEach(s => {
    console.log(`${s.ad} (${s.kurs?.ad}) - ${s._count.ogrenciler} öğrenci`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
