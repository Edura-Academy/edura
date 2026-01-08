'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, FileText, CheckCircle, Clock, 
  AlertCircle, Award, Calendar, Filter, XCircle
} from 'lucide-react';

interface Teslim {
  id: string;
  durum: string;
  puan: number | null;
  teslimTarihi: string;
  ogretmenYorumu: string | null;
}

interface Odev {
  id: string;
  baslik: string;
  aciklama: string | null;
  ders: {
    id: string;
    ad: string;
  };
  ogretmen: {
    id: string;
    ad: string;
    soyad: string;
  };
  sonTeslimTarihi: string;
  maxPuan: number;
  durum: string;
  teslim: Teslim | null;
}

interface OdevlerData {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
  };
  odevler: Odev[];
}

export default function CocukOdevler() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  
  const [data, setData] = useState<OdevlerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('TUMU');
  const [selectedOdev, setSelectedOdev] = useState<Odev | null>(null);

  useEffect(() => {
    fetchOdevler();
  }, [cocukId]);

  const fetchOdevler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/veli/cocuk/${cocukId}/odevler`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Ödevler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bg: string }> = {
      DEGERLENDIRILDI: { label: 'Değerlendirildi', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      TESLIM_EDILDI: { label: 'Teslim Edildi', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
      BEKLEMEDE: { label: 'Değerlendiriliyor', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      BEKLIYOR: { label: 'Yapılmadı', icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/20' },
      GECMIS: { label: 'Süresi Geçti', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' }
    };
    return configs[durum] || configs.BEKLIYOR;
  };

  const getKalanGun = (tarih: string) => {
    const bugun = new Date();
    const sonTarih = new Date(tarih);
    const fark = Math.ceil((sonTarih.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
    return fark;
  };

  const filteredOdevler = data?.odevler.filter(odev => {
    if (filter === 'TUMU') return true;
    return odev.durum === filter;
  }) || [];

  // İstatistikler
  const istatistikler = {
    toplam: data?.odevler.length || 0,
    tamamlanan: data?.odevler.filter(o => o.durum === 'DEGERLENDIRILDI').length || 0,
    bekleyen: data?.odevler.filter(o => o.durum === 'BEKLIYOR' || o.durum === 'BEKLEMEDE').length || 0,
    gecmis: data?.odevler.filter(o => o.durum === 'GECMIS').length || 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push(`/veli/cocuk/${cocukId}`)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Ödevler</h1>
              <p className="text-xs text-slate-400">{data?.cocuk.ad} {data?.cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button 
            onClick={() => setFilter('TUMU')}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 text-center transition-all ${
              filter === 'TUMU' ? 'border-purple-500' : 'border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className="text-2xl font-bold text-white">{istatistikler.toplam}</p>
            <p className="text-xs text-slate-400">Toplam</p>
          </button>
          <button 
            onClick={() => setFilter('DEGERLENDIRILDI')}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 text-center transition-all ${
              filter === 'DEGERLENDIRILDI' ? 'border-emerald-500' : 'border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className="text-2xl font-bold text-emerald-400">{istatistikler.tamamlanan}</p>
            <p className="text-xs text-slate-400">Tamamlandı</p>
          </button>
          <button 
            onClick={() => setFilter('BEKLIYOR')}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 text-center transition-all ${
              filter === 'BEKLIYOR' ? 'border-purple-500' : 'border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className="text-2xl font-bold text-purple-400">{istatistikler.bekleyen}</p>
            <p className="text-xs text-slate-400">Bekliyor</p>
          </button>
          <button 
            onClick={() => setFilter('GECMIS')}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 text-center transition-all ${
              filter === 'GECMIS' ? 'border-red-500' : 'border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className="text-2xl font-bold text-red-400">{istatistikler.gecmis}</p>
            <p className="text-xs text-slate-400">Geçmiş</p>
          </button>
        </div>

        {/* Ödev Listesi */}
        {filteredOdevler.length > 0 ? (
          <div className="space-y-4">
            {filteredOdevler.map((odev) => {
              const config = getDurumConfig(odev.durum);
              const Icon = config.icon;
              const kalanGun = getKalanGun(odev.sonTeslimTarihi);
              
              return (
                <div 
                  key={odev.id}
                  onClick={() => setSelectedOdev(odev)}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-medium">{odev.baslik}</h3>
                          <p className="text-sm text-purple-400">{odev.ders.ad}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color} whitespace-nowrap`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Son: {formatDate(odev.sonTeslimTarihi)}
                        </span>
                        
                        {odev.durum === 'BEKLIYOR' && kalanGun > 0 && (
                          <span className={`${kalanGun <= 2 ? 'text-red-400' : kalanGun <= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {kalanGun} gün kaldı
                          </span>
                        )}
                        
                        {odev.teslim?.puan !== null && odev.teslim?.puan !== undefined && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Award className="w-3 h-3" />
                            {odev.teslim.puan}/{odev.maxPuan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">
              {filter === 'TUMU' ? 'Henüz ödev bulunmuyor' : 'Bu filtreye uygun ödev yok'}
            </p>
          </div>
        )}
      </main>

      {/* Ödev Detay Modal */}
      {selectedOdev && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOdev(null)}>
          <div 
            className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedOdev.baslik}</h2>
                  <p className="text-sm text-purple-400">{selectedOdev.ders.ad}</p>
                </div>
                <button 
                  onClick={() => setSelectedOdev(null)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Durum */}
              {(() => {
                const config = getDurumConfig(selectedOdev.durum);
                return (
                  <div className={`${config.bg} rounded-xl p-4 mb-4`}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                      <span className={`font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Detaylar */}
              <div className="space-y-4">
                {selectedOdev.aciklama && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Açıklama</p>
                    <p className="text-white text-sm">{selectedOdev.aciklama}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Son Teslim</p>
                    <p className="text-white text-sm">{formatDate(selectedOdev.sonTeslimTarihi)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Öğretmen</p>
                    <p className="text-white text-sm">{selectedOdev.ogretmen.ad} {selectedOdev.ogretmen.soyad}</p>
                  </div>
                </div>

                {selectedOdev.teslim && (
                  <>
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Teslim Bilgileri</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Teslim Tarihi</p>
                          <p className="text-white text-sm">{formatDate(selectedOdev.teslim.teslimTarihi)}</p>
                        </div>
                        {selectedOdev.teslim.puan !== null && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Puan</p>
                            <p className={`text-lg font-bold ${
                              (selectedOdev.teslim.puan / selectedOdev.maxPuan * 100) >= 80 ? 'text-emerald-400' :
                              (selectedOdev.teslim.puan / selectedOdev.maxPuan * 100) >= 60 ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {selectedOdev.teslim.puan}
                              <span className="text-sm text-slate-500">/{selectedOdev.maxPuan}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedOdev.teslim.ogretmenYorumu && (
                        <div className="mt-4 p-3 bg-slate-700/50 rounded-xl">
                          <p className="text-xs text-slate-400 mb-1">Öğretmen Yorumu</p>
                          <p className="text-white text-sm">{selectedOdev.teslim.ogretmenYorumu}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

