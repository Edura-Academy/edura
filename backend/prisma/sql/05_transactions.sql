-- ==========================================================================
-- EDURA - TRANSACTIONS (İŞLEMLER)
-- HeidiSQL Sorgu Sekmesi 5
-- ==========================================================================
-- Transaction Nedir?
-- Birden fazla veritabanı işlemini tek bir bütün olarak ele alan yapıdır.
-- Ya tüm işlemler başarılı olur (COMMIT) ya da hiçbiri uygulanmaz (ROLLBACK).
-- ==========================================================================

-- ==========================================================================
-- ÖRNEK 1: YENİ ÖĞRENCİ KAYDI (TRANSACTION)
-- Senaryo: Yeni öğrenci kaydederken birden fazla tabloya veri eklenir
-- ==========================================================================

-- Bu örneği test etmek için önce değişkenleri ayarlayın
SET @ogrenci_id = UUID();
SET @plan_id = UUID();
SET @kurs_id = (SELECT id FROM Kurs LIMIT 1);
SET @sinif_id = (SELECT id FROM Sinif WHERE kursId = @kurs_id LIMIT 1);
SET @sekreter_id = (SELECT id FROM User WHERE role = 'sekreter' LIMIT 1);

-- Transaction başlat
START TRANSACTION;

-- Adım 1: Öğrenciyi User tablosuna ekle
INSERT INTO User (
    id, email, password, ad, soyad, role, 
    kursId, sinifId, aktif, 
    xpPuani, xpSeviye, streak, enYuksekStreak,
    toplamCozulenSoru, toplamDogruCevap, toplamTeslimOdev, toplamKatilinanDers,
    createdAt, updatedAt
)
VALUES (
    @ogrenci_id, 
    CONCAT('test_', UNIX_TIMESTAMP(), '@email.com'), -- Benzersiz email
    '$2a$10$hashedpassword', 
    'Test', 
    'Öğrenci', 
    'ogrenci',
    @kurs_id, 
    @sinif_id, 
    1,
    0, 'BASLANGIC', 0, 0,
    0, 0, 0, 0,
    NOW(), 
    NOW()
);

-- Adım 2: Ödeme planı oluştur
INSERT INTO OdemePlani (
    id, ogrenciId, donemAd, toplamTutar, taksitSayisi, taksitTutari,
    olusturanId, aktif, createdAt, updatedAt
)
VALUES (
    @plan_id, 
    @ogrenci_id, 
    '2025-2026 Güz Dönemi', 
    12000, -- Toplam tutar
    8,     -- Taksit sayısı
    1500,  -- Taksit tutarı
    @sekreter_id, 
    1, 
    NOW(), 
    NOW()
);

-- Adım 3: İlk 3 taksiti oluştur
INSERT INTO Odeme (id, odemePlaniId, ogrenciId, tip, tutar, durum, taksitNo, vadeTarihi, createdAt, updatedAt)
VALUES 
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 1, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), NOW(), NOW()),
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 2, DATE_ADD(CURDATE(), INTERVAL 2 MONTH), NOW(), NOW()),
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 3, DATE_ADD(CURDATE(), INTERVAL 3 MONTH), NOW(), NOW());

-- Herşey başarılı ise kaydet
COMMIT;

-- Eklenen öğrenciyi kontrol et
SELECT * FROM User WHERE id = @ogrenci_id;
SELECT * FROM OdemePlani WHERE ogrenciId = @ogrenci_id;
SELECT * FROM Odeme WHERE ogrenciId = @ogrenci_id;

-- NOT: Hata durumunda ROLLBACK; kullanılır


-- ==========================================================================
-- ÖRNEK 2: ÖDEME İŞLEMİ (TRANSACTION)
-- Senaryo: Ödeme yapıldığında durum güncellenir ve kupon kullanımı kaydedilir
-- ==========================================================================

-- Bu örnek için değişkenleri ayarlayın
SET @odeme_id = (SELECT id FROM Odeme WHERE durum = 'BEKLEMEDE' LIMIT 1);
SET @onaylayan_id = (SELECT id FROM User WHERE role = 'sekreter' LIMIT 1);

START TRANSACTION;

-- Adım 1: Ödeme durumunu güncelle
UPDATE Odeme 
SET durum = 'ODENDI', 
    odemeTarihi = NOW(),
    odemeYontemi = 'NAKIT',
    onaylayanId = @onaylayan_id,
    makbuzNo = CONCAT('EDU-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0')),
    updatedAt = NOW()
WHERE id = @odeme_id;

-- Adım 2: Ödeme bildirimi oluştur (opsiyonel)
INSERT INTO Notification (id, userId, tip, baslik, mesaj, okundu, createdAt, updatedAt)
SELECT 
    UUID(),
    o.ogrenciId,
    'BILDIRIM',
    'Ödemeniz Alındı ✅',
    CONCAT('Taksit ödemesi başarıyla alınmıştır. Tutar: ', o.tutar, ' TL'),
    0,
    NOW(),
    NOW()
FROM Odeme o WHERE o.id = @odeme_id;

COMMIT;

-- Güncellenen ödemeyi kontrol et
SELECT * FROM Odeme WHERE id = @odeme_id;


-- ==========================================================================
-- ÖRNEK 3: SINAV TAMAMLAMA (TRANSACTION)
-- Senaryo: Öğrenci sınavı tamamladığında sonuç hesaplanır ve XP verilir
-- ==========================================================================

-- Bu sadece örnek SQL'dir - gerçek sınav ID'si gerekir
/*
SET @oturum_id = 'sinav-oturum-uuid';
SET @ogrenci_id = (SELECT ogrenciId FROM SinavOturumu WHERE id = @oturum_id);

START TRANSACTION;

-- Adım 1: Sınav oturumunu tamamlandı olarak işaretle
UPDATE SinavOturumu 
SET tamamlandi = 1,
    bitisZamani = NOW(),
    updatedAt = NOW()
WHERE id = @oturum_id;
-- NOT: TR_SinavSonucuHesapla trigger'ı otomatik olarak sonuçları hesaplar

-- Adım 2: Sınav XP'si kazandır (örnek: 100 XP)
UPDATE User 
SET xpPuani = xpPuani + 100,
    sonAktiviteTarihi = NOW(),
    updatedAt = NOW()
WHERE id = @ogrenci_id;

-- Adım 3: Sınav tamamlama bildirimi gönder
INSERT INTO Notification (id, userId, tip, baslik, mesaj, okundu, createdAt, updatedAt)
VALUES (
    UUID(),
    @ogrenci_id,
    'BILDIRIM',
    'Sınav Tamamlandı 📝',
    'Sınavınız başarıyla tamamlandı. Sonuçlarınızı kontrol edebilirsiniz.',
    0,
    NOW(),
    NOW()
);

COMMIT;
*/


-- ==========================================================================
-- ÖRNEK 4: TOPLU ÖDEV ATAMA (TRANSACTION)
-- Senaryo: Bir ödev birden fazla sınıfa atanır
-- ==========================================================================

-- Bu sadece örnek SQL'dir
/*
SET @ogretmen_id = 'ogretmen-uuid';
SET @odev_id = UUID();

START TRANSACTION;

-- Adım 1: Ödev oluştur
INSERT INTO Odev (
    id, baslik, aciklama, ogretmenId, 
    sonTeslimTarihi, maxPuan, aktif, taslak,
    odevTipi, createdAt, updatedAt
)
VALUES (
    @odev_id,
    'Haftalık Matematik Ödevi',
    'Sayfa 45-50 arası problemleri çözünüz.',
    @ogretmen_id,
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    100,
    1,
    0,
    'KARISIK',
    NOW(),
    NOW()
);

-- Adım 2: Hedef sınıfları güncelle (JSON formatında)
UPDATE Odev 
SET hedefSiniflar = '["sinif-id-1", "sinif-id-2", "sinif-id-3"]'
WHERE id = @odev_id;

-- Adım 3: İlgili öğrencilere bildirim gönder
INSERT INTO Notification (id, userId, tip, baslik, mesaj, okundu, createdAt, updatedAt)
SELECT 
    UUID(),
    u.id,
    'BILDIRIM',
    'Yeni Ödev Atandı 📚',
    'Yeni bir ödev atandı. Son teslim tarihine dikkat ediniz.',
    0,
    NOW(),
    NOW()
FROM User u
WHERE u.sinifId IN ('sinif-id-1', 'sinif-id-2', 'sinif-id-3')
  AND u.role = 'ogrenci'
  AND u.aktif = 1;

COMMIT;
*/


-- ==========================================================================
-- ÖRNEK 5: ROLLBACK KULLANIMI
-- Senaryo: Hata durumunda tüm işlemleri geri alma
-- ==========================================================================

-- Transaction ile hata yönetimi örneği
/*
START TRANSACTION;

-- İşlem 1
INSERT INTO ...;

-- İşlem 2 - Hata oluşursa
INSERT INTO ...; -- Bu başarısız olursa

-- Hata kontrolü yapılabilir (uygulama kodunda)
-- Eğer hata varsa:
ROLLBACK; -- Tüm değişiklikler geri alınır

-- Eğer hata yoksa:
COMMIT; -- Tüm değişiklikler kalıcı olur
*/


-- ==========================================================================
-- TRANSACTION DURUMUNU KONTROL ETME
-- ==========================================================================

-- Aktif transaction var mı kontrol et
SELECT @@autocommit;

-- Autocommit'i kapat (manuel transaction kontrolü için)
-- SET autocommit = 0;

-- Autocommit'i aç (varsayılan)
-- SET autocommit = 1;
