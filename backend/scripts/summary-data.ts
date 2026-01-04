import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const siniflar = await prisma.sinif.findMany({
    select: { id: true, ad: true, tip: true },
    orderBy: { ad: 'asc' }
  });
  console.log('SINIFLAR:');
  siniflar.forEach(s => console.log(`  ${s.ad} - ${s.tip} - ${s.id}`));
  
  console.log('\n---\nDERSLER (COURSES):');
  const courses = await prisma.course.findMany({
    select: { id: true, ad: true, sinif: { select: { ad: true } } },
    orderBy: { ad: 'asc' }
  });
  courses.forEach(c => console.log(`  ${c.ad} - ${c.sinif?.ad} - ${c.id}`));
  
  console.log('\n---\nOGRENCİ SAYISI:');
  const count = await prisma.user.count({ where: { role: 'ogrenci' } });
  console.log('Toplam ogrenci:', count);
  
  console.log('\n---\nDERS KAYIT SAYISI:');
  const enrollCount = await prisma.courseEnrollment.count();
  console.log('Toplam kayit:', enrollCount);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

