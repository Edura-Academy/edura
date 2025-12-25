'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Istatistik {
  toplam: number;
  katildi: number;
  katilmadi: number;
  gecKaldi: number;
  izinli: number;
  devamsizlikOrani: number;
}

interface DersBazli {
  dersAd: string;
  gun: string;
  katildi: number;
  katilmadi: number;
  gecKaldi: number;
  izinli: number;
  kayitlar: {
    tarih: string;
    durum: string;
    aciklama: string | null;
  }[];
}

interface SonKayit {
  tarih: string;
  dersAd: string;
  durum: string;
  aciklama: string | null;
}

interface DevamsizlikData {
  istatistik: Istatistik;
  dersBazli: DersBazli[];
  sonKayitlar: SonKayit[];
}

const durumRenkleri: Record<string, { bg: string; text: string; icon: any }> = {
  KATILDI: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  KATILMADI: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  GEC_KALDI: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  IZINLI: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Calendar },
};

export default function DevamsizlikPage() {
  const [data, setData] = useState<DevamsizlikData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDers, setSelectedDers] = useState<DersBazli | null>(null);

  // Token al
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Devamsızlık verilerini getir
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/yoklama/ogrenci`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Durum etiketi
  const getDurumLabel = (durum: string) => {
    switch (durum) {
      case 'KATILDI': return 'Katıldı';
      case 'KATILMADI': return 'Katılmadı';
      case 'GEC_KALDI': return 'Geç Kaldı';
      case 'IZINLI': return 'İzinli';
      default: return durum;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <p className="text-slate-600">Veriler yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/ogrenci" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Devamsızlık Durumum</h1>
              <p className="text-white/70 text-sm mt-0.5">Son 3 ayın yoklama kayıtları</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Genel İstatistikler */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Genel Durum</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-slate-800">{data.istatistik.toplam}</div>
              <div className="text-sm text-slate-500 mt-1">Toplam Ders</div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-600">{data.istatistik.katildi}</div>
              <div className="text-sm text-green-600 mt-1">Katıldım</div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
              <div className="text-3xl font-bold text-red-600">{data.istatistik.katilmadi}</div>
              <div className="text-sm text-red-600 mt-1">Katılmadım</div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600">{data.istatistik.gecKaldi}</div>
              <div className="text-sm text-yellow-600 mt-1">Geç Kaldım</div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{data.istatistik.izinli}</div>
              <div className="text-sm text-blue-600 mt-1">İzinli</div>
            </div>
            
            <div className={`rounded-xl p-4 text-center border ${
              data.istatistik.devamsizlikOrani <= 10 
                ? 'bg-green-50 border-green-200' 
                : data.istatistik.devamsizlikOrani <= 20 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-3xl font-bold ${
                data.istatistik.devamsizlikOrani <= 10 
                  ? 'text-green-600' 
                  : data.istatistik.devamsizlikOrani <= 20 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                %{data.istatistik.devamsizlikOrani}
              </div>
              <div className="text-sm text-slate-600 mt-1">Devamsızlık</div>
            </div>
          </div>

          {/* Uyarı Mesajı */}
          {data.istatistik.devamsizlikOrani > 20 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-700">Devamsızlık oranınız yüksek!</p>
                <p className="text-sm text-red-600 mt-1">
                  %20'nin üzerinde devamsızlık sınıf geçmeyi etkileyebilir. Lütfen dikkatli olun.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ders Bazlı Durum */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Ders Bazlı Durum</h2>
          </div>

          {data.dersBazli.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Henüz yoklama kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.dersBazli.map((ders, index) => {
                const toplam = ders.katildi + ders.katilmadi + ders.gecKaldi + ders.izinli;
                const katilimOrani = toplam > 0 ? Math.round((ders.katildi / toplam) * 100) : 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDers(selectedDers?.dersAd === ders.dersAd ? null : ders)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">{ders.dersAd}</h3>
                        <p className="text-sm text-slate-500">{ders.gun}</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* Mini İstatistik */}
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                          <span className="text-green-600">{ders.katildi} katılım</span>
                          <span className="text-red-600">{ders.katilmadi} devamsız</span>
                          {ders.gecKaldi > 0 && (
                            <span className="text-yellow-600">{ders.gecKaldi} geç</span>
                          )}
                        </div>
                        
                        {/* Katılım Oranı */}
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            katilimOrani >= 80 ? 'text-green-600' : 
                            katilimOrani >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            %{katilimOrani}
                          </div>
                          <div className="text-xs text-slate-400">katılım</div>
                        </div>
                      </div>
                    </div>

                    {/* İlerleme Çubuğu */}
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${toplam > 0 ? (ders.katildi / toplam) * 100 : 0}%` }} 
                      />
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${toplam > 0 ? (ders.gecKaldi / toplam) * 100 : 0}%` }} 
                      />
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${toplam > 0 ? (ders.izinli / toplam) * 100 : 0}%` }} 
                      />
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${toplam > 0 ? (ders.katilmadi / toplam) * 100 : 0}%` }} 
                      />
                    </div>

                    {/* Detay Kayıtlar (Açılır) */}
                    {selectedDers?.dersAd === ders.dersAd && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500 mb-3">Son kayıtlar:</p>
                        <div className="space-y-2">
                          {ders.kayitlar.slice(0, 5).map((kayit, kIndex) => {
                            const durumInfo = durumRenkleri[kayit.durum] || durumRenkleri.KATILDI;
                            const Icon = durumInfo.icon;
                            
                            return (
                              <div key={kIndex} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">{formatDate(kayit.tarih)}</span>
                                <span className={`flex items-center gap-1 px-2 py-1 rounded ${durumInfo.bg} ${durumInfo.text} text-sm`}>
                                  <Icon size={14} />
                                  {getDurumLabel(kayit.durum)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Son Yoklama Kayıtları */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Son Kayıtlar</h2>
          </div>

          {data.sonKayitlar.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Henüz yoklama kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.sonKayitlar.map((kayit, index) => {
                const durumInfo = durumRenkleri[kayit.durum] || durumRenkleri.KATILDI;
                const Icon = durumInfo.icon;

                return (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${durumInfo.bg}`}>
                        <Icon size={20} className={durumInfo.text} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{kayit.dersAd}</p>
                        <p className="text-sm text-slate-500">{formatDate(kayit.tarih)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${durumInfo.bg} ${durumInfo.text}`}>
                      {getDurumLabel(kayit.durum)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Renk Açıklaması */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-slate-600">Katıldım</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-slate-600">Geç Kaldım</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-slate-600">İzinli</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-slate-600">Katılmadım</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

