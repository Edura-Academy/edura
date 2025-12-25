'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, User, BookOpen } from 'lucide-react';

interface Ders {
  id: string;
  ad: string;
  ogretmen: {
    id: string;
    ad: string;
    soyad: string;
  };
  baslangicSaati: string;
  bitisSaati: string;
}

interface DersProgram {
  [gun: string]: Ders[];
}

interface DersProgramiData {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
  };
  dersProgram: DersProgram;
}

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function CocukDersProgrami() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  
  const [data, setData] = useState<DersProgramiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGun, setSelectedGun] = useState<string>(() => {
    const today = new Date().getDay();
    return GUNLER[today === 0 ? 6 : today - 1];
  });

  useEffect(() => {
    fetchDersProgrami();
  }, [cocukId]);

  const fetchDersProgrami = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/veli/cocuk/${cocukId}/ders-programi`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Ders programı yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGunKisaAd = (gun: string) => {
    const kisaAdlar: Record<string, string> = {
      'Pazartesi': 'Pzt',
      'Salı': 'Sal',
      'Çarşamba': 'Çar',
      'Perşembe': 'Per',
      'Cuma': 'Cum',
      'Cumartesi': 'Cmt',
      'Pazar': 'Paz'
    };
    return kisaAdlar[gun] || gun;
  };

  const getBugunMu = (gun: string) => {
    const today = new Date().getDay();
    const todayGun = GUNLER[today === 0 ? 6 : today - 1];
    return gun === todayGun;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const selectedDersler = data?.dersProgram[selectedGun] || [];

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
              <h1 className="text-lg font-semibold text-white">Ders Programı</h1>
              <p className="text-xs text-slate-400">{data?.cocuk.ad} {data?.cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gün Seçici */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {GUNLER.map((gun) => {
            const gunDersler = data?.dersProgram[gun] || [];
            const isBugun = getBugunMu(gun);
            
            return (
              <button
                key={gun}
                onClick={() => setSelectedGun(gun)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                  selectedGun === gun
                    ? 'bg-purple-500 text-white'
                    : isBugun
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <p className="font-medium">{getGunKisaAd(gun)}</p>
                <p className="text-xs opacity-75">{gunDersler.length} ders</p>
              </button>
            );
          })}
        </div>

        {/* Seçili Günün Başlığı */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{selectedGun}</h2>
          {getBugunMu(selectedGun) && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
              Bugün
            </span>
          )}
        </div>

        {/* Ders Listesi */}
        {selectedDersler.length > 0 ? (
          <div className="space-y-4">
            {selectedDersler.map((ders, index) => (
              <div 
                key={ders.id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 flex items-center gap-4"
              >
                {/* Saat */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex flex-col items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-400 mb-1" />
                    <p className="text-xs text-purple-400 font-medium">{ders.baslangicSaati}</p>
                    <p className="text-xs text-slate-500">{ders.bitisSaati}</p>
                  </div>
                </div>

                {/* Ders Bilgisi */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    {ders.ad}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    {ders.ogretmen.ad} {ders.ogretmen.soyad}
                  </p>
                </div>

                {/* Sıra Numarası */}
                <div className="flex-shrink-0 w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <span className="text-sm text-slate-400">{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">{selectedGun} günü için ders bulunmuyor</p>
          </div>
        )}

        {/* Haftalık Özet */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-white font-medium mb-4">Haftalık Özet</h3>
          <div className="grid grid-cols-7 gap-2">
            {GUNLER.map((gun) => {
              const gunDersler = data?.dersProgram[gun] || [];
              const dersSayisi = gunDersler.length;
              
              return (
                <div 
                  key={gun}
                  className={`text-center p-2 rounded-lg ${
                    getBugunMu(gun) ? 'bg-purple-500/20' : 'bg-slate-700/30'
                  }`}
                >
                  <p className="text-xs text-slate-400">{getGunKisaAd(gun)}</p>
                  <p className={`text-lg font-bold ${
                    dersSayisi > 0 ? 'text-white' : 'text-slate-500'
                  }`}>
                    {dersSayisi}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-sm">
            <span className="text-slate-400">Toplam haftalık ders:</span>
            <span className="text-white font-medium">
              {GUNLER.reduce((sum, gun) => sum + (data?.dersProgram[gun]?.length || 0), 0)} ders
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

