-- ==========================================================================
-- EDURA - STORED PROCEDURES (SAKLI YORDAMLAR)
-- HeidiSQL Sorgu Sekmesi 1
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. SP_OgrenciIstatistikleri
-- Amaç: Bir öğrencinin tüm istatistiklerini tek sorguda getirir
-- Kullanım: CALL SP_OgrenciIstatistikleri('ogrenci-uuid');
-- --------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_OgrenciIstatistikleri;

DELIMITER //
CREATE PROCEDURE SP_OgrenciIstatistikleri(IN p_ogrenci_id VARCHAR(36))
BEGIN
    DECLARE v_toplam_odev INT DEFAULT 0;
    DECLARE v_teslim_edilen_odev INT DEFAULT 0;
    DECLARE v_ortalama_puan DECIMAL(5,2) DEFAULT 0;
    DECLARE v_toplam_devamsizlik INT DEFAULT 0;
    DECLARE v_katililan_canli_ders INT DEFAULT 0;
    
    -- Toplam ödev sayısı (öğrencinin kayıtlı olduğu derslerdeki ödevler)
    SELECT COUNT(*) INTO v_toplam_odev 
    FROM Odev o
    JOIN DersKayit dk ON dk.dersId = o.courseId
    WHERE dk.ogrenciId = p_ogrenci_id AND o.aktif = 1;
    
    -- Teslim edilen ödev sayısı
    SELECT COUNT(*) INTO v_teslim_edilen_odev 
    FROM OdevTeslim 
    WHERE ogrenciId = p_ogrenci_id AND durum != 'BEKLEMEDE';
    
    -- Ortalama ödev puanı
    SELECT IFNULL(AVG(puan), 0) INTO v_ortalama_puan 
    FROM OdevTeslim 
    WHERE ogrenciId = p_ogrenci_id AND puan IS NOT NULL;
    
    -- Toplam devamsızlık
    SELECT COUNT(*) INTO v_toplam_devamsizlik 
    FROM Devamsizlik 
    WHERE ogrenciId = p_ogrenci_id;
    
    -- Katılınan canlı ders sayısı
    SELECT COUNT(*) INTO v_katililan_canli_ders 
    FROM CanliDersKatilim 
    WHERE ogrenciId = p_ogrenci_id;
    
    -- Sonuçları döndür
    SELECT 
        v_toplam_odev AS ToplamOdev,
        v_teslim_edilen_odev AS TeslimEdilenOdev,
        ROUND((v_teslim_edilen_odev / NULLIF(v_toplam_odev, 0)) * 100, 2) AS OdevTeslimOrani,
        v_ortalama_puan AS OrtalamaPuan,
        v_toplam_devamsizlik AS ToplamDevamsizlik,
        v_katililan_canli_ders AS KatilinanCanliDers;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 2. SP_SinifBasariRaporu
-- Amaç: Bir sınıfın genel başarı raporunu getirir
-- Kullanım: CALL SP_SinifBasariRaporu('sinif-uuid');
-- --------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_SinifBasariRaporu;

DELIMITER //
CREATE PROCEDURE SP_SinifBasariRaporu(IN p_sinif_id VARCHAR(36))
BEGIN
    SELECT 
        s.ad AS SinifAdi,
        COUNT(DISTINCT u.id) AS ToplamOgrenci,
        ROUND(AVG(u.xpPuani), 2) AS OrtalamaXP,
        ROUND(AVG(u.toplamDogruCevap * 100 / NULLIF(u.toplamCozulenSoru, 0)), 2) AS BasariOrani,
        SUM(CASE WHEN u.streak > 0 THEN 1 ELSE 0 END) AS AktifStreakSayisi,
        MAX(u.enYuksekStreak) AS EnYuksekStreak,
        ROUND(AVG(u.toplamTeslimOdev), 2) AS OrtalamaOdevTeslim,
        ROUND(AVG(u.toplamKatilinanDers), 2) AS OrtalamaKatilinanDers
    FROM Sinif s
    LEFT JOIN User u ON u.sinifId = s.id AND u.role = 'ogrenci'
    WHERE s.id = p_sinif_id
    GROUP BY s.id, s.ad;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 3. SP_GecikmisTaksitlariGetir
-- Amaç: Vadesi geçmiş taksitleri listeler
-- Kullanım: CALL SP_GecikmisTaksitlariGetir('kurs-uuid');
-- --------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_GecikmisTaksitlariGetir;

DELIMITER //
CREATE PROCEDURE SP_GecikmisTaksitlariGetir(IN p_kurs_id VARCHAR(36))
BEGIN
    SELECT 
        u.ad AS OgrenciAd,
        u.soyad AS OgrenciSoyad,
        u.telefon AS OgrenciTelefon,
        u.veliTelefon AS VeliTelefon,
        o.tutar AS TaksitTutari,
        o.vadeTarihi AS VadeTarihi,
        DATEDIFF(CURDATE(), o.vadeTarihi) AS GecikmeGun,
        o.taksitNo AS TaksitNo,
        op.donemAd AS DonemAdi
    FROM Odeme o
    JOIN User u ON u.id = o.ogrenciId
    LEFT JOIN OdemePlani op ON op.id = o.odemePlaniId
    WHERE o.durum = 'BEKLEMEDE' 
      AND o.vadeTarihi < CURDATE()
      AND u.kursId = p_kurs_id
    ORDER BY o.vadeTarihi ASC;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 4. SP_XPVeRozetGuncelle
-- Amaç: Öğrencinin XP'sini günceller ve rozet kontrolü yapar
-- Kullanım: CALL SP_XPVeRozetGuncelle('ogrenci-uuid', 50, 'ODEV_TESLIM');
-- --------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_XPVeRozetGuncelle;

DELIMITER //
CREATE PROCEDURE SP_XPVeRozetGuncelle(
    IN p_ogrenci_id VARCHAR(36),
    IN p_kazanilan_xp INT,
    IN p_aktivite_tipi VARCHAR(50)
)
BEGIN
    DECLARE v_mevcut_xp INT;
    DECLARE v_yeni_xp INT;
    DECLARE v_mevcut_seviye VARCHAR(20);
    DECLARE v_yeni_seviye VARCHAR(20);
    
    -- Mevcut XP'yi al
    SELECT xpPuani, xpSeviye INTO v_mevcut_xp, v_mevcut_seviye
    FROM User WHERE id = p_ogrenci_id;
    
    -- Yeni XP hesapla
    SET v_yeni_xp = v_mevcut_xp + p_kazanilan_xp;
    
    -- Yeni seviyeyi belirle
    SET v_yeni_seviye = CASE
        WHEN v_yeni_xp >= 30000 THEN 'EFSANE'
        WHEN v_yeni_xp >= 15000 THEN 'UZMAN'
        WHEN v_yeni_xp >= 5000 THEN 'USTA'
        WHEN v_yeni_xp >= 1000 THEN 'CIRAK'
        ELSE 'BASLANGIC'
    END;
    
    -- XP ve seviyeyi güncelle
    UPDATE User 
    SET xpPuani = v_yeni_xp,
        xpSeviye = v_yeni_seviye,
        sonAktiviteTarihi = NOW()
    WHERE id = p_ogrenci_id;
    
    -- XP rozetlerini kontrol et ve ekle
    IF v_yeni_xp >= 1000 AND v_mevcut_xp < 1000 THEN
        INSERT IGNORE INTO Rozet (id, userId, tip, kazanilanXp, createdAt)
        VALUES (UUID(), p_ogrenci_id, 'XP_1000', 50, NOW());
    END IF;
    
    IF v_yeni_xp >= 5000 AND v_mevcut_xp < 5000 THEN
        INSERT IGNORE INTO Rozet (id, userId, tip, kazanilanXp, createdAt)
        VALUES (UUID(), p_ogrenci_id, 'XP_5000', 100, NOW());
    END IF;
    
    IF v_yeni_xp >= 10000 AND v_mevcut_xp < 10000 THEN
        INSERT IGNORE INTO Rozet (id, userId, tip, kazanilanXp, createdAt)
        VALUES (UUID(), p_ogrenci_id, 'XP_10000', 150, NOW());
    END IF;
    
    -- Sonuç döndür
    SELECT 
        v_mevcut_xp AS OncekiXP,
        v_yeni_xp AS YeniXP,
        p_kazanilan_xp AS KazanilanXP,
        v_mevcut_seviye AS OncekiSeviye,
        v_yeni_seviye AS YeniSeviye,
        CASE WHEN v_mevcut_seviye != v_yeni_seviye THEN 'EVET' ELSE 'HAYIR' END AS SeviyeAtladi;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 5. SP_AylikGelirRaporu
-- Amaç: Aylık gelir özetini hesaplar
-- Kullanım: CALL SP_AylikGelirRaporu('kurs-uuid', 2026, 1);
-- --------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS SP_AylikGelirRaporu;

DELIMITER //
CREATE PROCEDURE SP_AylikGelirRaporu(
    IN p_kurs_id VARCHAR(36),
    IN p_yil INT,
    IN p_ay INT
)
BEGIN
    SELECT 
        p_yil AS Yil,
        p_ay AS Ay,
        COUNT(CASE WHEN o.durum = 'ODENDI' THEN 1 END) AS OdenenTaksitSayisi,
        IFNULL(SUM(CASE WHEN o.durum = 'ODENDI' THEN o.tutar ELSE 0 END), 0) AS ToplamGelir,
        COUNT(CASE WHEN o.durum = 'BEKLEMEDE' THEN 1 END) AS BekleyenTaksitSayisi,
        IFNULL(SUM(CASE WHEN o.durum = 'BEKLEMEDE' THEN o.tutar ELSE 0 END), 0) AS BekleyenTutar,
        COUNT(CASE WHEN o.durum = 'GECIKTI' THEN 1 END) AS GecikenTaksitSayisi,
        IFNULL(SUM(CASE WHEN o.durum = 'GECIKTI' THEN o.tutar ELSE 0 END), 0) AS GecikenTutar,
        IFNULL(SUM(o.kuponIndirimi), 0) AS ToplamKuponIndirimi
    FROM Odeme o
    JOIN User u ON u.id = o.ogrenciId
    WHERE u.kursId = p_kurs_id
      AND YEAR(o.vadeTarihi) = p_yil
      AND MONTH(o.vadeTarihi) = p_ay;
END //
DELIMITER ;


-- ==========================================================================
-- OLUŞTURULAN PROCEDURE'LERI GÖRÜNTÜLE
-- ==========================================================================
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
