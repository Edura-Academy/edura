import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { Email: 'admin@edura.com' },
    update: {},
    create: {
      Ad: 'System',
      Soyad: 'Admin',
      Email: 'admin@edura.com',
      KullaniciAdi: 'admin',
      Sifre: adminPassword,
      Telefon: '05551234567',
      AktifMi: true,
    },
  });
  console.log('✅ Admin created:', admin.Email);

  // Örnek Kurs oluştur
  const kursPassword = await bcrypt.hash('kurs123', 10);
  const kurs = await prisma.kurs.upsert({
    where: { KullaniciAdi: 'demokurs' },
    update: {},
    create: {
      KursAdi: 'Demo Eğitim Kursu',
      Adres: 'İstanbul, Türkiye',
      Telefon: '02121234567',
      Email: 'info@demokurs.com',
      KullaniciAdi: 'demokurs',
      Sifre: kursPassword,
      AktifMi: true,
    },
  });
  console.log('✅ Kurs created:', kurs.KursAdi);

  // Branş oluştur
  const brans = await prisma.brans.upsert({
    where: { BransAdi: 'Matematik' },
    update: {},
    create: {
      BransAdi: 'Matematik',
    },
  });
  console.log('✅ Branş created:', brans.BransAdi);

  // Müdür oluştur
  const mudurPassword = await bcrypt.hash('mudur123', 10);
  const mudur = await prisma.mudur.upsert({
    where: { KullaniciAdi: 'mudur' },
    update: {},
    create: {
      KursID: kurs.KursID,
      Ad: 'Ahmet',
      Soyad: 'Yılmaz',
      Email: 'mudur@demokurs.com',
      Telefon: '05551234567',
      KullaniciAdi: 'mudur',
      Sifre: mudurPassword,
      AktifMi: true,
    },
  });
  console.log('✅ Müdür created:', mudur.KullaniciAdi);

  // Sekreter oluştur
  const sekreterPassword = await bcrypt.hash('sekreter123', 10);
  const sekreter = await prisma.sekreter.upsert({
    where: { KullaniciAdi: 'sekreter' },
    update: {},
    create: {
      KursID: kurs.KursID,
      Ad: 'Ayşe',
      Soyad: 'Demir',
      Email: 'sekreter@demokurs.com',
      Telefon: '05552345678',
      KullaniciAdi: 'sekreter',
      Sifre: sekreterPassword,
      AktifMi: true,
    },
  });
  console.log('✅ Sekreter created:', sekreter.KullaniciAdi);

  // Öğretmen oluştur
  const ogretmenPassword = await bcrypt.hash('ogretmen123', 10);
  const ogretmen = await prisma.ogretmen.upsert({
    where: { KullaniciAdi: 'ogretmen' },
    update: {},
    create: {
      KursID: kurs.KursID,
      BransID: brans.BransID,
      Ad: 'Fatma',
      Soyad: 'Kaya',
      Email: 'ogretmen@demokurs.com',
      Telefon: '05553456789',
      EgitimKocuMu: true,
      KullaniciAdi: 'ogretmen',
      Sifre: ogretmenPassword,
      AktifMi: true,
    },
  });
  console.log('✅ Öğretmen created:', ogretmen.KullaniciAdi);

  // Sınıf oluştur
  const sinif = await prisma.sinif.upsert({
    where: { SinifID: 1 },
    update: {},
    create: {
      KursID: kurs.KursID,
      SinifAdi: '10-A',
      Seviye: 10,
      Kapasite: 25,
      DanismanID: ogretmen.OgretmenID,
    },
  });
  console.log('✅ Sınıf created:', sinif.SinifAdi);

  // Veli oluştur
  const veli = await prisma.veli.upsert({
    where: { VeliID: 1 },
    update: {},
    create: {
      Ad: 'Ali',
      Soyad: 'Yıldız',
      Telefon: '05554567890',
      Email: 'veli@email.com',
      Adres: 'İstanbul, Türkiye',
    },
  });
  console.log('✅ Veli created:', veli.Ad, veli.Soyad);

  // Öğrenci oluştur
  const ogrenciPassword = await bcrypt.hash('ogrenci123', 10);
  const ogrenci = await prisma.ogrenci.upsert({
    where: { KullaniciAdi: 'ogrenci' },
      update: {},
      create: {
      KursID: kurs.KursID,
      SinifID: sinif.SinifID,
      VeliID: veli.VeliID,
      Ad: 'Mehmet',
      Soyad: 'Yıldız',
      DogumTarihi: new Date('2008-05-15'),
      Telefon: '05555678901',
      OkulTuru: 'LISE',
      Seviye: 10,
      KullaniciAdi: 'ogrenci',
      Sifre: ogrenciPassword,
      AktifMi: true,
      },
    });
  console.log('✅ Öğrenci created:', ogrenci.KullaniciAdi);

  // Ders oluştur
  const ders = await prisma.ders.upsert({
    where: { DersID: 1 },
    update: {},
    create: {
      BransID: brans.BransID,
      DersAdi: 'Matematik 10',
      Aciklama: '10. sınıf matematik dersi',
    },
  });
  console.log('✅ Ders created:', ders.DersAdi);

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
