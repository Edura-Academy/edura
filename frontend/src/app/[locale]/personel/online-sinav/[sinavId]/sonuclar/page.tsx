'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Users, Award, TrendingUp, TrendingDown,
  CheckCircle, XCircle, BarChart2, Download
} from 'lucide-react';

interface Oturum {
  id: string;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
  };
  toplamPuan: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  yuzde: number;
  bitisZamani: string;
}

interface SoruAnaliz {
  soruId: string;
  siraNo: number;
  dogruOrani: number;
}

interface Istatistik {
  katilimci: number;
  ortalama: number;
  enYuksek: number;
  enDusuk: number;
  maxPuan: number;
  gecenSayisi: number;
}

interface SonucData {
  sinav: { id: string; baslik: string };
  istatistik: Istatistik;
  soruAnaliz: SoruAnaliz[];
  oturumlar: Oturum[];
}

export default function SinavSonuclari() {
  const router = useRouter();
  const params = useParams();
  const sinavId = params.sinavId as string;
  
  const [data, setData] = useState<SonucData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSonuclar();
  }, [sinavId]);

  const fetchSonuclar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/ogretmen/${sinavId}/sonuclar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBasariRenk = (yuzde: number) => {
    if (yuzde >= 80) return 'text-emerald-400';
    if (yuzde >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const gecmeOrani = data.istatistik.katilimci > 0 
    ? Math.round((data.istatistik.gecenSayisi / data.istatistik.katilimci) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/personel/online-sinav')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{data.sinav.baslik}</h1>
              <p className="text-xs text-slate-400">Sınav Sonuçları</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Katılımcı</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.istatistik.katilimci}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Ortalama</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{data.istatistik.ortalama}</p>
            <p className="text-xs text-slate-500">/ {data.istatistik.maxPuan}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">En Yüksek</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{data.istatistik.enYuksek}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Geçme Oranı</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{gecmeOrani}%</p>
            <p className="text-xs text-slate-500">{data.istatistik.gecenSayisi} kişi</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Soru Analizi */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-white font-semibold mb-4">Soru Bazlı Analiz</h2>
              <div className="space-y-3">
                {data.soruAnaliz.map((soru) => (
                  <div key={soru.soruId} className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm w-12">S{soru.siraNo}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          soru.dogruOrani >= 70 ? 'bg-emerald-500' : 
                          soru.dogruOrani >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${soru.dogruOrani}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${
                      soru.dogruOrani >= 70 ? 'text-emerald-400' : 
                      soru.dogruOrani >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {soru.dogruOrani}%
                    </span>
                  </div>
                ))}
              </div>
              
              {data.soruAnaliz.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    En zor soru: <span className="text-white">S{
                      data.soruAnaliz.reduce((min, s) => s.dogruOrani < min.dogruOrani ? s : min, data.soruAnaliz[0]).siraNo
                    }</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Öğrenci Listesi */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Öğrenci Sonuçları</h2>
                <span className="text-xs text-slate-400">{data.oturumlar.length} öğrenci</span>
              </div>
              
              {data.oturumlar.length > 0 ? (
                <div className="space-y-3">
                  {data.oturumlar.map((oturum, index) => (
                    <div 
                      key={oturum.id}
                      className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {oturum.ogrenci.ad} {oturum.ogrenci.soyad}
                        </p>
                        <p className="text-xs text-slate-400">{oturum.ogrenci.ogrenciNo}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {oturum.dogruSayisi}
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" />
                          {oturum.yanlisSayisi}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getBasariRenk(oturum.yuzde)}`}>
                          {oturum.yuzde}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {oturum.toplamPuan}/{data.istatistik.maxPuan}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Henüz sonuç yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

