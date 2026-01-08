-- ==========================================================================
-- EDURA - FUNCTIONS (FONKSİYONLAR)
-- HeidiSQL Sorgu Sekmesi 4
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. FN_XPSeviyeHesapla
-- Amaç: XP puanına göre seviye döndürür
-- Kullanım: SELECT FN_XPSeviyeHesapla(7500); -- Sonuç: USTA
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_XPSeviyeHesapla;

DELIMITER //
CREATE FUNCTION FN_XPSeviyeHesapla(p_xp INT) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    RETURN CASE
        WHEN p_xp >= 30000 THEN 'EFSANE'
        WHEN p_xp >= 15000 THEN 'UZMAN'
        WHEN p_xp >= 5000 THEN 'USTA'
        WHEN p_xp >= 1000 THEN 'CIRAK'
        ELSE 'BASLANGIC'
    END;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 2. FN_NetHesapla
-- Amaç: Deneme sınavı neti hesaplar (4 yanlış 1 doğruyu götürür)
-- Kullanım: SELECT FN_NetHesapla(30, 8); -- Sonuç: 28.00
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_NetHesapla;

DELIMITER //
CREATE FUNCTION FN_NetHesapla(p_dogru INT, p_yanlis INT) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    RETURN p_dogru - (p_yanlis / 4.0);
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 3. FN_OgrenciYas
-- Amaç: Doğum tarihinden yaş hesaplar
-- Kullanım: SELECT FN_OgrenciYas('2010-05-15'); -- Sonuç: 15
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_OgrenciYas;

DELIMITER //
CREATE FUNCTION FN_OgrenciYas(p_dogum_tarihi DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    IF p_dogum_tarihi IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN TIMESTAMPDIFF(YEAR, p_dogum_tarihi, CURDATE());
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 4. FN_OdevGecikmeGunu
-- Amaç: Ödevin kaç gün geç teslim edildiğini hesaplar
-- Kullanım: SELECT FN_OdevGecikmeGunu('2026-01-01', '2026-01-05'); -- Sonuç: 4
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_OdevGecikmeGunu;

DELIMITER //
CREATE FUNCTION FN_OdevGecikmeGunu(p_son_tarih DATETIME, p_teslim_tarih DATETIME) 
RETURNS INT
DETERMINISTIC
BEGIN
    IF p_teslim_tarih <= p_son_tarih THEN
        RETURN 0; -- Zamanında teslim
    END IF;
    RETURN DATEDIFF(p_teslim_tarih, p_son_tarih);
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 5. FN_BasariOrani
-- Amaç: Doğru ve toplam sayıdan başarı yüzdesi hesaplar
-- Kullanım: SELECT FN_BasariOrani(75, 100); -- Sonuç: 75.00
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_BasariOrani;

DELIMITER //
CREATE FUNCTION FN_BasariOrani(p_dogru INT, p_toplam INT) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    IF p_toplam = 0 OR p_toplam IS NULL THEN
        RETURN 0;
    END IF;
    RETURN ROUND((p_dogru * 100.0) / p_toplam, 2);
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 6. FN_SonrakiXPSeviye
-- Amaç: Bir sonraki seviyeye kaç XP kaldığını hesaplar
-- Kullanım: SELECT FN_SonrakiXPSeviye(3500); -- Sonuç: 1500 (5000 - 3500)
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_SonrakiXPSeviye;

DELIMITER //
CREATE FUNCTION FN_SonrakiXPSeviye(p_xp INT) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_sonraki_esik INT;
    
    SET v_sonraki_esik = CASE
        WHEN p_xp < 1000 THEN 1000
        WHEN p_xp < 5000 THEN 5000
        WHEN p_xp < 15000 THEN 15000
        WHEN p_xp < 30000 THEN 30000
        ELSE NULL -- Zaten EFSANE seviyesinde
    END;
    
    IF v_sonraki_esik IS NULL THEN
        RETURN 0; -- Maksimum seviye
    END IF;
    
    RETURN v_sonraki_esik - p_xp;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 7. FN_TaksitDurumu
-- Amaç: Vade tarihine göre taksit durumunu döndürür
-- Kullanım: SELECT FN_TaksitDurumu('2026-01-01'); 
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_TaksitDurumu;

DELIMITER //
CREATE FUNCTION FN_TaksitDurumu(p_vade_tarihi DATE) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_gun_farki INT;
    SET v_gun_farki = DATEDIFF(p_vade_tarihi, CURDATE());
    
    RETURN CASE
        WHEN v_gun_farki < -30 THEN 'KRITIK_GECIKME'
        WHEN v_gun_farki < 0 THEN 'GECIKTI'
        WHEN v_gun_farki <= 3 THEN 'YAKLASTI'
        WHEN v_gun_farki <= 7 THEN 'BU_HAFTA'
        ELSE 'NORMAL'
    END;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 8. FN_SinifSeviyesiTipi
-- Amaç: Sınıf seviyesine göre ortaokul/lise döndürür
-- Kullanım: SELECT FN_SinifSeviyesiTipi(8); -- Sonuç: ORTAOKUL
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS FN_SinifSeviyesiTipi;

DELIMITER //
CREATE FUNCTION FN_SinifSeviyesiTipi(p_seviye INT) 
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    RETURN CASE
        WHEN p_seviye >= 5 AND p_seviye <= 8 THEN 'ORTAOKUL'
        WHEN p_seviye >= 9 AND p_seviye <= 12 THEN 'LISE'
        ELSE 'BILINMIYOR'
    END;
END //
DELIMITER ;


-- ==========================================================================
-- OLUŞTURULAN FUNCTION'LARI GÖRÜNTÜLE
-- ==========================================================================
SHOW FUNCTION STATUS WHERE Db = DATABASE();
