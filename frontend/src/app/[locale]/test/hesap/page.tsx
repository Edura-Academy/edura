'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Role'a göre yönlendirilecek sayfa
const roleHomeMap: Record<string, string> = {
  admin: '/admin',
  mudur: '/mudur',
  ogretmen: '/ogretmen',
  sekreter: '/sekreter',
  ogrenci: '/ogrenci',
  veli: '/veli',
};

interface Kurs {
  id: string;
  ad: string;
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  kursId: string;
}

interface Hesap {
  id: string;
  email: string;
  sifre: string;
  ad: string;
  soyad: string;
  role: string;
  brans?: string;
  ogrenciNo?: string;
  kurs?: Kurs;
  sinif?: Sinif;
}

interface Stats {
  toplam: number;
  admin: number;
  mudur: number;
  sekreter: number;
  ogretmen: number;
  ogrenci: number;
  veli: number;
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  mudur: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  sekreter: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  ogretmen: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  ogrenci: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  veli: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  mudur: 'Müdür',
  sekreter: 'Sekreter',
  ogretmen: 'Öğretmen',
  ogrenci: 'Öğrenci',
  veli: 'Veli',
};

const roleIcons: Record<string, string> = {
  admin: '👑',
  mudur: '🏢',
  sekreter: '📋',
  ogretmen: '👨‍🏫',
  ogrenci: '🎓',
  veli: '👪',
};

export default function TestHesapPage() {
  const router = useRouter();
  const [hesaplar, setHesaplar] = useState<Hesap[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [varsayilanSifre, setVarsayilanSifre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  // Filtreler
  const [roleFilter, setRoleFilter] = useState('');
  const [kursFilter, setKursFilter] = useState('');
  const [sinifFilter, setSinifFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Mevcut giriş yapmış kullanıcı
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    // Mevcut kullanıcıyı kontrol et
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser({ email: parsed.email, role: parsed.role });
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchHesaplar();
  }, []);

  const fetchHesaplar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/test/hesaplar`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Veriler getirilemedi');
        return;
      }

      setHesaplar(data.data.hesaplar);
      setStats(data.data.stats);
      setKurslar(data.data.kurslar);
      setSiniflar(data.data.siniflar);
      setVarsayilanSifre(data.data.varsayilanSifre);
    } catch (err) {
      setError('Bağlantı hatası. Backend çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş sınıflar (seçilen kursa göre)
  const filteredSiniflar = useMemo(() => {
    if (!kursFilter) return siniflar;
    return siniflar.filter(s => s.kursId === kursFilter);
  }, [kursFilter, siniflar]);

  // Filtrelenmiş hesaplar
  const filteredHesaplar = useMemo(() => {
    return hesaplar.filter(h => {
      if (roleFilter && h.role !== roleFilter) return false;
      if (kursFilter && h.kurs?.id !== kursFilter) return false;
      if (sinifFilter && h.sinif?.id !== sinifFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${h.ad} ${h.soyad}`.toLowerCase();
        const email = h.email.toLowerCase();
        if (!fullName.includes(query) && !email.includes(query)) return false;
      }
      return true;
    });
  }, [hesaplar, roleFilter, kursFilter, sinifFilter, searchQuery]);

  const copyToClipboard = async (text: string, email: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const clearFilters = () => {
    setRoleFilter('');
    setKursFilter('');
    setSinifFilter('');
    setSearchQuery('');
  };

  // Hızlı giriş yap - bir hesaba tıklayınca otomatik giriş ve YENİ SEKMEDE aç
  const quickLogin = async (hesap: Hesap) => {
    setLoginLoading(hesap.id);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kullaniciAdi: hesap.email,
          sifre: hesap.sifre,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Giriş başarısız');
        setLoginLoading(null);
        return;
      }

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Mevcut kullanıcıyı güncelle
      setCurrentUser({ email: data.data.user.email, role: data.data.user.role });

      // Role göre YENİ SEKMEDE aç (test sayfası açık kalır)
      const targetPath = roleHomeMap[data.data.user.role] || '/login';
      window.open(targetPath, '_blank');
      
      setLoginLoading(null);
    } catch (err) {
      setError('Bağlantı hatası');
      setLoginLoading(null);
    }
  };

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Hesaplar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-red-200 mb-2">Hata!</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchHesaplar}
            className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔐</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Test Hesapları</h1>
                <p className="text-purple-300 text-sm">
                  Varsayılan şifre: <code className="bg-purple-500/30 px-2 py-0.5 rounded font-mono">{varsayilanSifre}</code>
                </p>
              </div>
            </div>

            {/* Aktif Kullanıcı */}
            {currentUser && (
              <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{roleIcons[currentUser.role]}</span>
                  <div>
                    <p className="text-green-200 text-xs">Aktif Hesap:</p>
                    <p className="text-white text-sm font-medium">{currentUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-green-500/30">
                  <a
                    href={roleHomeMap[currentUser.role]}
                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Panele Git →
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-500/30 text-red-200 text-xs font-medium rounded-lg hover:bg-red-500/50 transition-colors"
                  >
                    Çıkış
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(stats).filter(([key]) => key !== 'toplam').map(([key, value]) => (
                  <div
                    key={key}
                    className={`px-3 py-1.5 rounded-full ${roleColors[key]?.bg || 'bg-gray-100'} ${roleColors[key]?.text || 'text-gray-700'} text-sm font-medium flex items-center gap-1.5`}
                  >
                    <span>{roleIcons[key]}</span>
                    <span>{value}</span>
                  </div>
                ))}
                <div className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
                  Toplam: {stats.toplam}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔍</span>
            <h3 className="text-white font-medium">Filtreler</h3>
            {(roleFilter || kursFilter || sinifFilter || searchQuery) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-purple-300 hover:text-purple-100 text-sm flex items-center gap-1"
              >
                <span>✕</span> Temizle
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                placeholder="İsim veya email ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">🔎</span>
            </div>

            {/* Rol filtresi */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-800">Tüm Roller</option>
              <option value="admin" className="bg-slate-800">👑 Admin</option>
              <option value="mudur" className="bg-slate-800">🏢 Müdür</option>
              <option value="sekreter" className="bg-slate-800">📋 Sekreter</option>
              <option value="ogretmen" className="bg-slate-800">👨‍🏫 Öğretmen</option>
              <option value="ogrenci" className="bg-slate-800">🎓 Öğrenci</option>
              <option value="veli" className="bg-slate-800">👪 Veli</option>
            </select>

            {/* Kurs filtresi */}
            <select
              value={kursFilter}
              onChange={(e) => {
                setKursFilter(e.target.value);
                setSinifFilter('');
              }}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-800">Tüm Kurslar</option>
              {kurslar.map(kurs => (
                <option key={kurs.id} value={kurs.id} className="bg-slate-800">{kurs.ad}</option>
              ))}
            </select>

            {/* Sınıf filtresi */}
            <select
              value={sinifFilter}
              onChange={(e) => setSinifFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer"
              disabled={!kursFilter && filteredSiniflar.length === 0}
            >
              <option value="" className="bg-slate-800">Tüm Sınıflar</option>
              {filteredSiniflar.map(sinif => (
                <option key={sinif.id} value={sinif.id} className="bg-slate-800">{sinif.ad}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sonuç sayısı */}
        <div className="text-purple-200 text-sm mb-4">
          {filteredHesaplar.length} hesap gösteriliyor
          {(roleFilter || kursFilter || sinifFilter || searchQuery) && ` (filtrelenmiş)`}
        </div>

        {/* Tablo */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Şifre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Kurs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Sınıf/Branş</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-purple-300 uppercase tracking-wider">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHesaplar.map((hesap) => (
                  <tr key={hesap.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{roleIcons[hesap.role]}</span>
                        <div>
                          <p className="text-white font-medium">{hesap.ad} {hesap.soyad}</p>
                          {hesap.ogrenciNo && (
                            <p className="text-purple-300 text-xs">#{hesap.ogrenciNo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-cyan-300 text-sm font-mono bg-cyan-500/10 px-2 py-1 rounded">
                        {hesap.email}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-green-300 text-sm font-mono bg-green-500/10 px-2 py-1 rounded">
                        {hesap.sifre}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[hesap.role]?.bg} ${roleColors[hesap.role]?.text}`}>
                        {roleLabels[hesap.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/70 text-sm">
                        {hesap.kurs?.ad || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/70 text-sm">
                        {hesap.sinif?.ad || hesap.brans || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => quickLogin(hesap)}
                          disabled={loginLoading === hesap.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            currentUser?.email === hesap.email
                              ? 'bg-green-500 text-white cursor-default'
                              : loginLoading === hesap.id
                              ? 'bg-blue-400 text-white cursor-wait'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {currentUser?.email === hesap.email
                            ? '✓ Aktif'
                            : loginLoading === hesap.id
                            ? '⏳ Giriş...'
                            : '🚀 Giriş Yap'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(hesap.email, hesap.email)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            copiedEmail === hesap.email
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                          title="Email Kopyala"
                        >
                          {copiedEmail === hesap.email ? '✓' : '📋'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHesaplar.length === 0 && (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-white/60 text-lg">Sonuç bulunamadı</p>
              <p className="text-white/40 text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          )}
        </div>

        {/* Bilgi notu */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="text-amber-200 text-sm">
              <p className="font-medium mb-1">🚀 Hızlı Test:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                <li><strong>&quot;Giriş Yap&quot;</strong> butonuna tıklayın - otomatik giriş yapılır ve panele yönlendirilirsiniz</li>
                <li>Başka bir hesaba geçmek için bu sayfaya geri dönün ve farklı hesaba tıklayın</li>
                <li>Aktif hesap yeşil <strong>&quot;✓ Aktif&quot;</strong> olarak gösterilir</li>
                <li>Header&apos;daki &quot;Panele Git&quot; butonu ile aktif panele hızlıca dönebilirsiniz</li>
              </ul>
              <p className="font-medium mb-1 mt-3">📝 Manuel Giriş:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                <li><strong>Kullanıcı Adı:</strong> Email adresi (örn: <code className="bg-amber-500/20 px-1.5 rounded">admin@edura.com</code>)</li>
                <li><strong>Şifre:</strong> <code className="bg-amber-500/20 px-1.5 rounded">edura123</code> (tüm hesaplar için aynı)</li>
              </ul>
              <p className="font-medium mb-1 mt-3">ℹ️ Notlar:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                <li>Multi-sekme testi için: farklı tarayıcı veya gizli pencere kullanın</li>
                <li>Aynı sekmede hesap değiştirdiğinizde, sistem otomatik olarak doğru panele yönlendirir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

