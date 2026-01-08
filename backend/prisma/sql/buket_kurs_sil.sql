-- ==========================================================================
-- KÜÇÜKYALİ BUKET KURS - TÜM VERİLERİ SİLME
-- DİKKAT: Bu sorguyu çalıştırmadan önce BACKUP alın!
-- ==========================================================================

-- Önce kurs ID'sini bul
SELECT id, ad FROM Kurs WHERE ad LIKE '%Buket%' OR ad LIKE '%Küçükyalı%';

-- Kurs ID'sini değişkene ata (bulduğunuz ID ile değiştirin)
SET @kurs_id = (SELECT id FROM Kurs WHERE ad LIKE '%Buket%' LIMIT 1);

-- Kontrol: Bu kursa ait kaç kayıt var?
SELECT 'Kullanıcılar' AS Tablo, COUNT(*) AS Sayi FROM User WHERE kursId = @kurs_id
UNION ALL
SELECT 'Sınıflar', COUNT(*) FROM Sinif WHERE kursId = @kurs_id
UNION ALL
SELECT 'Duyurular', COUNT(*) FROM Duyuru WHERE kursId = @kurs_id;

-- ==========================================================================
-- SİLME İŞLEMLERİ (Sıralama önemli - Foreign Key bağımlılıkları)
-- ==========================================================================

-- -------------------------
-- ADIM 1: Mesajlaşma Sistemi
-- -------------------------

-- Mesaj okunma kayıtları
DELETE mr FROM MessageRead mr
JOIN Message m ON m.id = mr.mesajId
WHERE m.gonderenId IN (SELECT id FROM User WHERE kursId = @kurs_id)
   OR m.alanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Mesajlar
DELETE FROM Message 
WHERE gonderenId IN (SELECT id FROM User WHERE kursId = @kurs_id)
   OR alanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Konuşma üyelikleri
DELETE cm FROM ConversationMember cm
WHERE cm.userId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Boş kalan konuşmaları sil
DELETE FROM Conversation 
WHERE id NOT IN (SELECT DISTINCT conversationId FROM ConversationMember);

-- -------------------------
-- ADIM 2: Gamification
-- -------------------------

-- Günün sorusu cevapları
DELETE FROM GununSorusuCevap 
WHERE userId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Günlük görevler
DELETE FROM GunlukGorev 
WHERE userId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Rozetler
DELETE FROM Rozet 
WHERE userId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 3: Deneme Sınavları (Harici)
-- -------------------------

-- Deneme sonuçları
DELETE FROM DenemeSonucu 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Deneme hedefleri
DELETE FROM DenemeHedef 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Deneme sınavları (kursa özel)
DELETE FROM DenemeSinavi WHERE kursId = @kurs_id;

-- -------------------------
-- ADIM 4: Kurum İçi Denemeler
-- -------------------------

-- Deneme oturumları
DELETE do FROM DenemeOturumu do
JOIN KurumIciDeneme kid ON kid.id = do.denemeId
WHERE kid.olusturanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Soru paketleri
DELETE dsp FROM DenemeSoruPaketi dsp
JOIN KurumIciDeneme kid ON kid.id = dsp.denemeId
WHERE kid.olusturanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Kurum içi denemeler
DELETE FROM KurumIciDeneme 
WHERE olusturanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 5: Online Sınav Sistemi
-- -------------------------

-- Sınav cevapları
DELETE sc FROM SinavCevap sc
JOIN SinavOturumu so ON so.id = sc.oturumId
WHERE so.ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Sınav oturumları
DELETE FROM SinavOturumu 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Online soru (sınavlarla birlikte silinir - CASCADE)
DELETE os FROM OnlineSoru os
JOIN OnlineSinav osi ON osi.id = os.sinavId
WHERE osi.ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Online sınavlar
DELETE FROM OnlineSinav 
WHERE ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 6: Ödev Sistemi
-- -------------------------

-- Ödev soru cevapları
DELETE osc FROM OdevSoruCevap osc
JOIN OdevTeslim ot ON ot.id = osc.teslimId
WHERE ot.ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Ödev teslimleri
DELETE FROM OdevTeslim 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Ödev soruları
DELETE os FROM OdevSoru os
JOIN Odev o ON o.id = os.odevId
WHERE o.ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Ödevler
DELETE FROM Odev 
WHERE ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 7: Canlı Ders Sistemi
-- -------------------------

-- Canlı ders katılımları
DELETE FROM CanliDersKatilim 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Canlı dersler
DELETE FROM CanliDers 
WHERE ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 8: Birebir Dersler
-- -------------------------

-- Birebir ders paketleri
DELETE FROM BirebirDersPaketi 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Birebir dersler
DELETE FROM BirebirDers 
WHERE ogretmenId IN (SELECT id FROM User WHERE kursId = @kurs_id)
   OR ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 9: Materyaller
-- -------------------------

DELETE FROM Materyal 
WHERE yukleyenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 10: Yoklama ve Devamsızlık
-- -------------------------

DELETE FROM Yoklama 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

DELETE FROM Devamsizlik 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 11: Sınav Sonuçları (Exam)
-- -------------------------

DELETE FROM ExamResult 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

DELETE e FROM Exam e
JOIN Ders d ON d.id = e.courseId
JOIN Sinif s ON s.id = d.sinifId
WHERE s.kursId = @kurs_id;

-- -------------------------
-- ADIM 12: Ödeme Sistemi
-- -------------------------

-- Ödemeler
DELETE FROM Odeme 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Ödeme planları
DELETE FROM OdemePlani 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- Ödeme hatırlatmaları
DELETE FROM OdemeHatirlama 
WHERE ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 13: Bildirimler
-- -------------------------

DELETE FROM Notification 
WHERE userId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 14: Duyurular
-- -------------------------

-- Duyuru okumaları
DELETE do FROM DuyuruOkuma do
JOIN Duyuru d ON d.id = do.duyuruId
WHERE d.kursId = @kurs_id;

-- Duyurular
DELETE FROM Duyuru WHERE kursId = @kurs_id;

-- -------------------------
-- ADIM 15: Soru Havuzu
-- -------------------------

DELETE FROM SoruHavuzu 
WHERE ekleyenId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 16: Destek Talepleri
-- -------------------------

DELETE dtc FROM DestekTalebiCevap dtc
JOIN DestekTalebi dt ON dt.id = dtc.talepId
WHERE dt.kursId = @kurs_id OR dt.acanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

DELETE FROM DestekTalebi 
WHERE kursId = @kurs_id OR acanId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 17: Ders Kayıtları
-- -------------------------

DELETE dk FROM DersKayit dk
WHERE dk.ogrenciId IN (SELECT id FROM User WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 18: Dersler
-- -------------------------

DELETE FROM Ders 
WHERE sinifId IN (SELECT id FROM Sinif WHERE kursId = @kurs_id);

-- -------------------------
-- ADIM 19: Sınıflar
-- -------------------------

-- Önce User'ların sinifId'sini NULL yap
UPDATE User SET sinifId = NULL WHERE kursId = @kurs_id;

-- Sonra sınıfları sil
DELETE FROM Sinif WHERE kursId = @kurs_id;

-- -------------------------
-- ADIM 20: Kullanıcılar
-- -------------------------

-- Self-reference'ları temizle
UPDATE User SET veliId = NULL WHERE kursId = @kurs_id;
UPDATE User SET olusturanId = NULL WHERE kursId = @kurs_id;

-- Kullanıcıları sil
DELETE FROM User WHERE kursId = @kurs_id;

-- -------------------------
-- ADIM 21: Kursu Sil
-- -------------------------

DELETE FROM Kurs WHERE id = @kurs_id;

-- ==========================================================================
-- KONTROL - Her şey silindi mi?
-- ==========================================================================

SELECT 'Kurs' AS Tablo, COUNT(*) AS Kalan FROM Kurs WHERE ad LIKE '%Buket%'
UNION ALL
SELECT 'Kullanıcılar', COUNT(*) FROM User WHERE kursId = @kurs_id
UNION ALL
SELECT 'Sınıflar', COUNT(*) FROM Sinif WHERE kursId = @kurs_id;

-- Tüm sayılar 0 olmalı!
