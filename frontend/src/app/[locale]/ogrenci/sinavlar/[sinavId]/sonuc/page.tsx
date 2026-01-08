'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, Award,
  TrendingUp, BookOpen, ChevronDown, ChevronUp
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/sonuc/${sinavId}`, {
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
    if (yuzde >= 80) return 'text-emerald-600';
    if (yuzde >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const getBasariBg = (yuzde: number) => {
    if (yuzde >= 80) return 'bg-emerald-100';
    if (yuzde >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getGradient = (yuzde: number) => {
    if (yuzde >= 80) return 'from-emerald-500 to-emerald-600';
    if (yuzde >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getBasariMesaj = (yuzde: number) => {
    if (yuzde >= 90) return { emoji: '🏆', text: 'Mükemmel Başarı!' };
    if (yuzde >= 80) return { emoji: '🎉', text: 'Harika!' };
    if (yuzde >= 70) return { emoji: '⭐', text: 'Çok İyi!' };
    if (yuzde >= 60) return { emoji: '👍', text: 'İyi!' };
    if (yuzde >= 50) return { emoji: '📚', text: 'Geçtiniz!' };
    return { emoji: '💪', text: 'Tekrar Deneyin' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Award className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MinusCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sonuç Bulunamadı</h3>
          <p className="text-gray-500 mb-4">Bu sınava ait sonuç bulunamadı</p>
          <button
            onClick={() => router.push('/ogrenci/sinavlar')}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Sınavlara Dön
          </button>
        </div>
      </div>
    );
  }

  const basariMesaj = getBasariMesaj(data.yuzde || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push('/ogrenci/sinavlar')} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{data.sinav.baslik}</h1>
                <p className="text-xs text-gray-500">Sınav Sonucu</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Sonuç Özeti */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 mb-6">
          {/* Başarı Mesajı */}
          <div className={`text-center mb-6 p-4 rounded-2xl bg-gradient-to-r ${getGradient(data.yuzde || 0)}`}>
            <span className="text-4xl">{basariMesaj.emoji}</span>
            <p className="text-xl font-bold text-white mt-2">{basariMesaj.text}</p>
          </div>

          {/* Puan Dairesi */}
          <div className="relative w-44 h-44 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="75"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="88"
                cy="88"
                r="75"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="12"
                strokeDasharray={471}
                strokeDashoffset={471 - (471 * (data.yuzde || 0)) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getBasariRenk(data.yuzde || 0)}`}>
                {data.yuzde}%
              </span>
              <span className="text-sm text-gray-500 font-medium">Başarı Oranı</span>
            </div>
          </div>

          {/* Puan */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-gray-900">
              {data.toplamPuan} <span className="text-xl text-gray-400">/ {data.maxPuan}</span>
            </p>
            <p className="text-gray-500 font-medium">Toplam Puan</p>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-emerald-600">{data.dogruSayisi}</span>
              <p className="text-sm text-emerald-700 font-medium mt-1">Doğru</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-3xl font-bold text-red-500">{data.yanlisSayisi}</span>
              <p className="text-sm text-red-600 font-medium mt-1">Yanlış</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MinusCircle className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-3xl font-bold text-gray-500">{data.bosSayisi}</span>
              <p className="text-sm text-gray-600 font-medium mt-1">Boş</p>
            </div>
          </div>
        </div>

        {/* Detaylı Sonuçlar */}
        {data.detayGoster && data.sorular && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Soru Detayları
            </h2>
            
            {data.sorular.map((soru, index) => (
              <div 
                key={soru.id}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                  soru.dogruMu 
                    ? 'border-emerald-200' 
                    : soru.verilenCevap 
                      ? 'border-red-200' 
                      : 'border-gray-100'
                }`}
              >
                <div 
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDetailIndex(showDetailIndex === index ? null : index)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    soru.dogruMu 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : soru.verilenCevap 
                        ? 'bg-red-100 text-red-500' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {soru.dogruMu ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : soru.verilenCevap ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <MinusCircle className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-500">Soru {index + 1}</span>
                      <span className={`text-sm font-bold ${soru.dogruMu ? 'text-emerald-600' : 'text-gray-400'}`}>
                        +{soru.alinanPuan}/{soru.puan}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium line-clamp-2">{soru.soruMetni}</p>
                  </div>

                  <div className="flex-shrink-0 text-gray-400">
                    {showDetailIndex === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Detay */}
                {showDetailIndex === index && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-gray-700 my-4">{soru.soruMetni}</p>
                    
                    {soru.secenekler && (
                      <div className="space-y-2">
                        {soru.secenekler.map((secenek, i) => {
                          const harf = ['A', 'B', 'C', 'D', 'E'][i];
                          const dogruCevap = soru.dogruCevap === harf;
                          const verilenCevap = soru.verilenCevap === harf;
                          
                          return (
                            <div 
                              key={harf}
                              className={`flex items-center gap-3 p-3 rounded-xl ${
                                dogruCevap 
                                  ? 'bg-emerald-50 border-2 border-emerald-200' 
                                  : verilenCevap && !dogruCevap
                                    ? 'bg-red-50 border-2 border-red-200'
                                    : 'bg-gray-50 border border-gray-100'
                              }`}
                            >
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                dogruCevap 
                                  ? 'bg-emerald-500 text-white' 
                                  : verilenCevap 
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                              }`}>
                                {harf}
                              </span>
                              <span className={`flex-1 ${
                                dogruCevap ? 'text-emerald-700 font-medium' : verilenCevap ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {secenek}
                              </span>
                              {dogruCevap && (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm">
                      {soru.verilenCevap ? (
                        <span className="text-gray-600">
                          Verdiğiniz cevap: <span className={`font-bold ${soru.dogruMu ? 'text-emerald-600' : 'text-red-500'}`}>{soru.verilenCevap}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Bu soruyu boş bıraktınız</span>
                      )}
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-gray-600">
                        Doğru cevap: <span className="font-bold text-emerald-600">{soru.dogruCevap}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!data.detayGoster && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Detaylı sonuçlar öğretmen tarafından gizlenmiştir.</p>
          </div>
        )}

        {/* Geri Dön */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/ogrenci/sinavlar')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
          >
            Sınavlara Dön
          </button>
        </div>
      </main>
    </div>
  );
}
