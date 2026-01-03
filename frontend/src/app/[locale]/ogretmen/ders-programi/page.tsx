'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Ders {
  id: string;
  ad: string;
  gun: string;
  baslangicSaati: string;
  bitisSaati: string;
  sinif: {
    id: string;
    ad: string;
  };
  ogrenciSayisi: number;
}

const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const saatler = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const gunRenkleri: Record<string, string> = {
  'Pazartesi': 'bg-blue-500',
  'Salı': 'bg-green-500',
  'Çarşamba': 'bg-purple-500',
  'Perşembe': 'bg-orange-500',
  'Cuma': 'bg-pink-500',
  'Cumartesi': 'bg-teal-500',
  'Pazar': 'bg-amber-500'
};

function OgretmenDersProgramiContent() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'haftalik' | 'liste'>('haftalik');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDersler();
  }, []);

  const fetchDersler = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ders-programi/ogretmen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDersler(data.data);
      } else {
        setDersler(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Ders programı alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gün ve saate göre dersi bul
  const getDersForGunSaat = (gun: string, saat: string) => {
    return dersler.find(d => {
      const dersBaslangic = d.baslangicSaati.substring(0, 5);
      return d.gun === gun && dersBaslangic === saat;
    });
  };

  // Toplam ders saati hesapla
  const toplamDersSaati = dersler.reduce((acc, d) => {
    const baslangic = parseInt(d.baslangicSaati.split(':')[0]);
    const bitis = parseInt(d.bitisSaati.split(':')[0]);
    return acc + (bitis - baslangic);
  }, 0);

  // Günlere göre dersler
  const derslerByGun = gunler.map(gun => ({
    gun,
    dersler: dersler.filter(d => d.gun === gun).sort((a, b) => a.baslangicSaati.localeCompare(b.baslangicSaati))
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Ders Programı</h1>
                <p className="text-blue-100 text-sm">Haftalık ders programınız</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('haftalik')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'haftalik' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode('liste')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'liste' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{dersler.length}</p>
                <p className="text-slate-500 text-sm">Toplam Ders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{toplamDersSaati}</p>
                <p className="text-slate-500 text-sm">Haftalık Saat</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {dersler.reduce((acc, d) => acc + (d.ogrenciSayisi || 0), 0)}
                </p>
                <p className="text-slate-500 text-sm">Toplam Öğrenci</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {new Set(dersler.map(d => d.gun)).size}
                </p>
                <p className="text-slate-500 text-sm">Ders Günü</p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'haftalik' ? (
          /* Haftalık Görünüm */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 text-left text-sm font-medium text-slate-600 w-20">Saat</th>
                    {gunler.slice(0, 6).map(gun => (
                      <th key={gun} className="p-3 text-center text-sm font-medium text-slate-600">{gun}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saatler.map(saat => (
                    <tr key={saat} className="border-t border-slate-100">
                      <td className="p-3 text-sm text-slate-500 font-medium">{saat}</td>
                      {gunler.slice(0, 6).map(gun => {
                        const ders = getDersForGunSaat(gun, saat);
                        return (
                          <td key={`${gun}-${saat}`} className="p-2">
                            {ders ? (
                              <div className={`${gunRenkleri[gun]} text-white p-3 rounded-lg text-sm`}>
                                <p className="font-medium">{ders.ad}</p>
                                <p className="text-white/80 text-xs mt-1">{ders.sinif.ad}</p>
                                <p className="text-white/70 text-xs">{ders.baslangicSaati} - {ders.bitisSaati}</p>
                              </div>
                            ) : (
                              <div className="h-16"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Liste Görünüm */
          <div className="space-y-4">
            {derslerByGun.filter(g => g.dersler.length > 0).map(({ gun, dersler: gunDersleri }) => (
              <div key={gun} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className={`${gunRenkleri[gun]} text-white px-4 py-3`}>
                  <h3 className="font-semibold">{gun}</h3>
                  <p className="text-white/80 text-sm">{gunDersleri.length} ders</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {gunDersleri.map(ders => (
                    <div key={ders.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-800">{ders.baslangicSaati}</p>
                          <p className="text-xs text-slate-500">{ders.bitisSaati}</p>
                        </div>
                        <div className="w-px h-12 bg-slate-200"></div>
                        <div>
                          <p className="font-medium text-slate-800">{ders.ad}</p>
                          <p className="text-sm text-slate-500">{ders.sinif.ad}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{ders.ogrenciSayisi || 0} öğrenci</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {dersler.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Ders programı boş</h3>
                <p className="text-slate-500">Henüz size atanmış ders bulunmuyor</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OgretmenDersProgramiPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenDersProgramiContent />
    </RoleGuard>
  );
}

