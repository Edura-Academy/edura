'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  ArrowLeft, Users, BookOpen, ClipboardList, TrendingUp,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';

interface OgretmenData {
  dersler: { ders: string; sinif: string; ogrenciSayisi: number }[];
  yoklama: {
    ozet: { katildi: number; katilmadi: number };
    haftalik: { hafta: string; katilim: number }[];
  };
  odev: {
    durum: { toplam: number; teslimBekleyen: number; suresiDolmus: number };
    teslimOrani: { baslik: string; teslimSayisi: number; toplamOgrenci: number }[];
  };
  sinav: { baslik: string; ders: string; katilimci: number; ortalama: number }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function OgretmenRaporlar() {
  const router = useRouter();
  const [data, setData] = useState<OgretmenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ogretmen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data) return null;

  // Teslim oranı için veri hazırla
  const teslimOraniData = data.odev.teslimOrani.map(o => ({
    ...o,
    oran: Math.round((o.teslimSayisi / o.toplamOgrenci) * 100)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/personel')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Öğretmen Raporları</h1>
              <p className="text-xs text-slate-400">Ders ve öğrenci istatistikleri</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Özet Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data.dersler.length}</p>
                <p className="text-xs text-slate-400">Ders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.dersler.reduce((sum, d) => sum + d.ogrenciSayisi, 0)}
                </p>
                <p className="text-xs text-slate-400">Öğrenci</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data.odev.durum.toplam}</p>
                <p className="text-xs text-slate-400">Ödev</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi > 0
                    ? Math.round((data.yoklama.ozet.katildi / (data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi)) * 100)
                    : 100}%
                </p>
                <p className="text-xs text-slate-400">Katılım</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Ders Bazlı Öğrenci */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Ders Bazlı Öğrenci Sayısı
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dersler} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="ders" 
                    stroke="#94a3b8" 
                    fontSize={11}
                    width={80}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'Öğrenci']}
                  />
                  <Bar dataKey="ogrenciSayisi" radius={[0, 4, 4, 0]}>
                    {data.dersler.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Haftalık Katılım */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Haftalık Katılım Trendi
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.yoklama.haftalik}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hafta" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="katilim" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ödev Teslim Oranları */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Ödev Teslim Oranları
            </h3>
            {teslimOraniData.length > 0 ? (
              <div className="space-y-4">
                {teslimOraniData.slice(0, 5).map((odev, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 truncate max-w-[200px]">{odev.baslik}</span>
                      <span className="text-sm text-slate-400">{odev.teslimSayisi}/{odev.toplamOgrenci}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          odev.oran >= 80 ? 'bg-emerald-500' :
                          odev.oran >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${odev.oran}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">Henüz ödev bulunmuyor</p>
            )}
            
            {/* Ödev Durumu Özet */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700">
              <div className="text-center">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{data.odev.durum.teslimBekleyen}</p>
                <p className="text-xs text-slate-400">Aktif</p>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-400">{data.odev.durum.suresiDolmus}</p>
                <p className="text-xs text-slate-400">Süresi Dolmuş</p>
              </div>
              <div className="text-center">
                <AlertCircle className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-400">{data.odev.durum.toplam}</p>
                <p className="text-xs text-slate-400">Toplam</p>
              </div>
            </div>
          </div>

          {/* Sınav Sonuçları */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Sınav Sonuçları
            </h3>
            {data.sinav.length > 0 ? (
              <div className="space-y-3">
                {data.sinav.slice(0, 5).map((sinav, i) => (
                  <div key={i} className="p-3 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{sinav.baslik}</p>
                        <p className="text-xs text-slate-400">{sinav.ders} • {sinav.katilimci} katılımcı</p>
                      </div>
                      <div className={`text-xl font-bold ${
                        sinav.ortalama >= 70 ? 'text-emerald-400' :
                        sinav.ortalama >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        %{sinav.ortalama}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">Henüz sınav sonucu yok</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

