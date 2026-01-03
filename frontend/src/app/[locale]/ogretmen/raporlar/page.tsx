'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  Calendar
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface RaporData {
  genel: {
    toplamOgrenci: number;
    toplamDers: number;
    toplamOdev: number;
    toplamSinav: number;
  };
  yoklama: {
    ortalamaKatilim: number;
    toplamYoklama: number;
    devamsizlar: number;
  };
  odevler: {
    verilen: number;
    teslimEdilen: number;
    bekleyen: number;
    ortalamaPuan: number;
  };
  sinavlar: {
    yapilan: number;
    ortalamaPuan: number;
    enYuksek: number;
    enDusuk: number;
  };
  dersler: Array<{
    id: string;
    ad: string;
    sinif: string;
    ogrenciSayisi: number;
    katilimOrani: number;
    odevTeslimOrani: number;
  }>;
}

function OgretmenRaporlarContent() {
  const [raporData, setRaporData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRaporlar();
  }, [dateRange]);

  const fetchRaporlar = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dashboard/ogretmen/rapor?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRaporData(data.data);
      } else {
        // Mock data
        setRaporData({
          genel: { toplamOgrenci: 120, toplamDers: 8, toplamOdev: 24, toplamSinav: 6 },
          yoklama: { ortalamaKatilim: 85, toplamYoklama: 180, devamsizlar: 15 },
          odevler: { verilen: 24, teslimEdilen: 280, bekleyen: 45, ortalamaPuan: 75 },
          sinavlar: { yapilan: 6, ortalamaPuan: 68, enYuksek: 95, enDusuk: 32 },
          dersler: [
            { id: '1', ad: 'Matematik', sinif: '10-A', ogrenciSayisi: 30, katilimOrani: 92, odevTeslimOrani: 88 },
            { id: '2', ad: 'Matematik', sinif: '10-B', ogrenciSayisi: 28, katilimOrani: 87, odevTeslimOrani: 82 },
            { id: '3', ad: 'Matematik', sinif: '11-A', ogrenciSayisi: 32, katilimOrani: 90, odevTeslimOrani: 85 },
          ]
        });
      }
    } catch (error) {
      console.error('Raporlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Raporlar</h1>
                <p className="text-teal-100 text-sm">Performans ve istatistikler</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/20 rounded-lg text-white border-0 focus:ring-2 focus:ring-white/50"
              >
                <option value="week" className="text-slate-800">Bu Hafta</option>
                <option value="month" className="text-slate-800">Bu Ay</option>
                <option value="semester" className="text-slate-800">Bu Dönem</option>
                <option value="year" className="text-slate-800">Bu Yıl</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {raporData && (
          <>
            {/* Genel İstatistikler */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Toplam Öğrenci</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{raporData.genel.toplamOgrenci}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Toplam Ders</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{raporData.genel.toplamDers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Verilen Ödev</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{raporData.genel.toplamOdev}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Yapılan Sınav</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{raporData.genel.toplamSinav}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Yoklama Raporu */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Yoklama Raporu
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Ortalama Katılım</span>
                    <span className="font-bold text-green-600">%{raporData.yoklama.ortalamaKatilim}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${raporData.yoklama.ortalamaKatilim}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{raporData.yoklama.toplamYoklama}</p>
                      <p className="text-xs text-slate-500">Toplam Yoklama</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{raporData.yoklama.devamsizlar}</p>
                      <p className="text-xs text-slate-500">Devamsız</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ödev Raporu */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Ödev Raporu
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Teslim Oranı</span>
                    <span className="font-bold text-amber-600">
                      %{Math.round((raporData.odevler.teslimEdilen / (raporData.odevler.verilen * 10)) * 100)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{raporData.odevler.verilen}</p>
                      <p className="text-xs text-slate-500">Verilen</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{raporData.odevler.teslimEdilen}</p>
                      <p className="text-xs text-slate-500">Teslim</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{raporData.odevler.bekleyen}</p>
                      <p className="text-xs text-slate-500">Bekleyen</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{raporData.odevler.ortalamaPuan}</p>
                      <p className="text-xs text-slate-500">Ort. Puan</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sınav Raporu */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Sınav Raporu
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Ortalama Puan</span>
                    <span className="font-bold text-purple-600">{raporData.sinavlar.ortalamaPuan}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{raporData.sinavlar.yapilan}</p>
                      <p className="text-xs text-slate-500">Yapılan</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{raporData.sinavlar.ortalamaPuan}</p>
                      <p className="text-xs text-slate-500">Ortalama</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{raporData.sinavlar.enYuksek}</p>
                      <p className="text-xs text-slate-500">En Yüksek</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{raporData.sinavlar.enDusuk}</p>
                      <p className="text-xs text-slate-500">En Düşük</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ders Bazlı Performans */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Ders Bazlı Performans
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-4 text-sm font-medium text-slate-600">Ders</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-600">Sınıf</th>
                      <th className="text-center p-4 text-sm font-medium text-slate-600">Öğrenci</th>
                      <th className="text-center p-4 text-sm font-medium text-slate-600">Katılım</th>
                      <th className="text-center p-4 text-sm font-medium text-slate-600">Ödev Teslim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raporData.dersler.map((ders) => (
                      <tr key={ders.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-800">{ders.ad}</td>
                        <td className="p-4 text-slate-600">{ders.sinif}</td>
                        <td className="p-4 text-center text-slate-600">{ders.ogrenciSayisi}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            ders.katilimOrani >= 90 ? 'bg-green-100 text-green-700' :
                            ders.katilimOrani >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            %{ders.katilimOrani}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            ders.odevTeslimOrani >= 90 ? 'bg-green-100 text-green-700' :
                            ders.odevTeslimOrani >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            %{ders.odevTeslimOrani}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OgretmenRaporlarPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenRaporlarContent />
    </RoleGuard>
  );
}

