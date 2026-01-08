-- ═══════════════════════════════════════════════════════════════════════════════
-- KÜÇÜKYALI BUKET KURS VERİLERİNİ SİLME SQL'İ
-- HeidiSQL üzerinde çalıştırılacak
-- 
-- ÖNEMLİ: Bu SQL'i çalıştırmadan önce yedek almanız önerilir!
-- 
-- Tarih: 2026-01-05
-- Açıklama: Test amaçlı oluşturulan Küçükyalı Buket kurs verilerini siler
-- ═══════════════════════════════════════════════════════════════════════════════

-- Foreign key kontrollerini geçici olarak kapat
SET FOREIGN_KEY_CHECKS = 0;

-- Kurs ID'sini al (değişkene atanamadığı için subquery kullanıyoruz)
-- Kurs adı: 'Küçükyalı Buket'

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. MESAJLAŞMA İLE İLGİLİ VERİLER
-- ═══════════════════════════════════════════════════════════════════════════════

-- Conversation üyelerini sil (Buket kurs kullanıcılarının üyelikleri)
DELETE FROM ConversationMember 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Sınıf gruplarını sil (11-A sınıfına ait)
DELETE FROM Conversation 
WHERE sinifId IN (
    SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Mesajları sil (Buket kurs kullanıcılarının gönderdiği)
DELETE FROM Message 
WHERE gonderenId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DERS KAYITLARI VE İLİŞKİLİ VERİLER
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ders kayıtlarını sil
DELETE FROM DersKayit 
WHERE dersId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Yoklamaları sil
DELETE FROM Yoklama 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Devamsızlıkları sil
DELETE FROM Devamsizlik 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ÖDEV SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ödev soru cevaplarını sil
DELETE FROM OdevSoruCevap 
WHERE teslimId IN (
    SELECT id FROM OdevTeslim WHERE odevId IN (
        SELECT id FROM Odev WHERE courseId IN (
            SELECT id FROM Ders WHERE sinifId IN (
                SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
            )
        )
    )
);

-- Ödev teslimlerini sil
DELETE FROM OdevTeslim 
WHERE odevId IN (
    SELECT id FROM Odev WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Ödev sorularını sil
DELETE FROM OdevSoru 
WHERE odevId IN (
    SELECT id FROM Odev WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Ödevleri sil
DELETE FROM Odev 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SINAV SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sınav cevaplarını sil
DELETE FROM SinavCevap 
WHERE oturumId IN (
    SELECT id FROM SinavOturumu WHERE sinavId IN (
        SELECT id FROM OnlineSinav WHERE courseId IN (
            SELECT id FROM Ders WHERE sinifId IN (
                SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
            )
        )
    )
);

-- Sınav oturumlarını sil
DELETE FROM SinavOturumu 
WHERE sinavId IN (
    SELECT id FROM OnlineSinav WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Online sınav sorularını sil
DELETE FROM OnlineSoru 
WHERE sinavId IN (
    SELECT id FROM OnlineSinav WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Online sınavları sil
DELETE FROM OnlineSinav 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Exam sonuçlarını sil
DELETE FROM ExamResult 
WHERE examId IN (
    SELECT id FROM Exam WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Exam'leri sil
DELETE FROM Exam 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CANLI DERS SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Canlı ders katılımlarını sil
DELETE FROM CanliDersKatilim 
WHERE canliDersId IN (
    SELECT id FROM CanliDers WHERE courseId IN (
        SELECT id FROM Ders WHERE sinifId IN (
            SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
        )
    )
);

-- Canlı dersleri sil
DELETE FROM CanliDers 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. MATERYAL SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Materyalleri sil
DELETE FROM Materyal 
WHERE courseId IN (
    SELECT id FROM Ders WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. DENEME SINAVI SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Deneme sonuçlarını sil
DELETE FROM DenemeSonucu 
WHERE sinavId IN (
    SELECT id FROM DenemeSinavi WHERE sinifId IN (
        SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Deneme sınavlarını sil
DELETE FROM DenemeSinavi 
WHERE sinifId IN (
    SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Kurum içi deneme oturumlarını sil
DELETE FROM DenemeOturumu 
WHERE denemeId IN (
    SELECT id FROM KurumIciDeneme WHERE olusturanId IN (
        SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Deneme soru paketlerini sil
DELETE FROM DenemeSoruPaketi 
WHERE denemeId IN (
    SELECT id FROM KurumIciDeneme WHERE olusturanId IN (
        SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Kurum içi denemeleri sil
DELETE FROM KurumIciDeneme 
WHERE olusturanId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. BİREBİR DERS SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Birebir ders paketlerini sil
DELETE FROM BirebirDersPaketi 
WHERE ogrenciId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Birebir dersleri sil
DELETE FROM BirebirDers 
WHERE ogretmenId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
)
OR ogrenciId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. ÖDEME SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ödemeleri sil
DELETE FROM Odeme 
WHERE ogrenciId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Ödeme planlarını sil
DELETE FROM OdemePlani 
WHERE ogrenciId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. GAMİFİCATİON SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rozetleri sil
DELETE FROM Rozet 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Günlük görevleri sil
DELETE FROM GunlukGorev 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Günün sorusu cevaplarını sil
DELETE FROM GununSorusuCevap 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. BİLDİRİM VE DUYURU SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Bildirimleri sil
DELETE FROM Notification 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Duyuru okumalarını sil
DELETE FROM DuyuruOkuma 
WHERE userId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Duyuruları sil
DELETE FROM Duyuru 
WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. DESTEK TALEBİ SİSTEMİ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Destek talebi cevaplarını sil
DELETE FROM DestekTalebiCevap 
WHERE talepId IN (
    SELECT id FROM DestekTalebi WHERE acanId IN (
        SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
    )
);

-- Destek taleplerini sil
DELETE FROM DestekTalebi 
WHERE acanId IN (
    SELECT id FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. ANA TABLOLAR
-- ═══════════════════════════════════════════════════════════════════════════════

-- Dersleri sil
DELETE FROM Ders 
WHERE sinifId IN (
    SELECT id FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
);

-- Kullanıcıları sil (Buket kursuna ait tüm kullanıcılar)
DELETE FROM User 
WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket');

-- Sınıfları sil
DELETE FROM Sinif 
WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket');

-- Son olarak kursu sil
DELETE FROM Kurs 
WHERE ad = 'Küçükyalı Buket';

-- Foreign key kontrollerini tekrar aç
SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SONUÇ KONTROLÜ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Silme işleminin başarılı olup olmadığını kontrol et
SELECT 
    'Kurs' as Tablo, 
    COUNT(*) as Kalan 
FROM Kurs WHERE ad = 'Küçükyalı Buket'
UNION ALL
SELECT 
    'Kullanıcı' as Tablo, 
    COUNT(*) as Kalan 
FROM User WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket')
UNION ALL
SELECT 
    'Sınıf' as Tablo, 
    COUNT(*) as Kalan 
FROM Sinif WHERE kursId = (SELECT id FROM Kurs WHERE ad = 'Küçükyalı Buket');

-- Tamamlandı mesajı
SELECT '✅ Küçükyalı Buket Kurs verileri başarıyla silindi!' as Sonuc;

