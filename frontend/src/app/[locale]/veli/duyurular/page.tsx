'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Megaphone, Bell, Calendar, Clock, 
  User, ChevronRight, Search, Filter, CheckCircle,
  AlertTriangle, Info, Star, Pin, Eye, X,
  BookOpen, CreditCard, Users, Sparkles, Tag
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: 'DUSUK' | 'NORMAL' | 'YUKSEK' | 'ACIL';
  kategori: string;
  hedef: string;
  pinned: boolean;
  createdAt: string;
  olusturan: {
    id: string;
    ad: string;
    soyad: string;
    role: string;
  };
  okundu?: boolean;
  okuyanSayisi?: number;
}

const ONCELIK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  DUSUK: { label: 'Düşük', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: Info },
  NORMAL: { label: 'Normal', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Bell },
  YUKSEK: { label: 'Yüksek', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle },
  ACIL: { label: 'Acil', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
};

const KATEGORI_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  GENEL: { label: 'Genel', icon: Megaphone, color: 'text-indigo-500' },
  EGITIM: { label: 'Eğitim', icon: BookOpen, color: 'text-emerald-500' },
  ODEME: { label: 'Ödeme', icon: CreditCard, color: 'text-amber-500' },
  ETKINLIK: { label: 'Etkinlik', icon: Sparkles, color: 'text-pink-500' },
  TOPLANTI: { label: 'Toplantı', icon: Users, color: 'text-blue-500' },
  DIGER: { label: 'Diğer', icon: Tag, color: 'text-gray-500' },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function VeliDuyurular() {
  const router = useRouter();
  const { theme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = theme === 'dark';
  
  // TTS yardımcı fonksiyonu
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);
  
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [selectedOncelik, setSelectedOncelik] = useState<string>('');
  const [selectedDuyuru, setSelectedDuyuru] = useState<Duyuru | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDuyurular();
  }, []);

  const fetchDuyurular = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/duyuru/benim`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setDuyurular(result.data || []);
      }
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (duyuruId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/duyuru/${duyuruId}/oku`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Duyuruyu okundu olarak işaretle
      setDuyurular(prev => prev.map(d => 
        d.id === duyuruId ? { ...d, okundu: true } : d
      ));
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    }
  };

  const openDuyuru = (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    if (!duyuru.okundu) {
      markAsRead(duyuru.id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtreleme
  const filteredDuyurular = duyurular.filter(duyuru => {
    const matchesSearch = searchQuery === '' || 
      duyuru.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      duyuru.icerik.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKategori = selectedKategori === '' || duyuru.kategori === selectedKategori;
    const matchesOncelik = selectedOncelik === '' || duyuru.oncelik === selectedOncelik;
    
    return matchesSearch && matchesKategori && matchesOncelik;
  });

  // Pinlenmiş ve normal duyuruları ayır
  const pinnedDuyurular = filteredDuyurular.filter(d => d.pinned);
  const normalDuyurular = filteredDuyurular.filter(d => !d.pinned);

  // Okunmamış sayısı
  const unreadCount = duyurular.filter(d => !d.okundu).length;

  if (loading) {
    return (
      <RoleGuard allowedRoles={['veli']}>
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 border-4 ${isDark ? 'border-pink-900' : 'border-pink-200'} rounded-full`}></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duyurular yükleniyor...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['veli']}>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50'}`}>
        {/* Header */}
        <header className={`${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border-b sticky top-0 z-40`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/veli')}
                  className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Duyurular
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {duyurular.length} duyuru • {unreadCount > 0 && `${unreadCount} okunmamış`}
                  </p>
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors ${
                  showFilters 
                    ? 'bg-pink-500 text-white' 
                    : isDark 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Arama ve Filtreler */}
          <div className="mb-6 space-y-4">
            {/* Arama */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Duyurularda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pink-500'
                } focus:outline-none`}
              />
            </div>

            {/* Filtreler */}
            {showFilters && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori Filtresi */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kategori
                    </label>
                    <select
                      value={selectedKategori}
                      onChange={(e) => setSelectedKategori(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-pink-500'
                      } focus:outline-none`}
                    >
                      <option value="">Tüm Kategoriler</option>
                      {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Öncelik Filtresi */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Öncelik
                    </label>
                    <select
                      value={selectedOncelik}
                      onChange={(e) => setSelectedOncelik(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-pink-500'
                      } focus:outline-none`}
                    >
                      <option value="">Tüm Öncelikler</option>
                      {Object.entries(ONCELIK_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtreleri Temizle */}
                {(selectedKategori || selectedOncelik || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedKategori('');
                      setSelectedOncelik('');
                      setSearchQuery('');
                    }}
                    className={`mt-4 text-sm ${isDark ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'}`}
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pinlenmiş Duyurular */}
          {pinnedDuyurular.length > 0 && (
            <div className="mb-6">
              <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Pin className="w-4 h-4" />
                Sabitlenmiş
              </h2>
              <div className="space-y-3">
                {pinnedDuyurular.map(duyuru => (
                  <DuyuruCard 
                    key={duyuru.id} 
                    duyuru={duyuru} 
                    isDark={isDark}
                    onClick={() => openDuyuru(duyuru)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Normal Duyurular */}
          {normalDuyurular.length > 0 ? (
            <div className="space-y-3">
              {pinnedDuyurular.length > 0 && (
                <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Bell className="w-4 h-4" />
                  Tüm Duyurular
                </h2>
              )}
              {normalDuyurular.map(duyuru => (
                <DuyuruCard 
                  key={duyuru.id} 
                  duyuru={duyuru} 
                  isDark={isDark}
                  onClick={() => openDuyuru(duyuru)}
                />
              ))}
            </div>
          ) : filteredDuyurular.length === 0 && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
              <Megaphone className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {searchQuery || selectedKategori || selectedOncelik ? 'Sonuç Bulunamadı' : 'Henüz Duyuru Yok'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery || selectedKategori || selectedOncelik 
                  ? 'Arama kriterlerinize uygun duyuru bulunamadı.'
                  : 'Yeni duyurular burada görüntülenecek.'}
              </p>
            </div>
          )}
        </main>

        {/* Duyuru Detay Modal */}
        {selectedDuyuru && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl`}>
              {/* Modal Header */}
              <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const oncelikConfig = ONCELIK_CONFIG[selectedDuyuru.oncelik];
                        const kategoriConfig = KATEGORI_CONFIG[selectedDuyuru.kategori] || KATEGORI_CONFIG.DIGER;
                        return (
                          <>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${oncelikConfig.bg} ${oncelikConfig.color}`}>
                              {oncelikConfig.label}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${kategoriConfig.color}`}>
                              <kategoriConfig.icon className="w-3.5 h-3.5" />
                              {kategoriConfig.label}
                            </span>
                            {selectedDuyuru.pinned && (
                              <Pin className="w-4 h-4 text-amber-500" />
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedDuyuru.baslik}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedDuyuru(null)}
                    className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <div className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedDuyuru.icerik}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-5 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedDuyuru.olusturan.ad} {selectedDuyuru.olusturan.soyad}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedDuyuru.olusturan.role === 'mudur' ? 'Müdür' : 
                           selectedDuyuru.olusturan.role === 'ogretmen' ? 'Öğretmen' : 
                           selectedDuyuru.olusturan.role === 'sekreter' ? 'Sekreter' : 'Yönetici'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-4 h-4" />
                    {formatFullDate(selectedDuyuru.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

// Duyuru Kartı Komponenti
function DuyuruCard({ 
  duyuru, 
  isDark, 
  onClick 
}: { 
  duyuru: Duyuru; 
  isDark: boolean;
  onClick: () => void;
}) {
  const oncelikConfig = ONCELIK_CONFIG[duyuru.oncelik];
  const kategoriConfig = KATEGORI_CONFIG[duyuru.kategori] || KATEGORI_CONFIG.DIGER;
  const OncelikIcon = oncelikConfig.icon;
  const KategoriIcon = kategoriConfig.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}dk önce`;
    if (hours < 24) return `${hours}sa önce`;
    if (days < 7) return `${days}g önce`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      onClick={onClick}
      className={`${isDark ? 'bg-gray-800 border-gray-700 hover:border-pink-500/50' : 'bg-white border-gray-200 hover:border-pink-300'} 
        rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg group ${
          !duyuru.okundu ? (isDark ? 'border-l-4 border-l-pink-500' : 'border-l-4 border-l-pink-500') : ''
        }`}
    >
      <div className="flex items-start gap-4">
        {/* İkon */}
        <div className={`p-2.5 rounded-xl ${oncelikConfig.bg} flex-shrink-0`}>
          <OncelikIcon className={`w-5 h-5 ${oncelikConfig.color}`} />
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {duyuru.pinned && (
              <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
            {!duyuru.okundu && (
              <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0" />
            )}
            <span className={`flex items-center gap-1 text-xs ${kategoriConfig.color}`}>
              <KategoriIcon className="w-3 h-3" />
              {kategoriConfig.label}
            </span>
          </div>

          <h3 className={`font-semibold mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {duyuru.baslik}
          </h3>

          <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {duyuru.icerik}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {duyuru.olusturan.ad} {duyuru.olusturan.soyad}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              •
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatDate(duyuru.createdAt)}
            </span>
          </div>
        </div>

        {/* Ok */}
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'} group-hover:translate-x-1 transition-transform flex-shrink-0`} />
      </div>
    </div>
  );
}

