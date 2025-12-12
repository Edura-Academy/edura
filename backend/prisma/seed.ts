import { PrismaClient, UserRole, SchoolType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edura.com' },
    update: {},
    create: {
      email: 'admin@edura.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Müdür oluştur
  const mudurPassword = await bcrypt.hash('mudur123', 10);
  const mudur = await prisma.user.upsert({
    where: { email: 'mudur@edura.com' },
    update: {},
    create: {
      email: 'mudur@edura.com',
      password: mudurPassword,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      role: UserRole.MUDUR,
    },
  });
  console.log('✅ Müdür created:', mudur.email);

  // Öğretmen oluştur
  const ogretmenPassword = await bcrypt.hash('ogretmen123', 10);
  const ogretmenUser = await prisma.user.upsert({
    where: { email: 'ogretmen@edura.com' },
    update: {},
    create: {
      email: 'ogretmen@edura.com',
      password: ogretmenPassword,
      firstName: 'Fatma',
      lastName: 'Demir',
      role: UserRole.OGRETMEN,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: ogretmenUser.id },
    update: {},
    create: {
      userId: ogretmenUser.id,
      isCoach: true,
      subjects: 'Matematik, Fizik',
      bio: 'Deneyimli matematik ve fizik öğretmeni.',
    },
  });
  console.log('✅ Öğretmen created:', ogretmenUser.email);

  // Öğrenci oluştur
  const ogrenciPassword = await bcrypt.hash('ogrenci123', 10);
  const ogrenciUser = await prisma.user.upsert({
    where: { email: 'ogrenci@edura.com' },
    update: {},
    create: {
      email: 'ogrenci@edura.com',
      password: ogrenciPassword,
      firstName: 'Mehmet',
      lastName: 'Kaya',
      role: UserRole.OGRENCI,
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: ogrenciUser.id },
    update: {},
    create: {
      userId: ogrenciUser.id,
      schoolType: SchoolType.LISE,
      grade: 10,
      parentName: 'Ali Kaya',
      parentPhone: '05551234567',
    },
  });
  console.log('✅ Öğrenci created:', ogrenciUser.email);

  // Örnek Kurs oluştur
  const course = await prisma.course.upsert({
    where: { id: 'course-1' },
    update: {},
    create: {
      id: 'course-1',
      title: 'Matematik 10. Sınıf',
      description: '10. sınıf matematik müfredatına uygun kapsamlı kurs.',
      teacherId: teacher.id,
      isPublished: true,
    },
  });
  console.log('✅ Course created:', course.title);

  // Örnek Dersler oluştur
  const lessons = [
    { title: 'Polinomlar - Giriş', description: 'Polinomların tanımı ve temel kavramlar', order: 1 },
    { title: 'Polinomlar - İşlemler', description: 'Toplama, çıkarma ve çarpma işlemleri', order: 2 },
    { title: 'İkinci Dereceden Denklemler', description: 'Kök bulma yöntemleri', order: 3 },
  ];

  for (const lessonData of lessons) {
    await prisma.lesson.upsert({
      where: { id: `lesson-${lessonData.order}` },
      update: {},
      create: {
        id: `lesson-${lessonData.order}`,
        ...lessonData,
        courseId: course.id,
        duration: 45,
      },
    });
  }
  console.log('✅ Lessons created');

  // Öğrenciyi kursa kaydet
  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      courseId: course.id,
    },
  });
  console.log('✅ Enrollment created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

