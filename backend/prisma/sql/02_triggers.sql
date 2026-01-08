-- ==========================================================================
-- EDURA - TRIGGERS (TETİKLEYİCİLER)
-- HeidiSQL Sorgu Sekmesi 2
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. TR_OdevTeslimXP
-- Ne Zaman: Ödev teslim edildiğinde (INSERT)
-- Ne Yapar: Öğrenciye otomatik XP kazandırır
-- Zamanında teslim: 30 XP | Geç teslim: 20 XP
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_OdevTeslimXP;

DELIMITER //
CREATE TRIGGER TR_OdevTeslimXP
AFTER INSERT ON OdevTeslim
FOR EACH ROW
BEGIN
    DECLARE v_xp_miktar INT DEFAULT 20;
    
    -- Zamanında teslim için bonus XP
    IF NEW.gecTeslimMi = 0 THEN
        SET v_xp_miktar = 30;
    END IF;
    
    -- XP güncelle ve istatistikleri artır
    UPDATE User 
    SET xpPuani = xpPuani + v_xp_miktar,
        toplamTeslimOdev = toplamTeslimOdev + 1,
        sonAktiviteTarihi = NOW()
    WHERE id = NEW.ogrenciId;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 2. TR_OdevDegerlendirmeXP
-- Ne Zaman: Ödev değerlendirildiğinde (UPDATE)
-- Ne Yapar: Yüksek puan alanlara bonus XP verir
-- %90+: 50 XP | %70-89: 30 XP | %50-69: 15 XP
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_OdevDegerlendirmeXP;

DELIMITER //
CREATE TRIGGER TR_OdevDegerlendirmeXP
AFTER UPDATE ON OdevTeslim
FOR EACH ROW
BEGIN
    DECLARE v_bonus_xp INT DEFAULT 0;
    DECLARE v_max_puan INT;
    
    -- Sadece durum DEGERLENDIRILDI olduğunda çalış
    IF NEW.durum = 'DEGERLENDIRILDI' AND OLD.durum != 'DEGERLENDIRILDI' THEN
        -- Ödevin max puanını al
        SELECT maxPuan INTO v_max_puan FROM Odev WHERE id = NEW.odevId;
        
        -- Puan yüzdesine göre bonus XP hesapla
        IF NEW.puan >= (v_max_puan * 0.9) THEN
            SET v_bonus_xp = 50; -- %90+ puan için
        ELSEIF NEW.puan >= (v_max_puan * 0.7) THEN
            SET v_bonus_xp = 30; -- %70-89 puan için
        ELSEIF NEW.puan >= (v_max_puan * 0.5) THEN
            SET v_bonus_xp = 15; -- %50-69 puan için
        END IF;
        
        -- Bonus XP varsa uygula
        IF v_bonus_xp > 0 THEN
            UPDATE User 
            SET xpPuani = xpPuani + v_bonus_xp,
                toplamDogruCevap = toplamDogruCevap + 1
            WHERE id = NEW.ogrenciId;
        END IF;
    END IF;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 3. TR_CanliDersKatilimXP
-- Ne Zaman: Canlı derse katılım kaydı eklendiğinde (INSERT)
-- Ne Yapar: 25 XP kazandırır ve katılım sayısını artırır
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_CanliDersKatilimXP;

DELIMITER //
CREATE TRIGGER TR_CanliDersKatilimXP
AFTER INSERT ON CanliDersKatilim
FOR EACH ROW
BEGIN
    -- 25 XP kazandır ve istatistikleri güncelle
    UPDATE User 
    SET xpPuani = xpPuani + 25,
        toplamKatilinanDers = toplamKatilinanDers + 1,
        sonAktiviteTarihi = NOW()
    WHERE id = NEW.ogrenciId;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 4. TR_YeniOgrenciHosgeldin
-- Ne Zaman: Yeni kullanıcı eklendiğinde (INSERT)
-- Ne Yapar: Öğrenci ise hoşgeldin bildirimi oluşturur
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_YeniOgrenciHosgeldin;

DELIMITER //
CREATE TRIGGER TR_YeniOgrenciHosgeldin
AFTER INSERT ON User
FOR EACH ROW
BEGIN
    -- Sadece öğrenci rolü için
    IF NEW.role = 'ogrenci' THEN
        -- Hoşgeldin bildirimi oluştur
        INSERT INTO Notification (id, userId, tip, baslik, mesaj, okundu, createdAt, updatedAt)
        VALUES (
            UUID(),
            NEW.id,
            'BILDIRIM',
            'Hoş Geldiniz! 🎉',
            CONCAT('Merhaba ', NEW.ad, '! Edura ailesine hoş geldiniz. Başarılarla dolu bir eğitim dönemi diliyoruz.'),
            0,
            NOW(),
            NOW()
        );
    END IF;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 5. TR_StreakGuncelle
-- Ne Zaman: User tablosu güncellendiğinde (BEFORE UPDATE)
-- Ne Yapar: Ardışık gün aktivitesi varsa streak artırır, yoksa sıfırlar
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_StreakGuncelle;

DELIMITER //
CREATE TRIGGER TR_StreakGuncelle
BEFORE UPDATE ON User
FOR EACH ROW
BEGIN
    -- Sadece son aktivite tarihi güncellendiyse kontrol et
    IF NEW.sonAktiviteTarihi IS NOT NULL AND 
       (OLD.sonAktiviteTarihi IS NULL OR DATE(NEW.sonAktiviteTarihi) != DATE(OLD.sonAktiviteTarihi)) THEN
        
        -- Ardışık gün kontrolü
        IF OLD.sonAktiviteTarihi IS NULL OR 
           DATEDIFF(DATE(NEW.sonAktiviteTarihi), DATE(OLD.sonAktiviteTarihi)) = 1 THEN
            -- Ardışık gün - streak artır
            SET NEW.streak = OLD.streak + 1;
            
            -- En yüksek streak kontrolü
            IF NEW.streak > OLD.enYuksekStreak THEN
                SET NEW.enYuksekStreak = NEW.streak;
            END IF;
        ELSEIF DATEDIFF(DATE(NEW.sonAktiviteTarihi), DATE(OLD.sonAktiviteTarihi)) > 1 THEN
            -- Gün atlandı - streak sıfırla
            SET NEW.streak = 1;
        END IF;
    END IF;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 6. TR_SinavSonucuHesapla
-- Ne Zaman: Sınav oturumu tamamlandı olarak işaretlendiğinde (BEFORE UPDATE)
-- Ne Yapar: Doğru/yanlış/boş sayısını ve yüzdeyi otomatik hesaplar
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_SinavSonucuHesapla;

DELIMITER //
CREATE TRIGGER TR_SinavSonucuHesapla
BEFORE UPDATE ON SinavOturumu
FOR EACH ROW
BEGIN
    DECLARE v_dogru INT DEFAULT 0;
    DECLARE v_yanlis INT DEFAULT 0;
    DECLARE v_bos INT DEFAULT 0;
    DECLARE v_toplam_soru INT DEFAULT 0;
    DECLARE v_toplam_puan INT DEFAULT 0;
    
    -- Sadece tamamlandi true olduğunda hesapla
    IF NEW.tamamlandi = 1 AND OLD.tamamlandi = 0 THEN
        -- Cevapları hesapla
        SELECT 
            COUNT(CASE WHEN dogruMu = 1 THEN 1 END),
            COUNT(CASE WHEN dogruMu = 0 THEN 1 END),
            COUNT(CASE WHEN cevap IS NULL THEN 1 END),
            SUM(IFNULL(alinanPuan, 0))
        INTO v_dogru, v_yanlis, v_bos, v_toplam_puan
        FROM SinavCevap 
        WHERE oturumId = NEW.id;
        
        -- Toplam soru sayısı
        SELECT COUNT(*) INTO v_toplam_soru
        FROM OnlineSoru WHERE sinavId = NEW.sinavId;
        
        -- Değerleri ata
        SET NEW.dogruSayisi = v_dogru;
        SET NEW.yanlisSayisi = v_yanlis;
        SET NEW.bosSayisi = v_toplam_soru - v_dogru - v_yanlis;
        SET NEW.toplamPuan = v_toplam_puan;
        SET NEW.yuzde = ROUND((v_dogru * 100.0) / NULLIF(v_toplam_soru, 0), 2);
        SET NEW.bitisZamani = NOW();
    END IF;
END //
DELIMITER ;


-- --------------------------------------------------------------------------
-- 7. TR_GunSorusuXP
-- Ne Zaman: Günün sorusu cevaplandiğında (INSERT)
-- Ne Yapar: Doğru cevap için XP kazandırır
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS TR_GunSorusuXP;

DELIMITER //
CREATE TRIGGER TR_GunSorusuXP
AFTER INSERT ON GununSorusuCevap
FOR EACH ROW
BEGIN
    -- Sadece doğru cevap için XP kazandır
    IF NEW.dogruMu = 1 THEN
        UPDATE User 
        SET xpPuani = xpPuani + NEW.kazanilanXp,
            toplamCozulenSoru = toplamCozulenSoru + 1,
            toplamDogruCevap = toplamDogruCevap + 1,
            sonAktiviteTarihi = NOW()
        WHERE id = NEW.userId;
    ELSE
        -- Yanlış cevap da soru çözme sayısına eklenir
        UPDATE User 
        SET toplamCozulenSoru = toplamCozulenSoru + 1,
            sonAktiviteTarihi = NOW()
        WHERE id = NEW.userId;
    END IF;
END //
DELIMITER ;


-- ==========================================================================
-- OLUŞTURULAN TRIGGER'LARI GÖRÜNTÜLE
-- ==========================================================================
SHOW TRIGGERS;
