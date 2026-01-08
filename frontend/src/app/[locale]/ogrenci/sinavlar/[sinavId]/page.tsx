'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, AlertCircle,
  CheckCircle, Loader2, BookOpen
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/baslat/${sinavId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setKalanSure(result.data.sinav.kalanSure * 60);
        
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/cevap`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/bitir/${data.oturumId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
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
    if (kalanSure <= 60) return 'bg-red-500 text-white animate-pulse';
    if (kalanSure <= 300) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentSoru = data.sorular[currentIndex];
  const cevaplanmis = Object.keys(cevaplar).length;
  const toplam = data.sorular.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header - Modern ve Temiz */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{data.sinav.baslik}</h1>
                <p className="text-xs text-gray-500">Soru {currentIndex + 1} / {toplam}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Süre */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${getTimeColor()}`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(kalanSure)}</span>
              </div>
              
              {/* Bitir */}
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
              >
                <Flag className="w-4 h-4" />
                Bitir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Soru */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
          {/* Soru Metni */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Soru {currentIndex + 1}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                {currentSoru.puan} puan
              </span>
            </div>
            <p className="text-gray-800 text-lg leading-relaxed">{currentSoru.soruMetni}</p>
            
            {currentSoru.resimUrl && (
              <img 
                src={currentSoru.resimUrl} 
                alt="Soru görseli" 
                className="mt-4 max-w-full rounded-xl border border-gray-100"
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${
                      secili 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                      secili 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {harf}
                    </div>
                    <span className={`flex-1 ${secili ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                      {secenek}
                    </span>
                    {secili && <CheckCircle className="w-6 h-6 text-blue-500" />}
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
                const isTrue = opt === 'DOGRU';
                return (
                  <button
                    key={opt}
                    onClick={() => saveCevap(currentSoru.id, opt)}
                    className={`flex-1 p-5 rounded-xl border-2 transition-all ${
                      secili 
                        ? isTrue 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`font-semibold text-lg ${
                      secili 
                        ? isTrue ? 'text-emerald-700' : 'text-red-700'
                        : 'text-gray-700'
                    }`}>
                      {isTrue ? '✓ Doğru' : '✗ Yanlış'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigasyon */}
        <div className="flex items-center justify-between mt-6">
          {/* Önceki Butonu - Sadece geri dönüş açıksa ve ilk soru değilse aktif */}
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || !data.sinav.geriDonus}
            className={`flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl transition-all font-medium ${
              currentIndex === 0 || !data.sinav.geriDonus
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Önceki
          </button>
          
          {/* Soru Numaraları */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {data.sorular.map((soru, i) => {
              const cevaplandi = !!cevaplar[soru.id];
              const aktif = i === currentIndex;
              // Sadece geri dönüş açıksa veya henüz o soruya gelinmemişse tıklanamaz
              const tiklabilir = data.sinav.geriDonus || i === currentIndex;
              
              return (
                <button
                  key={soru.id}
                  onClick={() => tiklabilir && setCurrentIndex(i)}
                  disabled={!tiklabilir}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                    aktif 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                      : cevaplandi 
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                  } ${tiklabilir && !aktif ? 'hover:bg-gray-200 cursor-pointer' : ''} ${!tiklabilir ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          {/* Sonraki veya Sınavı Bitir Butonu */}
          {currentIndex === toplam - 1 ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Sınavı Bitir
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(toplam - 1, prev + 1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Sonraki
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* İlerleme ve Bilgi */}
        <div className="mt-6 space-y-3">
          {/* Geri dönüş uyarısı */}
          {!data.sinav.geriDonus && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Bu sınavda sorulara geri dönüş kapalıdır. Her soruyu dikkatli cevaplayın!</span>
            </div>
          )}
          
          {/* İlerleme çubuğu */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">İlerleme</span>
              <span className="text-sm font-bold text-gray-900">{cevaplanmis} / {toplam}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all rounded-full"
                style={{ width: `${(cevaplanmis / toplam) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Onay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sınavı Bitir?</h3>
              <p className="text-gray-500 mt-2">
                {cevaplanmis < toplam && (
                  <span className="text-amber-600 font-semibold block mb-2">
                    ⚠️ {toplam - cevaplanmis} soru boş bırakıldı!
                  </span>
                )}
                Sınavı bitirmek istediğinize emin misiniz?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
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
