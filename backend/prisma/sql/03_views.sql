-- ==========================================================================
-- EDURA - VIEWS (GÖRÜNÜMLER)
-- HeidiSQL Sorgu Sekmesi 3
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. VW_OgrenciOzet
-- Amaç: Öğrencilerin özet bilgilerini tek bir görünümde toplar
-- Kullanım: SELECT * FROM VW_OgrenciOzet WHERE kursAdi = 'Edura Merkez';
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_OgrenciOzet;

CREATE VIEW VW_OgrenciOzet AS
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
    u.createdAt AS kayitTarihi
FROM User u
LEFT JOIN Sinif s ON s.id = u.sinifId
LEFT JOIN Kurs k ON k.id = u.kursId
WHERE u.role = 'ogrenci';


-- --------------------------------------------------------------------------
-- 2. VW_OdevDurumOzet
-- Amaç: Ödevlerin durum özetini gösterir (teslim oranları, ortalama puanlar)
-- Kullanım: SELECT * FROM VW_OdevDurumOzet WHERE sinifAdi = '8-A';
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_OdevDurumOzet;

CREATE VIEW VW_OdevDurumOzet AS
SELECT 
    o.id AS odevId,
    o.baslik,
    o.sonTeslimTarihi,
    d.ad AS dersAdi,
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
JOIN Ders d ON d.id = o.courseId
JOIN User og ON og.id = o.ogretmenId
JOIN Sinif s ON s.id = d.sinifId
LEFT JOIN User u ON u.sinifId = s.id AND u.role = 'ogrenci' AND u.aktif = 1
LEFT JOIN OdevTeslim ot ON ot.odevId = o.id
WHERE o.aktif = 1 AND o.taslak = 0
GROUP BY o.id, o.baslik, o.sonTeslimTarihi, d.ad, og.ad, og.soyad, s.ad;


-- --------------------------------------------------------------------------
-- 3. VW_GunlukAktivite
-- Amaç: Günlük sistem aktivitelerini özetler
-- Kullanım: SELECT * FROM VW_GunlukAktivite;
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_GunlukAktivite;

CREATE VIEW VW_GunlukAktivite AS
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


-- --------------------------------------------------------------------------
-- 4. VW_KursPerformans
-- Amaç: Kurs bazlı performans karşılaştırması
-- Kullanım: SELECT * FROM VW_KursPerformans ORDER BY ortalamaXP DESC;
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_KursPerformans;

CREATE VIEW VW_KursPerformans AS
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


-- --------------------------------------------------------------------------
-- 5. VW_OdemeOzet
-- Amaç: Ödeme durumlarının kurs ve dönem bazlı özeti
-- Kullanım: SELECT * FROM VW_OdemeOzet WHERE kursAdi = 'Edura Merkez';
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_OdemeOzet;

CREATE VIEW VW_OdemeOzet AS
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


-- --------------------------------------------------------------------------
-- 6. VW_OgretmenDersYuku
-- Amaç: Öğretmenlerin ders yüklerini gösterir
-- Kullanım: SELECT * FROM VW_OgretmenDersYuku ORDER BY toplamDers DESC;
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_OgretmenDersYuku;

CREATE VIEW VW_OgretmenDersYuku AS
SELECT 
    u.id AS ogretmenId,
    CONCAT(u.ad, ' ', u.soyad) AS ogretmenAdi,
    u.brans,
    k.ad AS kursAdi,
    COUNT(DISTINCT d.id) AS toplamDers,
    COUNT(DISTINCT d.sinifId) AS toplamSinif,
    COUNT(DISTINCT o.id) AS toplamOdev,
    COUNT(DISTINCT os.id) AS toplamSinav,
    COUNT(DISTINCT cd.id) AS toplamCanliDers
FROM User u
LEFT JOIN Kurs k ON k.id = u.kursId
LEFT JOIN Ders d ON d.ogretmenId = u.id AND d.aktif = 1
LEFT JOIN Odev o ON o.ogretmenId = u.id AND o.aktif = 1
LEFT JOIN OnlineSinav os ON os.ogretmenId = u.id
LEFT JOIN CanliDers cd ON cd.ogretmenId = u.id
WHERE u.role = 'ogretmen' AND u.aktif = 1
GROUP BY u.id, u.ad, u.soyad, u.brans, k.ad;


-- --------------------------------------------------------------------------
-- 7. VW_SinifBazliDevamsizlik
-- Amaç: Sınıf bazlı devamsızlık durumunu gösterir
-- Kullanım: SELECT * FROM VW_SinifBazliDevamsizlik;
-- --------------------------------------------------------------------------
DROP VIEW IF EXISTS VW_SinifBazliDevamsizlik;

CREATE VIEW VW_SinifBazliDevamsizlik AS
SELECT 
    s.ad AS sinifAdi,
    k.ad AS kursAdi,
    COUNT(DISTINCT u.id) AS toplamOgrenci,
    COUNT(dev.id) AS toplamDevamsizlik,
    ROUND(COUNT(dev.id) * 1.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) AS ogrenciBasinaDevamsizlik,
    COUNT(DISTINCT CASE WHEN dev.id IS NOT NULL THEN u.id END) AS devamsizYapanOgrenci
FROM Sinif s
JOIN Kurs k ON k.id = s.kursId
LEFT JOIN User u ON u.sinifId = s.id AND u.role = 'ogrenci' AND u.aktif = 1
LEFT JOIN Devamsizlik dev ON dev.ogrenciId = u.id
WHERE s.aktif = 1
GROUP BY s.id, s.ad, k.ad;


-- ==========================================================================
-- OLUŞTURULAN VIEW'LARI GÖRÜNTÜLE
-- ==========================================================================
SHOW FULL TABLES WHERE Table_type = 'VIEW';
