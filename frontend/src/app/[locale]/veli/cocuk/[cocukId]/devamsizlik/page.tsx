'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, CheckCircle, XCircle, 
  Clock, AlertTriangle, Filter
} from 'lucide-react';

interface Yoklama {
  id: string;
  tarih: string;
  durum: string;
  aciklama: string | null;
  course: {
    id: string;
    ad: string;
  };
}

interface Istatistikler {
  toplam: number;
  katildi: number;
  katilmadi: number;
  gecKaldi: number;
  izinli: number;
}

interface DevamsizlikData {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
  };
  yoklamalar: Yoklama[];
  istatistikler: Istatistikler;
}

export default function CocukDevamsizlik() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  
  const [data, setData] = useState<DevamsizlikData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('TUMU');

  useEffect(() => {
    fetchDevamsizlik();
  }, [cocukId]);

  const fetchDevamsizlik = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/veli/cocuk/${cocukId}/devamsizlik`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Devamsızlık yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bg: string }> = {
      KATILDI: { label: 'Katıldı', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      KATILMADI: { label: 'Katılmadı', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      GEC_KALDI: { label: 'Geç Kaldı', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      IZINLI: { label: 'İzinli', icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/20' }
    };
    return configs[durum] || configs.KATILDI;
  };

  const filteredYoklamalar = data?.yoklamalar.filter(y => 
    filter === 'TUMU' || y.durum === filter
  ) || [];

  // Günlere göre grupla
  const groupedByDate = filteredYoklamalar.reduce((acc: Record<string, Yoklama[]>, yoklama) => {
    const date = new Date(yoklama.tarih).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(yoklama);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const devamOrani = data?.istatistikler.toplam 
    ? Math.round((data.istatistikler.katildi / data.istatistikler.toplam) * 100)
    : 100;

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
              <h1 className="text-lg font-semibold text-white">Devamsızlık Kayıtları</h1>
              <p className="text-xs text-slate-400">{data?.cocuk.ad} {data?.cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İstatistikler */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Devam Oranı</p>
              <p className={`text-3xl font-bold ${
                devamOrani >= 80 ? 'text-emerald-400' :
                devamOrani >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {devamOrani}%
              </p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              devamOrani >= 80 ? 'bg-emerald-500/20' :
              devamOrani >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <Calendar className={`w-8 h-8 ${
                devamOrani >= 80 ? 'text-emerald-400' :
                devamOrani >= 60 ? 'text-amber-400' : 'text-red-400'
              }`} />
            </div>
          </div>

          {/* Detay İstatistikler */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
            <button 
              onClick={() => setFilter('KATILDI')}
              className={`text-center p-2 rounded-lg transition-colors ${filter === 'KATILDI' ? 'bg-emerald-500/20' : 'hover:bg-slate-700/50'}`}
            >
              <p className="text-xl font-bold text-emerald-400">{data?.istatistikler.katildi || 0}</p>
              <p className="text-xs text-slate-400">Katıldı</p>
            </button>
            <button 
              onClick={() => setFilter('KATILMADI')}
              className={`text-center p-2 rounded-lg transition-colors ${filter === 'KATILMADI' ? 'bg-red-500/20' : 'hover:bg-slate-700/50'}`}
            >
              <p className="text-xl font-bold text-red-400">{data?.istatistikler.katilmadi || 0}</p>
              <p className="text-xs text-slate-400">Katılmadı</p>
            </button>
            <button 
              onClick={() => setFilter('GEC_KALDI')}
              className={`text-center p-2 rounded-lg transition-colors ${filter === 'GEC_KALDI' ? 'bg-amber-500/20' : 'hover:bg-slate-700/50'}`}
            >
              <p className="text-xl font-bold text-amber-400">{data?.istatistikler.gecKaldi || 0}</p>
              <p className="text-xs text-slate-400">Geç</p>
            </button>
            <button 
              onClick={() => setFilter('IZINLI')}
              className={`text-center p-2 rounded-lg transition-colors ${filter === 'IZINLI' ? 'bg-blue-500/20' : 'hover:bg-slate-700/50'}`}
            >
              <p className="text-xl font-bold text-blue-400">{data?.istatistikler.izinli || 0}</p>
              <p className="text-xs text-slate-400">İzinli</p>
            </button>
          </div>
        </div>

        {/* Filtre */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Yoklama Kayıtları</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="TUMU">Tümü</option>
              <option value="KATILDI">Katıldı</option>
              <option value="KATILMADI">Katılmadı</option>
              <option value="GEC_KALDI">Geç Kaldı</option>
              <option value="IZINLI">İzinli</option>
            </select>
          </div>
        </div>

        {/* Yoklama Listesi */}
        {Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedByDate)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, yoklamalar]) => (
                <div key={date} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                  {/* Tarih Header */}
                  <div className="px-4 py-3 bg-slate-700/30 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-white">{formatDate(date)}</p>
                  </div>
                  
                  {/* Yoklamalar */}
                  <div className="divide-y divide-slate-700/30">
                    {yoklamalar.map((yoklama) => {
                      const config = getDurumConfig(yoklama.durum);
                      const Icon = config.icon;
                      
                      return (
                        <div key={yoklama.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{yoklama.course.ad}</p>
                              {yoklama.aciklama && (
                                <p className="text-xs text-slate-400">{yoklama.aciklama}</p>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">
              {filter === 'TUMU' ? 'Henüz yoklama kaydı bulunmuyor' : 'Bu filtreye uygun kayıt yok'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

