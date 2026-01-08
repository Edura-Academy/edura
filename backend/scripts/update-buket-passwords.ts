import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateBuketPasswords() {
  try {
    // Küçükyalı Buket kursunu bul
    const kurs = await prisma.kurs.findFirst({
      where: {
        ad: {
          contains: 'Buket'
        }
      }
    });

    if (!kurs) {
      console.log('❌ Küçükyalı Buket kursu bulunamadı!');
      return;
    }

    console.log(`✅ Kurs bulundu: ${kurs.ad} (ID: ${kurs.id})`);

    // Bu kurstaki tüm kullanıcıları bul
    const users = await prisma.user.findMany({
      where: {
        kursId: kurs.id
      },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        role: true
      }
    });

    console.log(`📋 ${users.length} kullanıcı bulundu.`);

    if (users.length === 0) {
      console.log('⚠️ Bu kursta kullanıcı yok.');
      return;
    }

    // Yeni şifreyi hash'le
    const yeniSifre = 'edura123';
    const hashedPassword = await bcrypt.hash(yeniSifre, 10);

    // Tüm kullanıcıların şifrelerini güncelle
    const result = await prisma.user.updateMany({
      where: {
        kursId: kurs.id
      },
      data: {
        password: hashedPassword
      }
    });

    console.log(`\n✅ ${result.count} kullanıcının şifresi 'edura123' olarak güncellendi.\n`);

    // Güncellenen kullanıcıları listele
    console.log('📝 Güncellenen kullanıcılar:');
    console.log('─'.repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.ad} ${user.soyad} (${user.email}) - ${user.role}`);
    });
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBuketPasswords();

