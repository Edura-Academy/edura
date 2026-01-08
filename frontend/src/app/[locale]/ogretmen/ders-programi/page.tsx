'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Video,
  FileText,
  MoreVertical,
  LayoutGrid,
  List,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface DersEvent {
  id: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  extendedProps: {
    dersAd: string;
    sinifAd: string;
    sinifId: string;
    aciklama?: string;
  };
  backgroundColor: string;
  borderColor: string;
}

// Gün numaralarını isme çevir
const gunIsimleri: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  0: 'Pazar'
};

const gunSirasi = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi'den Pazar'a

const saatler = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const gunRenkleri: Record<number, { bg: string; border: string; text: string; light: string }> = {
  1: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  2: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  3: { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600', light: 'bg-violet-50' },
  4: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  5: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600', light: 'bg-pink-50' },
  6: { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
  0: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600', light: 'bg-amber-50' }
};

function OgretmenDersProgramiContent() {
  const { resolvedTheme } = useTheme();
  const { token } = useAuth();
  const isDark = resolvedTheme === 'dark';
  const [dersler, setDersler] = useState<DersEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'haftalik' | 'liste'>('liste');
  const [selectedGun, setSelectedGun] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (token) {
    fetchDersler();
    }
  }, [token]);

  const fetchDersler = async () => {
    try {
      const res = await fetch(`${API_URL}/ders-programi/ogretmen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDersler(data.data || []);
      } else {
        setDersler([]);
      }
    } catch (error) {
      console.error('Ders programı alınamadı:', error);
      setDersler([]);
    } finally {
      setLoading(false);
    }
  };

  // Gün ve saate göre dersi bul
  const getDersForGunSaat = (gunNo: number, saat: string) => {
    return dersler.find(d => {
      const dersBaslangic = d.startTime?.substring(0, 5);
      return d.daysOfWeek?.includes(gunNo) && dersBaslangic === saat;
    });
  };

  // Toplam ders saati hesapla
  const toplamDersSaati = dersler.reduce((acc, d) => {
    if (!d.startTime || !d.endTime) return acc;
    const baslangic = parseInt(d.startTime.split(':')[0]);
    const bitis = parseInt(d.endTime.split(':')[0]);
    return acc + (bitis - baslangic);
  }, 0);

  // Günlere göre dersler
  const derslerByGun = gunSirasi.map(gunNo => ({
    gunNo,
    gunAdi: gunIsimleri[gunNo],
    dersler: dersler
      .filter(d => d.daysOfWeek?.includes(gunNo))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  })).filter(g => g.dersler.length > 0);

  // Bugünün günü
  const bugun = new Date().getDay();

  // Filtrelenmiş dersler
  const filteredDersler = selectedGun !== null 
    ? derslerByGun.filter(g => g.gunNo === selectedGun)
    : derslerByGun;

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1117]' : 'bg-slate-50'} flex items-center justify-center`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1117]' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-[#1a1f2e] border-b border-slate-700/50' : 'bg-white border-b border-slate-200'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/ogretmen" 
                className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-600'} transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Derslerim</h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Haftalık ders programınız</p>
              </div>
            </div>
            
            {/* Görünüm Seçici */}
            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => setViewMode('liste')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'liste' 
                    ? isDark 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white text-blue-600 shadow-md'
                    : isDark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Liste</span>
              </button>
              <button
                onClick={() => setViewMode('haftalik')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'haftalik' 
                    ? isDark 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white text-blue-600 shadow-md'
                    : isDark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Tablo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl p-5 border`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <BookOpen className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dersler.length}</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Ders</p>
              </div>
            </div>
          </div>
          
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl p-5 border`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <Clock className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{toplamDersSaati}</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Haftalık Saat</p>
              </div>
            </div>
          </div>
          
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl p-5 border`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                <CalendarDays className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{derslerByGun.length}</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ders Günü</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl p-5 border`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <GraduationCap className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {new Set(dersler.map(d => d.extendedProps?.sinifId)).size}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sınıf Sayısı</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gün Filtreleme - Liste görünümünde */}
        {viewMode === 'liste' && derslerByGun.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedGun(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedGun === null
                  ? isDark 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-600 text-white'
                  : isDark 
                    ? 'bg-slate-800 text-slate-400 hover:text-white' 
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Tümü
            </button>
            {gunSirasi.map(gunNo => {
              const hasDers = derslerByGun.some(g => g.gunNo === gunNo);
              if (!hasDers) return null;
              const renkler = gunRenkleri[gunNo];
              return (
                <button
                  key={gunNo}
                  onClick={() => setSelectedGun(selectedGun === gunNo ? null : gunNo)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedGun === gunNo
                      ? `${renkler.bg} text-white`
                      : isDark 
                        ? 'bg-slate-800 text-slate-400 hover:text-white' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {gunIsimleri[gunNo]}
                  {gunNo === bugun && (
                    <span className={`ml-2 w-2 h-2 rounded-full inline-block ${selectedGun === gunNo ? 'bg-white' : 'bg-green-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'liste' ? (
          /* Liste Görünüm */
          <div className="space-y-6">
            {filteredDersler.length > 0 ? (
              filteredDersler.map(({ gunNo, gunAdi, dersler: gunDersleri }) => {
                const renkler = gunRenkleri[gunNo];
                const isToday = gunNo === bugun;
                
                return (
                  <div 
                    key={gunNo} 
                    className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden ${isToday ? (isDark ? 'ring-2 ring-blue-500/50' : 'ring-2 ring-blue-500/30') : ''}`}
                  >
                    {/* Gün Başlığı */}
                    <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${renkler.bg} rounded-xl flex items-center justify-center`}>
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{gunAdi}</h3>
                            {isToday && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                Bugün
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {gunDersleri.length} ders
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dersler */}
                    <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                      {gunDersleri.map((ders) => (
                        <div 
                          key={ders.id} 
                          className={`p-5 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Saat */}
                              <div className={`text-center min-w-[60px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-xl p-2`}>
                                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {ders.startTime?.substring(0, 5)}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                  {ders.endTime?.substring(0, 5)}
                                </p>
                              </div>

                              {/* Ders Bilgisi */}
                              <div className="flex-1">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {ders.extendedProps?.dersAd || ders.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                  <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    <Users className="w-4 h-4" />
                                    {ders.extendedProps?.sinifAd}
                                  </span>
                                  {ders.extendedProps?.aciklama && (
                                    <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                      <FileText className="w-4 h-4" />
                                      {ders.extendedProps.aciklama}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Aksiyonlar */}
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/ogretmen/canli-ders`}
                                className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'} transition-colors`}
                                title="Canlı Ders Başlat"
                              >
                                <Video className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : dersler.length === 0 ? (
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border p-12 text-center`}>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Calendar className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Ders Programı Boş
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto`}>
                  Henüz size atanmış ders bulunmuyor. Müdürünüz veya sekreter ders ataması yaptığında burada görünecektir.
                </p>
              </div>
            ) : (
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border p-12 text-center`}>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Seçili günde ders bulunmuyor
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Haftalık Tablo Görünüm */
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                    <th className={`p-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} w-20`}>
                      Saat
                    </th>
                    {gunSirasi.slice(0, 6).map(gunNo => {
                      const isToday = gunNo === bugun;
                      return (
                        <th 
                          key={gunNo} 
                          className={`p-4 text-center text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} ${isToday ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : ''}`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {gunIsimleri[gunNo]}
                            {isToday && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {saatler.map((saat, idx) => (
                    <tr 
                      key={saat} 
                      className={`border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'} ${idx % 2 === 0 ? (isDark ? 'bg-slate-800/20' : 'bg-slate-50/50') : ''}`}
                    >
                      <td className={`p-3 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {saat}
                      </td>
                      {gunSirasi.slice(0, 6).map(gunNo => {
                        const ders = getDersForGunSaat(gunNo, saat);
                        const isToday = gunNo === bugun;
                        const renkler = gunRenkleri[gunNo];
                        
                        return (
                          <td 
                            key={`${gunNo}-${saat}`} 
                            className={`p-2 ${isToday ? (isDark ? 'bg-blue-500/5' : 'bg-blue-50/50') : ''}`}
                          >
                            {ders ? (
                              <div 
                                className={`${renkler.bg} text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                                title={`${ders.extendedProps?.dersAd} - ${ders.extendedProps?.sinifAd}`}
                              >
                                <p className="font-medium text-sm truncate">{ders.extendedProps?.dersAd}</p>
                                <p className="text-white/80 text-xs mt-1 truncate">{ders.extendedProps?.sinifAd}</p>
                                <p className="text-white/70 text-xs mt-1">
                                  {ders.startTime?.substring(0, 5)} - {ders.endTime?.substring(0, 5)}
                                </p>
                              </div>
                            ) : (
                              <div className="h-16" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OgretmenDersProgramiPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenDersProgramiContent />
    </RoleGuard>
  );
}
