'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, AlertCircle,
  CheckCircle, Circle, Loader2
} from 'lucide-react';

interface Soru {
  id: string;
  soruMetni: string;
  soruTipi: string;
  puan: number;
  secenekler: string[] | null;
  resimUrl: string | null;
  cevap: string | null;
}

interface SinavData {
  oturumId: string;
  sinav: {
    id: string;
    baslik: string;
    sure: number;
    kalanSure: number;
    geriDonus: boolean;
    sonucGoster: boolean;
  };
  sorular: Soru[];
}

export default function SinavCoz() {
  const router = useRouter();
  const params = useParams();
  const sinavId = params.sinavId as string;
  
  const [data, setData] = useState<SinavData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Record<string, string>>({});
  const [kalanSure, setKalanSure] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startSinav();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sinavId]);

  useEffect(() => {
    if (kalanSure > 0) {
      timerRef.current = setInterval(() => {
        setKalanSure(prev => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [kalanSure > 0]);

  const startSinav = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/baslat/${sinavId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setKalanSure(result.data.sinav.kalanSure * 60); // dakikayı saniyeye çevir
        
        // Mevcut cevapları yükle
        const mevcutCevaplar: Record<string, string> = {};
        result.data.sorular.forEach((soru: Soru) => {
          if (soru.cevap) {
            mevcutCevaplar[soru.id] = soru.cevap;
          }
        });
        setCevaplar(mevcutCevaplar);
      } else {
        const result = await response.json();
        alert(result.message);
        router.push('/ogrenci/sinavlar');
      }
    } catch (error) {
      console.error('Sınav başlatma hatası:', error);
      router.push('/ogrenci/sinavlar');
    } finally {
      setLoading(false);
    }
  };

  const saveCevap = useCallback(async (soruId: string, cevap: string) => {
    if (!data) return;
    
    setCevaplar(prev => ({ ...prev, [soruId]: cevap }));
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/cevap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oturumId: data.oturumId,
          soruId,
          cevap
        })
      });
    } catch (error) {
      console.error('Cevap kaydetme hatası:', error);
    }
  }, [data]);

  const handleFinish = async () => {
    if (!data || submitting) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/bitir/${data.oturumId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        router.push(`/ogrenci/sinavlar/${sinavId}/sonuc`);
      }
    } catch (error) {
      console.error('Sınav bitirme hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (kalanSure <= 60) return 'text-red-500 animate-pulse';
    if (kalanSure <= 300) return 'text-amber-500';
    return 'text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentSoru = data.sorular[currentIndex];
  const cevaplanmis = Object.keys(cevaplar).length;
  const toplam = data.sorular.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div>
              <h1 className="text-white font-medium">{data.sinav.baslik}</h1>
              <p className="text-xs text-slate-400">Soru {currentIndex + 1} / {toplam}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Süre */}
              <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg ${getTimeColor()}`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(kalanSure)}</span>
              </div>
              
              {/* Bitir */}
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
              >
                <Flag className="w-4 h-4" />
                Bitir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Soru */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          {/* Soru Metni */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 text-sm font-medium">Soru {currentIndex + 1}</span>
              <span className="text-slate-400 text-sm">{currentSoru.puan} puan</span>
            </div>
            <p className="text-white text-lg">{currentSoru.soruMetni}</p>
            
            {currentSoru.resimUrl && (
              <img 
                src={currentSoru.resimUrl} 
                alt="Soru görseli" 
                className="mt-4 max-w-full rounded-lg"
              />
            )}
          </div>

          {/* Seçenekler */}
          {currentSoru.soruTipi === 'COKTAN_SECMELI' && currentSoru.secenekler && (
            <div className="space-y-3">
              {currentSoru.secenekler.map((secenek, i) => {
                const harf = ['A', 'B', 'C', 'D', 'E'][i];
                const secili = cevaplar[currentSoru.id] === harf;
                
                return (
                  <button
                    key={harf}
                    onClick={() => saveCevap(currentSoru.id, harf)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      secili 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      secili ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {harf}
                    </div>
                    <span className="text-white flex-1">{secenek}</span>
                    {secili && <CheckCircle className="w-5 h-5 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Doğru/Yanlış */}
          {currentSoru.soruTipi === 'DOGRU_YANLIS' && (
            <div className="flex gap-4">
              {['DOGRU', 'YANLIS'].map(opt => {
                const secili = cevaplar[currentSoru.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => saveCevap(currentSoru.id, opt)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      secili 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    }`}
                  >
                    <span className="text-white font-medium">
                      {opt === 'DOGRU' ? 'Doğru' : 'Yanlış'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigasyon */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || (!data.sinav.geriDonus && currentIndex > 0)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Önceki
          </button>
          
          {/* Soru Numaraları */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {data.sorular.map((soru, i) => {
              const cevaplandi = !!cevaplar[soru.id];
              const aktif = i === currentIndex;
              
              return (
                <button
                  key={soru.id}
                  onClick={() => data.sinav.geriDonus && setCurrentIndex(i)}
                  disabled={!data.sinav.geriDonus && i !== currentIndex}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    aktif 
                      ? 'bg-purple-500 text-white' 
                      : cevaplandi 
                        ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700'
                  } ${!data.sinav.geriDonus && i !== currentIndex ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentIndex(prev => Math.min(toplam - 1, prev + 1))}
            disabled={currentIndex === toplam - 1}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sonraki
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* İlerleme */}
        <div className="mt-6 text-center">
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${(cevaplanmis / toplam) * 100}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {cevaplanmis} / {toplam} soru cevaplandı
          </p>
        </div>
      </main>

      {/* Onay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Sınavı Bitir?</h3>
              <p className="text-slate-400 mt-2">
                {cevaplanmis < toplam && (
                  <span className="text-amber-400 block mb-2">
                    {toplam - cevaplanmis} soru boş bırakıldı!
                  </span>
                )}
                Sınavı bitirmek istediğinize emin misiniz?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flag className="w-5 h-5" />}
                Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

