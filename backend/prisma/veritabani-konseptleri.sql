-- ==========================================================================
-- EDURA VERİTABANI GELİŞMİŞ KONSEPTLER
-- HeidiSQL'de manuel olarak çalıştırılacak SQL dosyası
-- ==========================================================================
-- Bu dosya aşağıdaki veritabanı konseptlerini içerir:
-- 1. Stored Procedures (Saklı Yordamlar)
-- 2. Triggers (Tetikleyiciler)
-- 3. Views (Görünümler)
-- 4. Functions (Fonksiyonlar)
-- 5. Transactions (İşlemler) - Örnek kullanım
-- ==========================================================================

-- ==========================================================================
-- BÖLÜM 1: STORED PROCEDURES (SAKLI YORDAMLAR)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1.1 SP_OgrenciIstatistikleri: Bir öğrencinin tüm istatistiklerini getirir
-- Amaç: Tek bir sorgu ile öğrencinin performansını görüntüleme
-- Kullanım Alanı: Öğrenci profil sayfası, veli paneli
-- --------------------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE SP_OgrenciIstatistikleri(IN p_ogrenci_id VARCHAR(36))
BEGIN
    DECLARE v_toplam_odev INT DEFAULT 0;
    DECLARE v_teslim_edilen_odev INT DEFAULT 0;
    DECLARE v_ortalama_puan DECIMAL(5,2) DEFAULT 0;
    DECLARE v_toplam_devamsizlik INT DEFAULT 0;
    DECLARE v_katililan_canli_ders INT DEFAULT 0;
    
    -- Toplam ödev sayısı
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

-- Kullanım: CALL SP_OgrenciIstatistikleri('ogrenci-uuid');

-- --------------------------------------------------------------------------
-- 1.2 SP_SinifBasariRaporu: Bir sınıfın genel başarı raporunu getirir
-- Amaç: Sınıf bazlı performans analizi
-- Kullanım Alanı: Öğretmen paneli, müdür raporları
-- --------------------------------------------------------------------------
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

-- Kullanım: CALL SP_SinifBasariRaporu('sinif-uuid');

-- --------------------------------------------------------------------------
-- 1.3 SP_GecikmisTaksitlariGetir: Vadesi geçmiş taksitleri listeler
-- Amaç: Ödeme takibi ve hatırlatma sistemi
-- Kullanım Alanı: Sekreter paneli, ödeme uyarıları
-- --------------------------------------------------------------------------
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

-- Kullanım: CALL SP_GecikmisTaksitlariGetir('kurs-uuid');

-- --------------------------------------------------------------------------
-- 1.4 SP_XPVeRozetGuncelle: Öğrencinin XP'sini günceller ve rozet kontrolü yapar
-- Amaç: Gamification sisteminin otomatik yönetimi
-- Kullanım Alanı: Her aktivite sonrası çağrılır
-- --------------------------------------------------------------------------
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
        CASE WHEN v_mevcut_seviye != v_yeni_seviye THEN 1 ELSE 0 END AS SeviyeAtladi;
END //
DELIMITER ;

-- Kullanım: CALL SP_XPVeRozetGuncelle('ogrenci-uuid', 50, 'ODEV_TESLIM');

-- --------------------------------------------------------------------------
-- 1.5 SP_AylikGelirRaporu: Aylık gelir özetini hesaplar
-- Amaç: Finansal raporlama
-- Kullanım Alanı: Müdür/Admin paneli, mali raporlar
-- --------------------------------------------------------------------------
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

-- Kullanım: CALL SP_AylikGelirRaporu('kurs-uuid', 2026, 1);


-- ==========================================================================
-- BÖLÜM 2: TRIGGERS (TETİKLEYİCİLER)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 2.1 TR_OdevTeslimXP: Ödev tesliminde otomatik XP kazandırma
-- Amaç: Öğrenci her ödev teslim ettiğinde otomatik XP kazanır
-- --------------------------------------------------------------------------
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
    
    -- XP güncelle
    UPDATE User 
    SET xpPuani = xpPuani + v_xp_miktar,
        toplamTeslimOdev = toplamTeslimOdev + 1,
        sonAktiviteTarihi = NOW()
    WHERE id = NEW.ogrenciId;
END //
DELIMITER ;

-- --------------------------------------------------------------------------
-- 2.2 TR_OdevDegerlendirmeXP: Ödev değerlendirildiğinde XP hesaplama
-- Amaç: Yüksek puan alan öğrencilere bonus XP
-- --------------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER TR_OdevDegerlendirmeXP
AFTER UPDATE ON OdevTeslim
FOR EACH ROW
BEGIN
    DECLARE v_bonus_xp INT DEFAULT 0;
    DECLARE v_max_puan INT;
    
    -- Sadece durum DEGERLENDIRILDI olduğunda
    IF NEW.durum = 'DEGERLENDIRILDI' AND OLD.durum != 'DEGERLENDIRILDI' THEN
        -- Max puanı al
        SELECT maxPuan INTO v_max_puan FROM Odev WHERE id = NEW.odevId;
        
        -- Puan yüzdesine göre bonus XP
        IF NEW.puan >= (v_max_puan * 0.9) THEN
            SET v_bonus_xp = 50; -- %90+ puan için
        ELSEIF NEW.puan >= (v_max_puan * 0.7) THEN
            SET v_bonus_xp = 30; -- %70-89 puan için
        ELSEIF NEW.puan >= (v_max_puan * 0.5) THEN
            SET v_bonus_xp = 15; -- %50-69 puan için
        END IF;
        
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
-- 2.3 TR_CanliDersKatilimXP: Canlı derse katılımda XP kazandırma
-- Amaç: Canlı derslere katılımı teşvik etme
-- --------------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER TR_CanliDersKatilimXP
AFTER INSERT ON CanliDersKatilim
FOR EACH ROW
BEGIN
    -- 25 XP kazandır
    UPDATE User 
    SET xpPuani = xpPuani + 25,
        toplamKatilinanDers = toplamKatilinanDers + 1,
        sonAktiviteTarihi = NOW()
    WHERE id = NEW.ogrenciId;
END //
DELIMITER ;

-- --------------------------------------------------------------------------
-- 2.4 TR_OdemeGecikmeKontrol: Ödeme vadesi geçtiğinde otomatik durum güncelleme
-- Amaç: Gecikmiş ödemelerin otomatik işaretlenmesi
-- --------------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER TR_OdemeVadeGuncelle
BEFORE UPDATE ON Odeme
FOR EACH ROW
BEGIN
    -- Vade tarihi geçmiş ve hala BEKLEMEDE ise GECIKTI yap
    IF NEW.vadeTarihi < CURDATE() AND NEW.durum = 'BEKLEMEDE' THEN
        SET NEW.durum = 'GECIKTI';
    END IF;
END //
DELIMITER ;

-- --------------------------------------------------------------------------
-- 2.5 TR_YeniOgrenciHosgeldin: Yeni öğrenci kaydında hoşgeldin bildirimi
-- Amaç: Otomasyon ve kullanıcı deneyimi iyileştirme
-- --------------------------------------------------------------------------
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
            'Hoş Geldiniz!',
            CONCAT('Merhaba ', NEW.ad, '! Edura ailesine hoş geldiniz. Başarılarla dolu bir eğitim dönemi diliyoruz.'),
            0,
            NOW(),
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- --------------------------------------------------------------------------
-- 2.6 TR_StreakGuncelle: Günlük aktivite sonrası streak güncelleme
-- Amaç: Gamification - sürekli katılımı ödüllendirme
-- --------------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER TR_StreakGuncelle
BEFORE UPDATE ON User
FOR EACH ROW
BEGIN
    -- Sadece son aktivite tarihi güncellendiyse
    IF NEW.sonAktiviteTarihi IS NOT NULL AND 
       (OLD.sonAktiviteTarihi IS NULL OR DATE(NEW.sonAktiviteTarihi) != DATE(OLD.sonAktiviteTarihi)) THEN
        
        -- Bugün zaten aktivite yapıldıysa streak artır
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
-- 2.7 TR_SinavSonucuOtomatikHesapla: Sınav tamamlandığında sonuç hesaplama
-- Amaç: Sınav sonuçlarının otomatik hesaplanması
-- --------------------------------------------------------------------------
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


-- ==========================================================================
-- BÖLÜM 3: VIEWS (GÖRÜNÜMLER)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 3.1 VW_OgrenciOzet: Öğrencilerin özet bilgilerini gösteren görünüm
-- Amaç: Sık kullanılan öğrenci bilgilerini tek sorguda alma
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_OgrenciOzet AS
SELECT 
    u.id,
    u.ad,
    u.soyad,
    CONCAT(u.ad, ' ', u.soyad) AS tamAd,
    u.email,
    u.ogrenciNo,
    s.ad AS sinifAdi,
    s.seviye AS sinifSeviyesi,
    k.ad AS kursAdi,
    u.xpPuani,
    u.xpSeviye,
    u.streak,
    u.enYuksekStreak,
    u.toplamCozulenSoru,
    u.toplamDogruCevap,
    u.toplamTeslimOdev,
    u.toplamKatilinanDers,
    ROUND((u.toplamDogruCevap * 100.0) / NULLIF(u.toplamCozulenSoru, 0), 2) AS basariOrani,
    u.sonAktiviteTarihi,
    u.aktif,
    u.createdAt
FROM User u
LEFT JOIN Sinif s ON s.id = u.sinifId
LEFT JOIN Kurs k ON k.id = u.kursId
WHERE u.role = 'ogrenci';

-- Kullanım: SELECT * FROM VW_OgrenciOzet WHERE kursAdi = 'Edura Merkez';

-- --------------------------------------------------------------------------
-- 3.2 VW_OdevDurumOzet: Ödevlerin durum özetini gösteren görünüm
-- Amaç: Öğretmenler için ödev takibi
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_OdevDurumOzet AS
SELECT 
    o.id AS odevId,
    o.baslik,
    o.sonTeslimTarihi,
    c.ad AS dersAdi,
    CONCAT(og.ad, ' ', og.soyad) AS ogretmenAdi,
    s.ad AS sinifAdi,
    COUNT(DISTINCT u.id) AS toplamOgrenci,
    COUNT(DISTINCT ot.ogrenciId) AS teslimEden,
    COUNT(DISTINCT CASE WHEN ot.durum = 'DEGERLENDIRILDI' THEN ot.ogrenciId END) AS degerlendirilen,
    COUNT(DISTINCT CASE WHEN ot.gecTeslimMi = 1 THEN ot.ogrenciId END) AS gecTeslim,
    ROUND(COUNT(DISTINCT ot.ogrenciId) * 100.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) AS teslimOrani,
    ROUND(AVG(ot.puan), 2) AS ortalamaPuan,
    CASE 
        WHEN o.sonTeslimTarihi < NOW() THEN 'SURESI_DOLDU'
        WHEN o.sonTeslimTarihi < DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 'SON_GUN'
        ELSE 'AKTIF'
    END AS odevDurumu
FROM Odev o
JOIN Ders c ON c.id = o.courseId
JOIN User og ON og.id = o.ogretmenId
JOIN Sinif s ON s.id = c.sinifId
LEFT JOIN User u ON u.sinifId = s.id AND u.role = 'ogrenci' AND u.aktif = 1
LEFT JOIN OdevTeslim ot ON ot.odevId = o.id
WHERE o.aktif = 1 AND o.taslak = 0
GROUP BY o.id, o.baslik, o.sonTeslimTarihi, c.ad, og.ad, og.soyad, s.ad;

-- Kullanım: SELECT * FROM VW_OdevDurumOzet WHERE sinifAdi = '8-A';

-- --------------------------------------------------------------------------
-- 3.3 VW_GunlukAktivite: Günlük sistem aktivitelerini gösteren görünüm
-- Amaç: Admin/Müdür için günlük özet
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_GunlukAktivite AS
SELECT 
    DATE(NOW()) AS tarih,
    (SELECT COUNT(*) FROM OdevTeslim WHERE DATE(createdAt) = DATE(NOW())) AS bugunTeslimEdilenOdev,
    (SELECT COUNT(*) FROM SinavOturumu WHERE DATE(createdAt) = DATE(NOW())) AS bugunGirilenSinav,
    (SELECT COUNT(*) FROM CanliDersKatilim WHERE DATE(girisZamani) = DATE(NOW())) AS bugunCanliDersKatilim,
    (SELECT COUNT(*) FROM Message WHERE DATE(createdAt) = DATE(NOW())) AS bugunGonderilenMesaj,
    (SELECT COUNT(*) FROM Odeme WHERE DATE(odemeTarihi) = DATE(NOW()) AND durum = 'ODENDI') AS bugunYapilanOdeme,
    (SELECT IFNULL(SUM(tutar), 0) FROM Odeme WHERE DATE(odemeTarihi) = DATE(NOW()) AND durum = 'ODENDI') AS bugunToplamGelir,
    (SELECT COUNT(*) FROM User WHERE DATE(createdAt) = DATE(NOW())) AS bugunYeniKayit,
    (SELECT COUNT(*) FROM GununSorusuCevap WHERE DATE(createdAt) = DATE(NOW())) AS bugunCozulenGunSorusu;

-- Kullanım: SELECT * FROM VW_GunlukAktivite;

-- --------------------------------------------------------------------------
-- 3.4 VW_KursPerformans: Kurs bazlı performans özeti
-- Amaç: Kurslar arası karşılaştırma
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_KursPerformans AS
SELECT 
    k.id AS kursId,
    k.ad AS kursAdi,
    COUNT(DISTINCT CASE WHEN u.role = 'ogrenci' THEN u.id END) AS toplamOgrenci,
    COUNT(DISTINCT CASE WHEN u.role = 'ogretmen' THEN u.id END) AS toplamOgretmen,
    COUNT(DISTINCT s.id) AS toplamSinif,
    ROUND(AVG(CASE WHEN u.role = 'ogrenci' THEN u.xpPuani END), 2) AS ortalamaXP,
    ROUND(AVG(CASE WHEN u.role = 'ogrenci' THEN u.streak END), 2) AS ortalamaStreak,
    MAX(CASE WHEN u.role = 'ogrenci' THEN u.enYuksekStreak END) AS enYuksekStreak,
    ROUND(AVG(CASE WHEN u.role = 'ogrenci' AND u.toplamCozulenSoru > 0 
              THEN (u.toplamDogruCevap * 100.0 / u.toplamCozulenSoru) END), 2) AS ortalamaBasari
FROM Kurs k
LEFT JOIN User u ON u.kursId = k.id AND u.aktif = 1
LEFT JOIN Sinif s ON s.kursId = k.id AND s.aktif = 1
WHERE k.aktif = 1
GROUP BY k.id, k.ad;

-- Kullanım: SELECT * FROM VW_KursPerformans ORDER BY ortalamaXP DESC;

-- --------------------------------------------------------------------------
-- 3.5 VW_OdemeOzet: Ödeme durumlarının özeti
-- Amaç: Finansal durum takibi
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_OdemeOzet AS
SELECT 
    k.ad AS kursAdi,
    DATE_FORMAT(o.vadeTarihi, '%Y-%m') AS donem,
    COUNT(*) AS toplamTaksit,
    SUM(CASE WHEN o.durum = 'ODENDI' THEN 1 ELSE 0 END) AS odenenTaksit,
    SUM(CASE WHEN o.durum = 'BEKLEMEDE' THEN 1 ELSE 0 END) AS bekleyenTaksit,
    SUM(CASE WHEN o.durum = 'GECIKTI' THEN 1 ELSE 0 END) AS gecikenTaksit,
    SUM(CASE WHEN o.durum = 'ODENDI' THEN o.tutar ELSE 0 END) AS toplamTahsilat,
    SUM(CASE WHEN o.durum = 'BEKLEMEDE' THEN o.tutar ELSE 0 END) AS bekleyenTutar,
    SUM(CASE WHEN o.durum = 'GECIKTI' THEN o.tutar ELSE 0 END) AS gecikenTutar,
    ROUND(SUM(CASE WHEN o.durum = 'ODENDI' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS tahsilatOrani
FROM Odeme o
JOIN User u ON u.id = o.ogrenciId
JOIN Kurs k ON k.id = u.kursId
GROUP BY k.ad, DATE_FORMAT(o.vadeTarihi, '%Y-%m')
ORDER BY donem DESC;

-- Kullanım: SELECT * FROM VW_OdemeOzet WHERE kursAdi = 'Edura Merkez';


-- ==========================================================================
-- BÖLÜM 4: FUNCTIONS (FONKSİYONLAR)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 4.1 FN_XPSeviyeHesapla: XP'ye göre seviye hesaplayan fonksiyon
-- --------------------------------------------------------------------------
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

-- Kullanım: SELECT FN_XPSeviyeHesapla(7500); -- Sonuç: USTA

-- --------------------------------------------------------------------------
-- 4.2 FN_NetHesapla: Deneme sınavı net hesaplama (4 yanlış 1 doğruyu götürür)
-- --------------------------------------------------------------------------
DELIMITER //
CREATE FUNCTION FN_NetHesapla(p_dogru INT, p_yanlis INT) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    RETURN p_dogru - (p_yanlis / 4.0);
END //
DELIMITER ;

-- Kullanım: SELECT FN_NetHesapla(30, 8); -- Sonuç: 28.00

-- --------------------------------------------------------------------------
-- 4.3 FN_OgrenciYas: Öğrencinin yaşını hesaplayan fonksiyon
-- --------------------------------------------------------------------------
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

-- Kullanım: SELECT FN_OgrenciYas('2010-05-15'); -- Sonuç: 15


-- ==========================================================================
-- BÖLÜM 5: TRANSACTION ÖRNEKLERI
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 5.1 Öğrenci Kayıt İşlemi Transaction Örneği
-- Amaç: Birden fazla tabloya tutarlı veri ekleme
-- NOT: Bu bir örnek koddur, uygulama kodunda kullanılır
-- --------------------------------------------------------------------------

-- Örnek Transaction: Yeni Öğrenci Kaydı
/*
START TRANSACTION;

-- 1. Öğrenciyi User tablosuna ekle
INSERT INTO User (id, email, password, ad, soyad, role, kursId, sinifId, createdAt, updatedAt)
VALUES (UUID(), 'ogrenci@email.com', 'hashed_password', 'Ali', 'Veli', 'ogrenci', 'kurs-id', 'sinif-id', NOW(), NOW());

SET @ogrenci_id = LAST_INSERT_ID();

-- 2. Ödeme planı oluştur
INSERT INTO OdemePlani (id, ogrenciId, donemAd, toplamTutar, taksitSayisi, taksitTutari, olusturanId, createdAt, updatedAt)
VALUES (UUID(), @ogrenci_id, '2025-2026 Güz', 12000, 8, 1500, 'sekreter-id', NOW(), NOW());

SET @plan_id = LAST_INSERT_ID();

-- 3. Taksit ödemelerini oluştur
INSERT INTO Odeme (id, odemePlaniId, ogrenciId, tip, tutar, durum, taksitNo, vadeTarihi, createdAt, updatedAt)
VALUES 
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 1, '2025-09-01', NOW(), NOW()),
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 2, '2025-10-01', NOW(), NOW()),
    (UUID(), @plan_id, @ogrenci_id, 'TAKSIT', 1500, 'BEKLEMEDE', 3, '2025-11-01', NOW(), NOW());
    -- ... diğer taksitler

-- 4. Ders kayıtlarını oluştur
INSERT INTO DersKayit (id, ogrenciId, dersId, createdAt, updatedAt)
SELECT UUID(), @ogrenci_id, d.id, NOW(), NOW()
FROM Ders d
WHERE d.sinifId = 'sinif-id';

-- Herşey başarılı ise commit
COMMIT;

-- Hata durumunda rollback
-- ROLLBACK;
*/

-- --------------------------------------------------------------------------
-- 5.2 Ödeme İşlemi Transaction Örneği
-- Amaç: Ödeme yapılırken tutarlılık sağlama
-- --------------------------------------------------------------------------

/*
START TRANSACTION;

-- 1. Ödeme durumunu güncelle
UPDATE Odeme 
SET durum = 'ODENDI', 
    odemeTarihi = NOW(),
    odemeYontemi = 'KREDI_KARTI',
    onaylayanId = 'sekreter-id',
    updatedAt = NOW()
WHERE id = 'odeme-id';

-- 2. Kupon kullanıldıysa kullanım sayısını artır
UPDATE IndirimKuponu
SET kullanilanAdet = kullanilanAdet + 1,
    updatedAt = NOW()
WHERE id = 'kupon-id';

-- 3. Makbuz numarası oluştur ve kaydet
UPDATE Odeme
SET makbuzNo = CONCAT('EDU-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'))
WHERE id = 'odeme-id';

COMMIT;
*/


-- ==========================================================================
-- BÖLÜM 6: INDEXES (PERFORMANS İÇİN EK İNDEXLER)
-- ==========================================================================

-- Sık yapılan sorguları hızlandırmak için ek indexler
CREATE INDEX IF NOT EXISTS idx_user_role_kurs ON User(role, kursId);
CREATE INDEX IF NOT EXISTS idx_user_role_aktif ON User(role, aktif);
CREATE INDEX IF NOT EXISTS idx_odev_sonTeslim ON Odev(sonTeslimTarihi, aktif);
CREATE INDEX IF NOT EXISTS idx_odeme_durum_vade ON Odeme(durum, vadeTarihi);
CREATE INDEX IF NOT EXISTS idx_canliderskatilim_tarih ON CanliDersKatilim(girisZamani);


-- ==========================================================================
-- TEST SORGULARI - Bu sorguları HeidiSQL'de test edebilirsiniz
-- ==========================================================================

-- Stored Procedure test:
-- CALL SP_OgrenciIstatistikleri('bir-ogrenci-uuid');
-- CALL SP_SinifBasariRaporu('bir-sinif-uuid');

-- View test:
-- SELECT * FROM VW_OgrenciOzet LIMIT 10;
-- SELECT * FROM VW_OdevDurumOzet LIMIT 10;
-- SELECT * FROM VW_GunlukAktivite;
-- SELECT * FROM VW_KursPerformans;

-- Function test:
-- SELECT FN_XPSeviyeHesapla(7500);
-- SELECT FN_NetHesapla(30, 8);


-- ==========================================================================
-- NOTLAR
-- ==========================================================================
/*
1. Bu dosyadaki SQL kodları HeidiSQL'de sırayla çalıştırılabilir.
2. DELIMITER komutları HeidiSQL'de çalışır.
3. Triggers otomatik olarak çalışır, manuel müdahale gerektirmez.
4. Views normal tablo gibi SELECT ile sorgulanabilir.
5. Stored Procedures CALL komutu ile çağrılır.
6. Functions SELECT içinde kullanılabilir.
*/

