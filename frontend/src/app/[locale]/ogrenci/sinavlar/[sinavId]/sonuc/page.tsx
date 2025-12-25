'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, Award,
  TrendingUp, BarChart2, Clock, Target
} from 'lucide-react';

interface SoruSonuc {
  id: string;
  soruMetni: string;
  soruTipi: string;
  secenekler: string[] | null;
  dogruCevap: string;
  verilenCevap: string | null;
  dogruMu: boolean;
  puan: number;
  alinanPuan: number;
}

interface SonucData {
  sinav: { id: string; baslik: string };
  toplamPuan: number;
  maxPuan: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  yuzde: number;
  detayGoster: boolean;
  sorular?: SoruSonuc[];
}

export default function SinavSonuc() {
  const router = useRouter();
  const params = useParams();
  const sinavId = params.sinavId as string;
  
  const [data, setData] = useState<SonucData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailIndex, setShowDetailIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSonuc();
  }, [sinavId]);

  const fetchSonuc = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/sonuc/${sinavId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Sonuç yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBasariRenk = (yuzde: number) => {
    if (yuzde >= 80) return 'text-emerald-400';
    if (yuzde >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradient = (yuzde: number) => {
    if (yuzde >= 80) return 'from-emerald-500 to-emerald-600';
    if (yuzde >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Sonuç bulunamadı</p>
          <button
            onClick={() => router.push('/ogrenci/sinavlar')}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Sınavlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/ogrenci/sinavlar')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{data.sinav.baslik}</h1>
              <p className="text-xs text-slate-400">Sınav Sonucu</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sonuç Özeti */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 mb-8 text-center">
          {/* Puan Dairesi */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * (data.yuzde || 0)) / 100}
                strokeLinecap="round"
                className={getBasariRenk(data.yuzde || 0).replace('text-', 'text-')}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getBasariRenk(data.yuzde || 0)}`}>
                {data.yuzde}%
              </span>
              <span className="text-sm text-slate-400">Başarı</span>
            </div>
          </div>

          {/* Puan */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-white">
              {data.toplamPuan} <span className="text-lg text-slate-400">/ {data.maxPuan}</span>
            </p>
            <p className="text-slate-400">Toplam Puan</p>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{data.dogruSayisi}</span>
              </div>
              <p className="text-xs text-slate-400">Doğru</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{data.yanlisSayisi}</span>
              </div>
              <p className="text-xs text-slate-400">Yanlış</p>
            </div>
            <div className="bg-slate-500/10 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MinusCircle className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold text-slate-400">{data.bosSayisi}</span>
              </div>
              <p className="text-xs text-slate-400">Boş</p>
            </div>
          </div>

          {/* Başarı Mesajı */}
          <div className={`mt-6 p-4 rounded-xl bg-gradient-to-r ${getGradient(data.yuzde || 0)} bg-opacity-20`}>
            <p className="text-white font-medium">
              {data.yuzde >= 80 ? '🎉 Mükemmel!' : data.yuzde >= 60 ? '👍 İyi!' : data.yuzde >= 50 ? '📚 Geçtiniz' : '💪 Tekrar deneyin'}
            </p>
          </div>
        </div>

        {/* Detaylı Sonuçlar */}
        {data.detayGoster && data.sorular && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Soru Detayları</h2>
            
            {data.sorular.map((soru, index) => (
              <div 
                key={soru.id}
                className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 ${
                  soru.dogruMu 
                    ? 'border-emerald-500/30' 
                    : soru.verilenCevap 
                      ? 'border-red-500/30' 
                      : 'border-slate-700/50'
                }`}
              >
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setShowDetailIndex(showDetailIndex === index ? null : index)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    soru.dogruMu 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : soru.verilenCevap 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-slate-700 text-slate-400'
                  }`}>
                    {soru.dogruMu ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : soru.verilenCevap ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <MinusCircle className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Soru {index + 1}</span>
                      <span className={`text-sm ${soru.dogruMu ? 'text-emerald-400' : 'text-slate-400'}`}>
                        +{soru.alinanPuan}/{soru.puan}
                      </span>
                    </div>
                    <p className="text-white truncate">{soru.soruMetni}</p>
                  </div>
                </div>

                {/* Detay */}
                {showDetailIndex === index && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-white mb-3">{soru.soruMetni}</p>
                    
                    {soru.secenekler && (
                      <div className="space-y-2">
                        {soru.secenekler.map((secenek, i) => {
                          const harf = ['A', 'B', 'C', 'D', 'E'][i];
                          const dogruCevap = soru.dogruCevap === harf;
                          const verilenCevap = soru.verilenCevap === harf;
                          
                          return (
                            <div 
                              key={harf}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                dogruCevap 
                                  ? 'bg-emerald-500/20 border border-emerald-500/50' 
                                  : verilenCevap && !dogruCevap
                                    ? 'bg-red-500/20 border border-red-500/50'
                                    : 'bg-slate-700/30'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                dogruCevap 
                                  ? 'bg-emerald-500 text-white' 
                                  : verilenCevap 
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-600 text-slate-300'
                              }`}>
                                {harf}
                              </span>
                              <span className={`text-sm ${
                                dogruCevap ? 'text-emerald-400' : verilenCevap ? 'text-red-400' : 'text-slate-300'
                              }`}>
                                {secenek}
                              </span>
                              {dogruCevap && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-slate-400">
                      {soru.verilenCevap ? (
                        <span>Verdiğiniz cevap: <span className={soru.dogruMu ? 'text-emerald-400' : 'text-red-400'}>{soru.verilenCevap}</span></span>
                      ) : (
                        <span className="text-slate-500">Bu soruyu boş bıraktınız</span>
                      )}
                      {' • '}
                      <span>Doğru cevap: <span className="text-emerald-400">{soru.dogruCevap}</span></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!data.detayGoster && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 text-center">
            <p className="text-slate-400">Detaylı sonuçlar öğretmen tarafından gizlenmiştir.</p>
          </div>
        )}

        {/* Geri Dön */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/ogrenci/sinavlar')}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
          >
            Sınavlara Dön
          </button>
        </div>
      </main>
    </div>
  );
}

