import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Öğrencileri getir
  const users = await prisma.user.findMany({
    where: { role: 'ogrenci' },
    select: { id: true, ad: true, soyad: true, sinifId: true, sinif: { select: { ad: true } } }
  });
  console.log('---OGRENCILER---');
  console.log(JSON.stringify(users, null, 2));

  // Dersleri getir
  const courses = await prisma.course.findMany({
    select: { id: true, ad: true, sinifId: true, sinif: { select: { ad: true } } }
  });
  console.log('---COURSES (DERSLER)---');
  console.log(JSON.stringify(courses, null, 2));

  // Sınıfları getir
  const siniflar = await prisma.sinif.findMany();
  console.log('---SINIFLAR---');
  console.log(JSON.stringify(siniflar, null, 2));

  // Mevcut ders kayıtları
  const enrollments = await prisma.courseEnrollment.findMany({
    include: {
      ogrenci: { select: { ad: true, soyad: true } },
      course: { select: { ad: true } }
    }
  });
  console.log('---MEVCUT DERS KAYITLARI---');
  console.log(JSON.stringify(enrollments, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

