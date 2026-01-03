'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DashboardData {
  ozet: {
    ogrenciSayisi: number;
    ogretmenSayisi: number;
    sinifSayisi: number;
    dersSayisi: number;
  };
  yoklama: {
    ozet: {
      katildi: number;
      katilmadi: number;
      gec: number;
    };
    trend: Array<{ gun: string; katilim: number }>;
  };
  odev: {
    toplam: number;
    teslimEdilen: number;
  };
  sinav: {
    aktif: number;
    tamamlanan: number;
  };
  sonKayitlar: Array<{
    id: string;
    ad: string;
    soyad: string;
    createdAt: string;
    sinif?: { ad: string };
  }>;
  aylikGelir: number;
}

function RaporlarContent() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'genel' | 'yoklama' | 'akademik'>('genel');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/mudur`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Rapor verileri yüklenemedi.</p>
        </div>
      </div>
    );
  }

  const yoklamaOran = data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi + data.yoklama.ozet.gec > 0
    ? Math.round((data.yoklama.ozet.katildi / (data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi + data.yoklama.ozet.gec)) * 100)
    : 0;

  const odevTeslimOrani = data.odev.toplam > 0
    ? Math.round((data.odev.teslimEdilen / data.odev.toplam) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Raporlar</h1>
                <p className="text-xs text-slate-500">Detaylı istatistikler ve analizler</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'genel', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'yoklama', label: 'Yoklama', icon: Calendar },
            { id: 'akademik', label: 'Akademik', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'genel' && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Öğrenci</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.ogrenciSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Öğretmen</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.ogretmenSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Sınıf</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.sinifSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Ders</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.dersSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Performans Özeti */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Haftalık Yoklama Oranı
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-green-600">%{yoklamaOran}</span>
                  <div className="text-right text-sm text-slate-500">
                    <p>{data.yoklama.ozet.katildi} katılım</p>
                    <p>{data.yoklama.ozet.katilmadi} devamsız</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${yoklamaOran}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Ödev Teslim Oranı
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-blue-600">%{odevTeslimOrani}</span>
                  <div className="text-right text-sm text-slate-500">
                    <p>{data.odev.teslimEdilen} teslim</p>
                    <p>{data.odev.toplam} toplam</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${odevTeslimOrani}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Son Kayıtlar */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Son Kayıt Olan Öğrenciler</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {data.sonKayitlar.length > 0 ? (
                  data.sonKayitlar.map((kayit) => (
                    <div key={kayit.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-medium text-sm">
                          {kayit.ad?.charAt(0)}{kayit.soyad?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{kayit.ad} {kayit.soyad}</p>
                          {kayit.sinif && (
                            <p className="text-xs text-slate-500">{kayit.sinif.ad}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(kayit.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">Henüz kayıt yok</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'yoklama' && (
          <div className="space-y-6">
            {/* Yoklama İstatistikleri */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Katıldı</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{data.yoklama.ozet.katildi}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Katılmadı</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{data.yoklama.ozet.katilmadi}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Geç Kaldı</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{data.yoklama.ozet.gec}</p>
              </div>
            </div>

            {/* Haftalık Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Son 7 Günlük Yoklama Trendi</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {data.yoklama.trend.map((item, i) => {
                  const maxKatilim = Math.max(...data.yoklama.trend.map(t => t.katilim), 1);
                  const height = (item.katilim / maxKatilim) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <span className="text-xs font-medium text-slate-600 mb-1">{item.katilim}</span>
                        <div 
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{item.gun}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'akademik' && (
          <div className="space-y-6">
            {/* Akademik Özet */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Toplam Ödev</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{data.odev.toplam}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Teslim Edilen</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{data.odev.teslimEdilen}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Aktif Sınav</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{data.sinav.aktif}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Tamamlanan</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">{data.sinav.tamamlanan}</p>
              </div>
            </div>

            {/* Performans Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Ödev Performansı</h3>
                <p className="text-blue-100 text-sm mb-4">Son dönem ödev tamamlama oranı</p>
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-bold">%{odevTeslimOrani}</span>
                  {odevTeslimOrani >= 70 ? (
                    <TrendingUp className="w-8 h-8 text-green-300" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-300" />
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Sınav Aktivitesi</h3>
                <p className="text-purple-100 text-sm mb-4">Toplam online sınav durumu</p>
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-bold">{data.sinav.aktif + data.sinav.tamamlanan}</span>
                  <span className="text-lg text-purple-200 mb-1">sınav</span>
                </div>
              </div>
            </div>

            {/* Bilgi Notu */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                <strong>İpucu:</strong> Daha detaylı akademik raporlar için öğretmenlerden sınıf bazlı performans 
                raporları talep edebilirsiniz. Deneme sınavı sonuçları ve öğrenci bazlı analizler için 
                &quot;Deneme Sınavları&quot; modülünü kullanabilirsiniz.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RaporlarPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <RaporlarContent />
    </RoleGuard>
  );
}

