-- ==========================================================================
-- TEMİZLİK - Transaction örneğinde eklenen test verileri sil
-- ==========================================================================

-- Test öğrencisini bul
SELECT id, ad, soyad, email FROM User 
WHERE ad = 'Test' AND soyad = 'Öğrenci' AND email LIKE 'test_%@email.com';

-- Eğer bulunduysa sil (sırayla çalıştır):

-- 1. Önce ödemeleri sil
DELETE FROM Odeme WHERE ogrenciId IN (
    SELECT id FROM User WHERE ad = 'Test' AND soyad = 'Öğrenci' AND email LIKE 'test_%@email.com'
);

-- 2. Sonra ödeme planlarını sil
DELETE FROM OdemePlani WHERE ogrenciId IN (
    SELECT id FROM User WHERE ad = 'Test' AND soyad = 'Öğrenci' AND email LIKE 'test_%@email.com'
);

-- 3. Bildirimleri sil
DELETE FROM Notification WHERE userId IN (
    SELECT id FROM User WHERE ad = 'Test' AND soyad = 'Öğrenci' AND email LIKE 'test_%@email.com'
);

-- 4. En son kullanıcıyı sil
DELETE FROM User WHERE ad = 'Test' AND soyad = 'Öğrenci' AND email LIKE 'test_%@email.com';

-- Kontrol et - boş dönmeli
SELECT id, ad, soyad, email FROM User 
WHERE ad = 'Test' AND soyad = 'Öğrenci';
