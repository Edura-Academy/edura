'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, TrendingUp, TrendingDown,
  Award, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface Sinav {
  id: string;
  sinavAd: string;
  tip: string;
  tarih: string;
  puan: number;
  toplamPuan: number;
  yuzde: number | null;
  dogru: number | null;
  yanlis: number | null;
  bos: number | null;
}

interface Ders {
  dersId: string;
  dersAd: string;
  sinavlar: Sinav[];
  ortalama: number;
}

interface NotlarData {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
  };
  dersler: Ders[];
}

export default function CocukNotlar() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  
  const [data, setData] = useState<NotlarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDers, setExpandedDers] = useState<string | null>(null);

  useEffect(() => {
    fetchNotlar();
  }, [cocukId]);

  const fetchNotlar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/veli/cocuk/${cocukId}/notlar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        // İlk dersi aç
        if (result.data.dersler.length > 0) {
          setExpandedDers(result.data.dersler[0].dersId);
        }
      }
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrtalamaRenk = (ortalama: number) => {
    if (ortalama >= 80) return 'text-emerald-400';
    if (ortalama >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getOrtalamaBg = (ortalama: number) => {
    if (ortalama >= 80) return 'bg-emerald-500/20';
    if (ortalama >= 60) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSinavTipiLabel = (tip: string) => {
    const tipler: Record<string, string> = {
      DENEME: 'Deneme',
      SINAV: 'Sınav',
      QUIZ: 'Quiz'
    };
    return tipler[tip] || tip;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Genel ortalama hesapla
  const genelOrtalama = data?.dersler.length 
    ? Math.round(data.dersler.reduce((sum, d) => sum + d.ortalama, 0) / data.dersler.length)
    : 0;

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
              <h1 className="text-lg font-semibold text-white">Notlar & Sınav Sonuçları</h1>
              <p className="text-xs text-slate-400">{data?.cocuk.ad} {data?.cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Genel Özet */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Genel Ortalama</p>
              <p className={`text-3xl font-bold ${getOrtalamaRenk(genelOrtalama)}`}>
                {genelOrtalama}%
              </p>
            </div>
            <div className={`w-16 h-16 ${getOrtalamaBg(genelOrtalama)} rounded-2xl flex items-center justify-center`}>
              {genelOrtalama >= 60 ? (
                <TrendingUp className={`w-8 h-8 ${getOrtalamaRenk(genelOrtalama)}`} />
              ) : (
                <TrendingDown className={`w-8 h-8 ${getOrtalamaRenk(genelOrtalama)}`} />
              )}
            </div>
          </div>
          
          {/* Ders Sayıları */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-white">{data?.dersler.length || 0}</p>
              <p className="text-xs text-slate-400">Ders</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-white">
                {data?.dersler.reduce((sum, d) => sum + d.sinavlar.length, 0) || 0}
              </p>
              <p className="text-xs text-slate-400">Sınav</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {data?.dersler.filter(d => d.ortalama >= 80).length || 0}
              </p>
              <p className="text-xs text-slate-400">Başarılı</p>
            </div>
          </div>
        </div>

        {/* Ders Listesi */}
        {data?.dersler && data.dersler.length > 0 ? (
          <div className="space-y-4">
            {data.dersler.map((ders) => (
              <div 
                key={ders.dersId}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                {/* Ders Header */}
                <button
                  onClick={() => setExpandedDers(expandedDers === ders.dersId ? null : ders.dersId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getOrtalamaBg(ders.ortalama)} rounded-xl flex items-center justify-center`}>
                      <BookOpen className={`w-5 h-5 ${getOrtalamaRenk(ders.ortalama)}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium">{ders.dersAd}</h3>
                      <p className="text-xs text-slate-400">{ders.sinavlar.length} sınav</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getOrtalamaRenk(ders.ortalama)}`}>
                      {ders.ortalama}%
                    </span>
                    {expandedDers === ders.dersId ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Sınav Listesi */}
                {expandedDers === ders.dersId && (
                  <div className="border-t border-slate-700/50">
                    {ders.sinavlar.map((sinav, index) => (
                      <div 
                        key={sinav.id}
                        className={`flex items-center justify-between p-4 ${
                          index !== ders.sinavlar.length - 1 ? 'border-b border-slate-700/30' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white text-sm font-medium">{sinav.sinavAd}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              sinav.tip === 'DENEME' ? 'bg-blue-500/20 text-blue-400' :
                              sinav.tip === 'SINAV' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {getSinavTipiLabel(sinav.tip)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(sinav.tarih)}</p>
                          
                          {/* Detay Bilgiler */}
                          {(sinav.dogru !== null || sinav.yanlis !== null) && (
                            <div className="flex gap-3 mt-2">
                              {sinav.dogru !== null && (
                                <span className="text-xs text-emerald-400">
                                  ✓ {sinav.dogru} Doğru
                                </span>
                              )}
                              {sinav.yanlis !== null && (
                                <span className="text-xs text-red-400">
                                  ✗ {sinav.yanlis} Yanlış
                                </span>
                              )}
                              {sinav.bos !== null && sinav.bos > 0 && (
                                <span className="text-xs text-slate-400">
                                  ○ {sinav.bos} Boş
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            (sinav.puan / sinav.toplamPuan * 100) >= 80 ? 'text-emerald-400' :
                            (sinav.puan / sinav.toplamPuan * 100) >= 60 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {sinav.puan}
                            <span className="text-xs text-slate-500">/{sinav.toplamPuan}</span>
                          </p>
                          {sinav.yuzde !== null && (
                            <p className="text-xs text-slate-400">{Math.round(sinav.yuzde)}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <Award className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Henüz sınav sonucu bulunmuyor</p>
          </div>
        )}
      </main>
    </div>
  );
}

