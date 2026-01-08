-- ==========================================================================
-- EDURA - TEST SORGULARI
-- HeidiSQL Sorgu Sekmesi 6
-- ==========================================================================
-- Bu dosya oluşturulan tüm konseptleri test etmek için kullanılır
-- ==========================================================================


-- ==========================================================================
-- BÖLÜM 1: VERİ HAZIRLAMA - ID'leri bul
-- ==========================================================================

-- Bir öğrenci ID'si bul
SELECT id, ad, soyad, email FROM User WHERE role = 'ogrenci' LIMIT 5;

-- Bir sınıf ID'si bul
SELECT id, ad, seviye FROM Sinif LIMIT 5;

-- Bir kurs ID'si bul
SELECT id, ad FROM Kurs LIMIT 5;

-- Bir öğretmen ID'si bul
SELECT id, ad, soyad, brans FROM User WHERE role = 'ogretmen' LIMIT 5;


-- ==========================================================================
-- BÖLÜM 2: STORED PROCEDURE TESTLERİ
-- ==========================================================================

-- TEST 1: Öğrenci istatistiklerini getir
-- Not: Aşağıdaki ID'yi yukarıdaki sorgudan bulduğunuz ile değiştirin
-- CALL SP_OgrenciIstatistikleri('OGRENCI_ID_BURAYA');

-- TEST 2: Sınıf başarı raporunu getir
-- CALL SP_SinifBasariRaporu('SINIF_ID_BURAYA');

-- TEST 3: Gecikmiş taksitleri getir
-- CALL SP_GecikmisTaksitlariGetir('KURS_ID_BURAYA');

-- TEST 4: XP güncelleme (dikkat: gerçek veri değiştirir!)
-- CALL SP_XPVeRozetGuncelle('OGRENCI_ID_BURAYA', 50, 'TEST');

-- TEST 5: Aylık gelir raporu
-- CALL SP_AylikGelirRaporu('KURS_ID_BURAYA', 2026, 1);


-- ==========================================================================
-- BÖLÜM 3: VIEW TESTLERİ
-- ==========================================================================

-- TEST 1: Öğrenci özeti
SELECT * FROM VW_OgrenciOzet LIMIT 10;

-- TEST 2: Belirli sınıftaki öğrenciler
SELECT * FROM VW_OgrenciOzet WHERE sinifAdi = '8-A';

-- TEST 3: XP'ye göre sıralama
SELECT tamAd, sinifAdi, xpPuani, xpSeviye, basariOrani 
FROM VW_OgrenciOzet 
ORDER BY xpPuani DESC 
LIMIT 10;

-- TEST 4: Ödev durum özeti
SELECT * FROM VW_OdevDurumOzet LIMIT 10;

-- TEST 5: Günlük aktivite
SELECT * FROM VW_GunlukAktivite;

-- TEST 6: Kurs performans karşılaştırması
SELECT * FROM VW_KursPerformans;

-- TEST 7: Ödeme özeti
SELECT * FROM VW_OdemeOzet LIMIT 10;

-- TEST 8: Öğretmen ders yükü
SELECT * FROM VW_OgretmenDersYuku ORDER BY toplamDers DESC LIMIT 10;


-- ==========================================================================
-- BÖLÜM 4: FUNCTION TESTLERİ
-- ==========================================================================

-- TEST 1: XP seviye hesaplama
SELECT FN_XPSeviyeHesapla(0) AS Baslangic;      -- BASLANGIC
SELECT FN_XPSeviyeHesapla(500) AS Hala_Baslangic; -- BASLANGIC
SELECT FN_XPSeviyeHesapla(1000) AS Cirak;       -- CIRAK
SELECT FN_XPSeviyeHesapla(5000) AS Usta;        -- USTA
SELECT FN_XPSeviyeHesapla(15000) AS Uzman;      -- UZMAN
SELECT FN_XPSeviyeHesapla(30000) AS Efsane;     -- EFSANE

-- TEST 2: Net hesaplama (4 yanlış 1 doğruyu götürür)
SELECT FN_NetHesapla(40, 0) AS Net_40_0;   -- 40.00 (hiç yanlış yok)
SELECT FN_NetHesapla(30, 8) AS Net_30_8;   -- 28.00 (30 - 2)
SELECT FN_NetHesapla(20, 20) AS Net_20_20; -- 15.00 (20 - 5)
SELECT FN_NetHesapla(10, 40) AS Net_10_40; -- 0.00 (10 - 10)

-- TEST 3: Yaş hesaplama
SELECT FN_OgrenciYas('2010-05-15') AS Yas;  -- ~15-16
SELECT FN_OgrenciYas('2008-01-01') AS Yas;  -- ~18
SELECT FN_OgrenciYas(NULL) AS Yas;          -- NULL

-- TEST 4: Ödev gecikme günü
SELECT FN_OdevGecikmeGunu('2026-01-01', '2026-01-01') AS Zamaninda;  -- 0
SELECT FN_OdevGecikmeGunu('2026-01-01', '2026-01-05') AS GecGun;     -- 4
SELECT FN_OdevGecikmeGunu('2026-01-10', '2026-01-05') AS Erken;      -- 0

-- TEST 5: Başarı oranı
SELECT FN_BasariOrani(75, 100) AS Yuzde75;  -- 75.00
SELECT FN_BasariOrani(23, 40) AS Yuzde57;   -- 57.50
SELECT FN_BasariOrani(0, 100) AS Yuzde0;    -- 0.00

-- TEST 6: Sonraki seviyeye kalan XP
SELECT FN_SonrakiXPSeviye(500) AS Kalan;    -- 500 (1000'e kadar)
SELECT FN_SonrakiXPSeviye(3500) AS Kalan;   -- 1500 (5000'e kadar)
SELECT FN_SonrakiXPSeviye(30000) AS Kalan;  -- 0 (zaten max)

-- TEST 7: Taksit durumu
SELECT FN_TaksitDurumu(DATE_ADD(CURDATE(), INTERVAL -35 DAY)) AS Kritik;  -- KRITIK_GECIKME
SELECT FN_TaksitDurumu(DATE_ADD(CURDATE(), INTERVAL -5 DAY)) AS Gecikti;  -- GECIKTI
SELECT FN_TaksitDurumu(DATE_ADD(CURDATE(), INTERVAL 2 DAY)) AS Yaklasti;  -- YAKLASTI
SELECT FN_TaksitDurumu(DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS Normal;   -- NORMAL

-- TEST 8: Sınıf seviyesi tipi
SELECT FN_SinifSeviyesiTipi(5) AS Tip;   -- ORTAOKUL
SELECT FN_SinifSeviyesiTipi(8) AS Tip;   -- ORTAOKUL
SELECT FN_SinifSeviyesiTipi(9) AS Tip;   -- LISE
SELECT FN_SinifSeviyesiTipi(12) AS Tip;  -- LISE


-- ==========================================================================
-- BÖLÜM 5: FUNCTION'LARI GERÇEK VERİ İLE KULLANMA
-- ==========================================================================

-- Öğrencilerin XP seviyelerini hesapla
SELECT 
    ad, 
    soyad, 
    xpPuani,
    FN_XPSeviyeHesapla(xpPuani) AS HesaplananSeviye,
    xpSeviye AS KayitliSeviye,
    FN_SonrakiXPSeviye(xpPuani) AS SonrakiSeviyeyeKalan
FROM User 
WHERE role = 'ogrenci' 
ORDER BY xpPuani DESC 
LIMIT 10;

-- Sınıf seviyelerini göster
SELECT 
    ad AS SinifAdi,
    seviye,
    FN_SinifSeviyesiTipi(seviye) AS SinifTipi
FROM Sinif;


-- ==========================================================================
-- BÖLÜM 6: TRIGGER KONTROLÜ
-- ==========================================================================

-- Mevcut trigger'ları listele
SHOW TRIGGERS;

-- Trigger detaylarını görüntüle
SHOW CREATE TRIGGER TR_OdevTeslimXP;
SHOW CREATE TRIGGER TR_YeniOgrenciHosgeldin;


-- ==========================================================================
-- BÖLÜM 7: STORED PROCEDURE VE FUNCTION KONTROLÜ
-- ==========================================================================

-- Mevcut stored procedure'leri listele
SHOW PROCEDURE STATUS WHERE Db = DATABASE();

-- Mevcut function'ları listele
SHOW FUNCTION STATUS WHERE Db = DATABASE();

-- Procedure detaylarını görüntüle
SHOW CREATE PROCEDURE SP_OgrenciIstatistikleri;

-- Function detaylarını görüntüle
SHOW CREATE FUNCTION FN_XPSeviyeHesapla;


-- ==========================================================================
-- BÖLÜM 8: VIEW KONTROLÜ
-- ==========================================================================

-- Mevcut view'ları listele
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- View tanımını görüntüle
SHOW CREATE VIEW VW_OgrenciOzet;


-- ==========================================================================
-- BÖLÜM 9: TABLO İLİŞKİLERİNİ GÖRÜNTÜLE
-- ==========================================================================

-- Foreign key'leri listele
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- Index'leri listele
SHOW INDEX FROM User;
SHOW INDEX FROM Odev;
SHOW INDEX FROM Odeme;
