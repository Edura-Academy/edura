// API Routes Documentation for Edura

/**
 * AUTHENTICATION
 */
// POST /api/auth/login - Kullanıcı girişi
// POST /api/auth/logout - Kullanıcı çıkışı
// POST /api/auth/refresh - Token yenileme
// GET /api/auth/me - Mevcut kullanıcı bilgisi

/**
 * USERS - Kullanıcı Yönetimi
 */
// GET /api/users - Tüm kullanıcıları listele (role bazlı filtreleme)
// GET /api/users/:id - Belirli kullanıcı detayı
// POST /api/users - Yeni kullanıcı oluştur (Müdür: Öğretmen/Sekreter, Sekreter: Öğrenci)
// PUT /api/users/:id - Kullanıcı güncelle
// DELETE /api/users/:id - Kullanıcı sil (Sekreter için onay talebi oluşturur)
// PATCH /api/users/:id/password - Şifre değiştir

/**
 * COURSES - Ders/Kurs Yönetimi
 */
// GET /api/courses - Tüm dersleri listele
// GET /api/courses/:id - Belirli ders detayı
// POST /api/courses - Yeni ders oluştur (Admin)
// PUT /api/courses/:id - Ders güncelle (Admin)
// DELETE /api/courses/:id - Ders sil (Admin)
// GET /api/courses/student/:studentId - Öğrencinin kayıtlı olduğu dersler
// POST /api/courses/:id/enroll - Öğrenciyi derse kaydet

/**
 * EXAMS - Sınav Yönetimi
 */
// GET /api/exams - Tüm sınavları listele
// GET /api/exams/:id - Belirli sınav detayı
// POST /api/exams - Yeni sınav oluştur (Öğretmen)
// PUT /api/exams/:id - Sınav güncelle (Öğretmen)
// DELETE /api/exams/:id - Sınav sil (Öğretmen)

/**
 * EXAM RESULTS - Sınav Sonuçları
 */
// GET /api/exam-results/student/:studentId - Öğrencinin tüm sınav sonuçları
// GET /api/exam-results/exam/:examId - Belirli sınavın tüm sonuçları
// POST /api/exam-results - Yeni sınav sonucu ekle (Öğretmen)
// PUT /api/exam-results/:id - Sınav sonucu güncelle (Öğretmen)
// DELETE /api/exam-results/:id - Sınav sonucu sil (Öğretmen)

/**
 * ATTENDANCE - Devamsızlık Yönetimi
 */
// GET /api/attendance/student/:studentId - Öğrencinin devamsızlık kayıtları
// GET /api/attendance/course/:courseId - Derse ait devamsızlık kayıtları
// POST /api/attendance - Devamsızlık kaydı oluştur (Öğretmen)
// PUT /api/attendance/:id - Devamsızlık kaydı güncelle (Öğretmen)
// DELETE /api/attendance/:id - Devamsızlık kaydı sil (Öğretmen)

/**
 * MESSAGES - Mesajlaşma Sistemi
 */
// GET /api/messages - Kullanıcının tüm mesajları
// GET /api/messages/:id - Belirli mesaj detayı
// POST /api/messages - Yeni mesaj gönder
// PUT /api/messages/:id/read - Mesajı okundu olarak işaretle
// DELETE /api/messages/:id - Mesaj sil

/**
 * NOTIFICATIONS - Bildirim Sistemi
 */
// GET /api/notifications - Kullanıcının tüm bildirimleri
// GET /api/notifications/unread - Okunmamış bildirimler
// POST /api/notifications - Yeni bildirim oluştur
// PUT /api/notifications/:id/read - Bildirimi okundu olarak işaretle
// DELETE /api/notifications/:id - Bildirim sil

/**
 * APPROVAL REQUESTS - Onay Talepleri (Sekreter → Müdür)
 */
// GET /api/approvals - Onay bekleyen talepler (Müdür için)
// POST /api/approvals/:id/approve - Talebi onayla (Müdür)
// POST /api/approvals/:id/reject - Talebi reddet (Müdür)

/**
 * DASHBOARD - Dashboard İstatistikleri
 */
// GET /api/dashboard/student/:id - Öğrenci dashboard verileri
// GET /api/dashboard/teacher/:id - Öğretmen dashboard verileri
// GET /api/dashboard/admin - Admin dashboard verileri

/**
 * CLASSES - Sınıf Yönetimi
 */
// GET /api/classes - Tüm sınıfları listele
// GET /api/classes/:id - Belirli sınıf detayı
// POST /api/classes - Yeni sınıf oluştur (Admin)
// PUT /api/classes/:id - Sınıf güncelle (Admin)
// DELETE /api/classes/:id - Sınıf sil (Admin)

export {};
