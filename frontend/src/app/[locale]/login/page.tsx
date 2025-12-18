'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

const backgrounds = [
  '/login-backgrounds/galata.jpg',
  '/login-backgrounds/Ortakoy.jpg',
  '/login-backgrounds/3.jpg',
  '/login-backgrounds/4.jpg',
];

// Kullanıcı tipi - çoklu rol desteği
interface BypassUser {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  roles: Array<{
    role: string;
    brans?: string | null;
    label: string;
    description: string;
    icon: string;
    color: string;
  }>;
  kursId: string | null;
  kursAd: string;
  sinif?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [currentBg, setCurrentBg] = useState(0);
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [kullaniciTuru, setKullaniciTuru] = useState('personel');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Arkaplan slider - 3 saniyede bir değişir
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // BYPASS: Test için hızlı giriş
  const [showBypass, setShowBypass] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BypassUser | null>(null);

  // Bypass kullanıcıları - TEST İÇİN
  // Çoklu rol desteği ile - Her rol için zengin mock data
  const bypassUsers: Record<string, BypassUser> = {
    // ========== ADMİN ==========
    admin: {
      id: 'bypass-admin-001',
      email: 'admin@edura.com',
      ad: 'Sistem',
      soyad: 'Yöneticisi',
      roles: [
        { role: 'admin', label: 'Admin', description: 'Tüm sistem yetkileri', icon: '👑', color: 'purple' }
      ],
      kursId: null,
      kursAd: 'Edura Sistem',
    },

    // ========== MÜDÜRLER ==========
    mudur1: {
      id: 'bypass-mudur-001',
      email: 'mehmet.yilmaz@edura.com',
      ad: 'Mehmet',
      soyad: 'Yılmaz',
      roles: [
        { role: 'mudur', label: 'Müdür', description: 'Edura Merkez Şube', icon: '🏢', color: 'blue' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    mudur2: {
      id: 'bypass-mudur-002',
      email: 'ali.ozturk@edura.com',
      ad: 'Ali',
      soyad: 'Öztürk',
      roles: [
        { role: 'mudur', label: 'Müdür', description: 'Edura Kadıköy Şube', icon: '🏢', color: 'blue' }
      ],
      kursId: 'kurs-002',
      kursAd: 'Edura Kadıköy',
    },

    // ========== ÇOKLU ROL: MÜDÜR + ÖĞRETMEN ==========
    mudur_ogretmen1: {
      id: 'bypass-mudur-ogretmen-001',
      email: 'ahmet.kaya@edura.com',
      ad: 'Ahmet',
      soyad: 'Kaya',
      roles: [
        { role: 'mudur', label: 'Müdür', description: 'Kurum yöneticisi', icon: '🏢', color: 'blue' },
        { role: 'ogretmen', brans: 'Matematik', label: 'Matematik Öğretmeni', description: 'Lise matematik', icon: '📐', color: 'green' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    mudur_ogretmen2: {
      id: 'bypass-mudur-ogretmen-002',
      email: 'zeynep.arslan@edura.com',
      ad: 'Zeynep',
      soyad: 'Arslan',
      roles: [
        { role: 'mudur', label: 'Müdür', description: 'Kurum yöneticisi', icon: '🏢', color: 'blue' },
        { role: 'ogretmen', brans: 'İngilizce', label: 'İngilizce Öğretmeni', description: 'Dil eğitimi', icon: '🌍', color: 'green' }
      ],
      kursId: 'kurs-003',
      kursAd: 'Edura Beşiktaş',
    },

    // ========== ÖĞRETMENLER ==========
    ogretmen_matematik: {
      id: 'bypass-ogretmen-001',
      email: 'ayse.demir@edura.com',
      ad: 'Ayşe',
      soyad: 'Demir',
      roles: [
        { role: 'ogretmen', brans: 'Matematik', label: 'Matematik Öğretmeni', description: 'LGS & TYT Matematik', icon: '📐', color: 'green' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    ogretmen_fizik: {
      id: 'bypass-ogretmen-002',
      email: 'mustafa.celik@edura.com',
      ad: 'Mustafa',
      soyad: 'Çelik',
      roles: [
        { role: 'ogretmen', brans: 'Fizik', label: 'Fizik Öğretmeni', description: 'TYT & AYT Fizik', icon: '⚛️', color: 'green' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    ogretmen_turkce: {
      id: 'bypass-ogretmen-003',
      email: 'elif.yildiz@edura.com',
      ad: 'Elif',
      soyad: 'Yıldız',
      roles: [
        { role: 'ogretmen', brans: 'Türkçe', label: 'Türkçe Öğretmeni', description: 'LGS Türkçe', icon: '📚', color: 'green' }
      ],
      kursId: 'kurs-002',
      kursAd: 'Edura Kadıköy',
    },
    ogretmen_ingilizce: {
      id: 'bypass-ogretmen-004',
      email: 'can.aksoy@edura.com',
      ad: 'Can',
      soyad: 'Aksoy',
      roles: [
        { role: 'ogretmen', brans: 'İngilizce', label: 'İngilizce Öğretmeni', description: 'YDS & YÖKDİL', icon: '🌍', color: 'green' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },

    // ========== SEKRETERLER ==========
    sekreter1: {
      id: 'bypass-sekreter-001',
      email: 'fatma.sahin@edura.com',
      ad: 'Fatma',
      soyad: 'Şahin',
      roles: [
        { role: 'sekreter', label: 'Sekreter', description: 'Kayıt & İdari işler', icon: '📋', color: 'orange' }
      ],
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    sekreter2: {
      id: 'bypass-sekreter-002',
      email: 'selin.kara@edura.com',
      ad: 'Selin',
      soyad: 'Kara',
      roles: [
        { role: 'sekreter', label: 'Sekreter', description: 'Muhasebe & Kayıt', icon: '📋', color: 'orange' }
      ],
      kursId: 'kurs-002',
      kursAd: 'Edura Kadıköy',
    },

    // ========== ÖĞRENCİLER - LİSE ==========
    ogrenci_lise_12: {
      id: 'bypass-ogrenci-001',
      email: 'arda.tekin@ogrenci.edura.com',
      ad: 'Arda',
      soyad: 'Tekin',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '12. Sınıf - TYT/AYT', icon: '🎓', color: 'cyan' }
      ],
      sinif: '12-A',
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    ogrenci_lise_11: {
      id: 'bypass-ogrenci-002',
      email: 'buse.korkmaz@ogrenci.edura.com',
      ad: 'Buse',
      soyad: 'Korkmaz',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '11. Sınıf - Sayısal', icon: '🎓', color: 'cyan' }
      ],
      sinif: '11-B',
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    ogrenci_lise_10: {
      id: 'bypass-ogrenci-003',
      email: 'emre.aydin@ogrenci.edura.com',
      ad: 'Emre',
      soyad: 'Aydın',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '10. Sınıf - Eşit Ağırlık', icon: '🎓', color: 'cyan' }
      ],
      sinif: '10-A',
      kursId: 'kurs-002',
      kursAd: 'Edura Kadıköy',
    },

    // ========== ÖĞRENCİLER - ORTAOKUL (LGS) ==========
    ogrenci_8: {
      id: 'bypass-ogrenci-004',
      email: 'deniz.yilmaz@ogrenci.edura.com',
      ad: 'Deniz',
      soyad: 'Yılmaz',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '8. Sınıf - LGS Hazırlık', icon: '📖', color: 'cyan' }
      ],
      sinif: '8-A',
      kursId: 'kurs-001',
      kursAd: 'Edura Merkez',
    },
    ogrenci_7: {
      id: 'bypass-ogrenci-005',
      email: 'sude.ozkan@ogrenci.edura.com',
      ad: 'Sude',
      soyad: 'Özkan',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '7. Sınıf - Ortaokul', icon: '📖', color: 'cyan' }
      ],
      sinif: '7-B',
      kursId: 'kurs-002',
      kursAd: 'Edura Kadıköy',
    },

    // ========== ÖĞRENCİLER - İLKOKUL ==========
    ogrenci_4: {
      id: 'bypass-ogrenci-006',
      email: 'yusuf.eren@ogrenci.edura.com',
      ad: 'Yusuf',
      soyad: 'Eren',
      roles: [
        { role: 'ogrenci', label: 'Öğrenci', description: '4. Sınıf - İlkokul', icon: '✏️', color: 'cyan' }
      ],
      sinif: '4-A',
      kursId: 'kurs-003',
      kursAd: 'Edura Beşiktaş',
    },
  };

  // Kullanıcı seçildiğinde
  const handleUserSelect = (userKey: string) => {
    const user = bypassUsers[userKey];
    
    // Eğer kullanıcının birden fazla rolü varsa rol seçimi göster
    if (user.roles.length > 1) {
      setSelectedUser(user);
      setShowBypass(false);
      setShowRoleSelect(true);
    } else {
      // Tek rol varsa direkt giriş yap
      performLogin(user, user.roles[0]);
    }
  };

  // Rol seçildiğinde giriş yap
  const handleRoleSelect = (roleIndex: number) => {
    if (selectedUser) {
      performLogin(selectedUser, selectedUser.roles[roleIndex]);
    }
  };

  // Giriş işlemini gerçekleştir
  const performLogin = (user: BypassUser, selectedRole: BypassUser['roles'][0]) => {
    const loginUser = {
      id: user.id,
      email: user.email,
      ad: user.ad,
      soyad: user.soyad,
      role: selectedRole.role,
      brans: selectedRole.brans || null,
      kursId: user.kursId,
      kursAd: user.kursAd,
      sinif: user.sinif || null,
      // Çoklu rol bilgisini de sakla
      hasMultipleRoles: user.roles.length > 1,
      allRoles: user.roles,
    };

    localStorage.setItem('token', 'bypass-token-' + user.id);
    localStorage.setItem('user', JSON.stringify(loginUser));
    
    // Role göre yönlendir
    if (selectedRole.role === 'admin') {
      router.push('/admin');
    } else if (selectedRole.role === 'ogrenci') {
      router.push('/ogrenci');
    } else {
      router.push('/personel');
    }

    setShowBypass(false);
    setShowRoleSelect(false);
    setSelectedUser(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // BYPASS: edura / 123 ile test girişi
    if (kullaniciAdi === 'edura' && sifre === '123') {
      setShowBypass(true);
      setLoading(false);
      return;
    }

    // Personel seçildiyse sırayla tüm personel tablolarında ara
    const personelTurleri = ['kurs', 'mudur', 'ogretmen', 'sekreter'];
    const aramaTurleri = kullaniciTuru === 'personel' ? personelTurleri : ['ogrenci'];

    let loginSuccess = false;
    let loginData = null;

    for (const tur of aramaTurleri) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kullaniciAdi, sifre, kullaniciTuru: tur }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          loginSuccess = true;
          loginData = data;
          break;
        }
      } catch (err) {
        console.error(`${tur} kontrolü hatası:`, err);
      }
    }

    if (!loginSuccess || !loginData) {
      setError('Kullanıcı adı veya şifre hatalı');
      setLoading(false);
      return;
    }

    // Token'ı kaydet
    localStorage.setItem('token', loginData.data.token);
    localStorage.setItem('user', JSON.stringify(loginData.data.user));

    // İlk giriş kontrolü - şifre değiştirilmemişse yönlendir
    if (!loginData.data.user.sifreDegistirildiMi) {
      router.push('/change-password');
    } else {
      // Role göre yönlendir
      const userRole = loginData.data.user.role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'ogrenci') {
        router.push('/ogrenci');
      } else {
        router.push('/personel');
      }
    }

    setLoading(false);
  };

  // Renk sınıflarını al
  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; iconBg: string }> = {
      purple: { border: 'hover:border-purple-500', bg: 'hover:bg-purple-50', iconBg: 'bg-purple-100' },
      blue: { border: 'hover:border-blue-500', bg: 'hover:bg-blue-50', iconBg: 'bg-blue-100' },
      green: { border: 'hover:border-green-500', bg: 'hover:bg-green-50', iconBg: 'bg-green-100' },
      orange: { border: 'hover:border-orange-500', bg: 'hover:bg-orange-50', iconBg: 'bg-orange-100' },
      cyan: { border: 'hover:border-cyan-500', bg: 'hover:bg-cyan-50', iconBg: 'bg-cyan-100' },
      indigo: { border: 'hover:border-indigo-500', bg: 'hover:bg-indigo-50', iconBg: 'bg-indigo-100' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Arkaplan Slider */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentBg ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Login Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Edura</h1>
            <p className="text-gray-500 text-sm mt-1">Kurs Takip Sistemi</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Kullanıcı Türü - Sadece Personel ve Öğrenci */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKullaniciTuru('personel')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'personel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Personel
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setKullaniciTuru('ogrenci')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'ogrenci'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Öğrenci
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {kullaniciTuru === 'personel' 
                  ? 'Kurs, Müdür, Öğretmen, Sekreter girişi' 
                  : 'Öğrenci girişi'}
              </p>
            </div>

            {/* Kullanıcı Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="Şifrenizi girin"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                kullaniciTuru === 'personel'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Şifremi Unuttum
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © 2025 Edura Academy. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>

      {/* Slide İndikatörler */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {backgrounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBg(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentBg ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* BYPASS Modal - Test için kullanıcı seçimi */}
      {showBypass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <span className="text-2xl">🔓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Test Girişi</h3>
              <p className="text-gray-500 text-sm mt-1">Hangi kullanıcı ile giriş yapmak istersiniz?</p>
            </div>

            {/* ========== ADMİN ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>👑</span> Sistem Yönetimi
              </h4>
              <button
                onClick={() => handleUserSelect('admin')}
                className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800 text-sm">Sistem Yöneticisi</p>
                  <p className="text-xs text-gray-500">Tüm sistem yetkileri</p>
                </div>
              </button>
            </div>

            {/* ========== MÜDÜRLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🏢</span> Müdürler
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleUserSelect('mudur1')}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🏢</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800 text-sm">Mehmet Yılmaz</p>
                    <p className="text-xs text-gray-500">Edura Merkez</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('mudur2')}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🏢</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800 text-sm">Ali Öztürk</p>
                    <p className="text-xs text-gray-500">Edura Kadıköy</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ========== ÇOKLU ROL ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🔄</span> Çoklu Rol (Müdür + Öğretmen)
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleUserSelect('mudur_ogretmen1')}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3 relative"
                >
                  <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    2 Rol
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center relative">
                    <span className="text-lg">🏢</span>
                    <span className="absolute -bottom-0.5 -right-0.5 text-xs">📐</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800 text-sm">Ahmet Kaya</p>
                    <p className="text-xs text-gray-500">Müdür + Matematik Öğrt. • Merkez</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('mudur_ogretmen2')}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3 relative"
                >
                  <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    2 Rol
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center relative">
                    <span className="text-lg">🏢</span>
                    <span className="absolute -bottom-0.5 -right-0.5 text-xs">🌍</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800 text-sm">Zeynep Arslan</p>
                    <p className="text-xs text-gray-500">Müdür + İngilizce Öğrt. • Beşiktaş</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ========== ÖĞRETMENLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>👨‍🏫</span> Öğretmenler
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUserSelect('ogretmen_matematik')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📐</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Ayşe Demir</p>
                    <p className="text-[10px] text-gray-500">Matematik</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('ogretmen_fizik')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">⚛️</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Mustafa Çelik</p>
                    <p className="text-[10px] text-gray-500">Fizik</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('ogretmen_turkce')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📚</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Elif Yıldız</p>
                    <p className="text-[10px] text-gray-500">Türkçe</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('ogretmen_ingilizce')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🌍</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Can Aksoy</p>
                    <p className="text-[10px] text-gray-500">İngilizce</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ========== SEKRETERLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>📋</span> Sekreterler
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUserSelect('sekreter1')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📋</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Fatma Şahin</p>
                    <p className="text-[10px] text-gray-500">Merkez</p>
                  </div>
                </button>
                <button
                  onClick={() => handleUserSelect('sekreter2')}
                  className="p-3 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📋</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">Selin Kara</p>
                    <p className="text-[10px] text-gray-500">Kadıköy</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ========== ÖĞRENCİLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🎓</span> Öğrenciler
              </h4>
              
              {/* Lise */}
              <p className="text-[10px] text-gray-400 mb-1 ml-1">Lise (TYT/AYT)</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={() => handleUserSelect('ogrenci_lise_12')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Arda T.</p>
                  <p className="text-[9px] text-gray-500">12-A</p>
                </button>
                <button
                  onClick={() => handleUserSelect('ogrenci_lise_11')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Buse K.</p>
                  <p className="text-[9px] text-gray-500">11-B</p>
                </button>
                <button
                  onClick={() => handleUserSelect('ogrenci_lise_10')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Emre A.</p>
                  <p className="text-[9px] text-gray-500">10-A</p>
                </button>
              </div>

              {/* Ortaokul */}
              <p className="text-[10px] text-gray-400 mb-1 ml-1">Ortaokul (LGS)</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={() => handleUserSelect('ogrenci_8')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">📖</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Deniz Y.</p>
                  <p className="text-[9px] text-gray-500">8-A</p>
                </button>
                <button
                  onClick={() => handleUserSelect('ogrenci_7')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">📖</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Sude Ö.</p>
                  <p className="text-[9px] text-gray-500">7-B</p>
                </button>
                <button
                  onClick={() => handleUserSelect('ogrenci_4')}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center"
                >
                  <span className="text-lg">✏️</span>
                  <p className="font-semibold text-gray-800 text-[10px]">Yusuf E.</p>
                  <p className="text-[9px] text-gray-500">4-A</p>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowBypass(false)}
              className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm border-t border-gray-100 pt-4"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ROL SEÇİMİ Modal - Çoklu rol sahibi kullanıcılar için */}
      {showRoleSelect && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-3">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Rol Seçimi</h3>
              <p className="text-gray-600 mt-1 font-medium">{selectedUser.ad} {selectedUser.soyad}</p>
              <p className="text-gray-500 text-sm mt-1">Hangi rol ile giriş yapmak istersiniz?</p>
            </div>

            <div className="space-y-3">
              {selectedUser.roles.map((role, index) => {
                const colorClasses = getColorClasses(role.color);
                return (
                  <button
                    key={index}
                    onClick={() => handleRoleSelect(index)}
                    className={`w-full p-4 rounded-xl border-2 border-gray-200 ${colorClasses.border} ${colorClasses.bg} transition-all flex items-center gap-4`}
                  >
                    <div className={`w-12 h-12 ${colorClasses.iconBg} rounded-full flex items-center justify-center`}>
                      <span className="text-xl">{role.icon}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-800">{role.label}</p>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                💡 Giriş yaptıktan sonra profil menüsünden rol değiştirebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => {
                setShowRoleSelect(false);
                setSelectedUser(null);
                setShowBypass(true);
              }}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
