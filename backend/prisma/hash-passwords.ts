import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';

async function hashPasswords() {
  console.log('🔐 Şifreler hashleniyor...');

  const tables = [
    { name: 'admin', model: prisma.admin, idField: 'AdminID' },
    { name: 'kurs', model: prisma.kurs, idField: 'KursID' },
    { name: 'mudur', model: prisma.mudur, idField: 'MudurID' },
    { name: 'sekreter', model: prisma.sekreter, idField: 'SekreterID' },
    { name: 'ogretmen', model: prisma.ogretmen, idField: 'OgretmenID' },
    { name: 'ogrenci', model: prisma.ogrenci, idField: 'OgrenciID' },
  ];

  for (const table of tables) {
    try {
      // @ts-expect-error - dynamic model access
      const records = await table.model.findMany();
      
      for (const record of records) {
        // Şifre zaten hash'li mi kontrol et (bcrypt hash'leri $2 ile başlar)
        if (record.Sifre && !record.Sifre.startsWith('$2')) {
          const hashedPassword = await bcrypt.hash(record.Sifre, 10);
          
          // @ts-expect-error - dynamic model access
          await table.model.update({
            where: { [table.idField]: record[table.idField] },
            data: { Sifre: hashedPassword },
          });
          
          console.log(`✅ ${table.name} - ${record.KullaniciAdi} şifresi hashlendi`);
        }
      }
    } catch (error) {
      console.error(`❌ ${table.name} tablosunda hata:`, error);
    }
  }

  console.log('🎉 Tamamlandı!');
}

hashPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

