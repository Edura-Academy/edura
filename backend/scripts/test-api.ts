import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  // Ali Kaya'yı bul
  const aliKaya = await prisma.user.findFirst({
    where: { ad: 'Ali', soyad: 'Kaya' }
  });

  if (!aliKaya) {
    console.log('Ali Kaya bulunamadı!');
    return;
  }

  console.log('=== ALİ KAYA ===');
  console.log(`ID: ${aliKaya.id}`);
  console.log(`Email: ${aliKaya.email}`);
  console.log(`Role: ${aliKaya.role}`);

  // Token oluştur
  const token = jwt.sign(
    { id: aliKaya.id, email: aliKaya.email, role: aliKaya.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  console.log(`\n=== TEST TOKEN ===`);
  console.log(`Token: ${token.substring(0, 50)}...`);

  // API endpoint'ini simüle et
  console.log(`\n=== API TEST: /users/siniflar?ogretmenDersleri=true ===`);
  
  // Öğretmenin derslerindeki sınıfları getir
  const ogretmenDersler = await prisma.course.findMany({
    where: {
      ogretmenId: aliKaya.id,
      aktif: true
    },
    select: { sinifId: true }
  });

  const sinifIds = [...new Set(ogretmenDersler.map(d => d.sinifId))];
  console.log(`Ders sayısı: ${ogretmenDersler.length}`);
  console.log(`Unique sınıf ID sayısı: ${sinifIds.length}`);

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

  console.log(`\nDöndürülecek sınıf sayısı: ${siniflar.length}`);
  
  if (siniflar.length > 0) {
    console.log('\nSınıflar:');
    siniflar.forEach(s => {
      console.log(`  - ${s.id.substring(0, 8)}... | ${s.ad} | ${s.kurs?.ad}`);
    });
  } else {
    console.log('\n⚠️ UYARI: Sınıf bulunamadı!');
  }

  // Curl komutu
  console.log(`\n=== CURL TEST KOMUTU ===`);
  console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:5000/api/users/siniflar?ogretmenDersleri=true"`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

