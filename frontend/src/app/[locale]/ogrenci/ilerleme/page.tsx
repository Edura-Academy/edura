'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, Award, BookOpen, Calendar,
  Target, CheckCircle, Clock, Zap
} from 'lucide-react';

interface IlerlemeData {
  ozet: {
    genelOrtalama: number;
    sinavSayisi: number;
    odevTamamlanan: number;
    katilimOrani: number;
  };
  sinavTrend: { sinav: string; baslik: string; ders: string; puan: number }[];
  dersBasari: { ders: string; ortalama: number }[];
  yoklama: { katildi: number; katilmadi: number; gec: number };
  odev: { tamamlanan: number; bekleyen: number; ortalamaPuan: number };
  haftalikAktivite: { hafta: string; sinav: number; odev: number }[];
}

export default function OgrenciIlerleme() {
  const router = useRouter();
  const [data, setData] = useState<IlerlemeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ogrenci`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('İlerleme yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return null;

  // Radar chart için ders verileri
  const radarData = data.dersBasari.map(d => ({
    ders: d.ders.length > 8 ? d.ders.substring(0, 8) + '...' : d.ders,
    puan: d.ortalama,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/ogrenci')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">İlerleme Raporu</h1>
              <p className="text-xs text-slate-400">Başarı ve aktivite özeti</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Özet Skor */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl border border-blue-500/30 p-6 mb-8 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={352}
                strokeDashoffset={352 - (352 * data.ozet.genelOrtalama) / 100}
                strokeLinecap="round"
                className={getScoreColor(data.ozet.genelOrtalama)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(data.ozet.genelOrtalama)}`}>
                {data.ozet.genelOrtalama}
              </span>
              <span className="text-xs text-slate-400">Ortalama</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-2xl font-bold text-white">{data.ozet.sinavSayisi}</p>
              <p className="text-xs text-slate-400">Sınav</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{data.ozet.odevTamamlanan}</p>
              <p className="text-xs text-slate-400">Ödev</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{data.ozet.katilimOrani}%</p>
              <p className="text-xs text-slate-400">Katılım</p>
            </div>
          </div>
        </div>

        {/* Sınav Trend */}
        {data.sinavTrend.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Sınav Performansı
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sinavTrend}>
                  <defs>
                    <linearGradient id="colorPuan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="sinav" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value}%`,
                      props.payload.baslik
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="puan" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPuan)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ders Bazlı Başarı (Radar) */}
          {radarData.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Ders Bazlı Başarı
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="ders" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                    <Radar
                      name="Puan"
                      dataKey="puan"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Haftalık Aktivite */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Haftalık Aktivite
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.haftalikAktivite}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hafta" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sinav" fill="#3b82f6" name="Sınav" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="odev" fill="#10b981" name="Ödev" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 gap-4">
          {/* Yoklama */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Yoklama
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Katıldı</span>
                <span className="text-emerald-400 font-medium">{data.yoklama.katildi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Katılmadı</span>
                <span className="text-red-400 font-medium">{data.yoklama.katilmadi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Geç</span>
                <span className="text-amber-400 font-medium">{data.yoklama.gec}</span>
              </div>
            </div>
          </div>

          {/* Ödev */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Ödevler
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Tamamlanan</span>
                <span className="text-emerald-400 font-medium">{data.odev.tamamlanan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Bekleyen</span>
                <span className="text-amber-400 font-medium">{data.odev.bekleyen}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Ortalama Puan</span>
                <span className={`font-medium ${getScoreColor(data.odev.ortalamaPuan)}`}>
                  {data.odev.ortalamaPuan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivasyon Mesajı */}
        <div className={`mt-6 p-4 rounded-2xl bg-gradient-to-r ${getScoreGradient(data.ozet.genelOrtalama)} text-center`}>
          <p className="text-white font-medium">
            {data.ozet.genelOrtalama >= 80 
              ? '🌟 Harika gidiyorsun! Başarını sürdür!' 
              : data.ozet.genelOrtalama >= 60 
                ? '💪 İyi bir performans! Biraz daha çaba ile zirveye ulaşabilirsin!' 
                : '📚 Çalışmaya devam et, her gün biraz daha iyiye!'}
          </p>
        </div>
      </main>
    </div>
  );
}

