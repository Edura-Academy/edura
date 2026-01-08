'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, ChevronLeft, ChevronRight,
  Video, FileText, ClipboardCheck, Clock, AlertCircle,
  Download
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

interface TakvimEtkinlik {
  id: string;
  baslik: string;
  tip: 'canli_ders' | 'sinav' | 'odev';
  baslangic: string;
  bitis: string;
  renk: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const tipConfig = {
  canli_ders: { icon: Video, label: 'Canlı Ders', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/50' },
  sinav: { icon: ClipboardCheck, label: 'Sınav', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/50' },
  odev: { icon: FileText, label: 'Ödev Teslimi', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/50' }
};

function OgrenciTakvimContent() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [etkinlikler, setEtkinlikler] = useState<TakvimEtkinlik[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const yil = currentDate.getFullYear();
  const ay = currentDate.getMonth();

  useEffect(() => {
    fetchTakvim();
  }, [yil, ay, token]);

  const fetchTakvim = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ders-programi/takvim?yil=${yil}&ay=${ay + 1}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEtkinlikler(data.data.etkinlikler || []);
      }
    } catch (error) {
      console.error('Takvim verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportIcal = async () => {
    try {
      const res = await fetch(`${API_URL}/ders-programi/export/ical`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ders-programi.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('iCal export hatası:', error);
    }
  };

  // Ayın ilk günü ve gün sayısı
  const ilkGun = new Date(yil, ay, 1).getDay();
  const gunSayisi = new Date(yil, ay + 1, 0).getDate();
  const ayAdi = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Günleri oluştur
  const gunler = [];
  const bosSayisi = ilkGun === 0 ? 6 : ilkGun - 1; // Pazartesi başlangıcı için ayarla
  
  for (let i = 0; i < bosSayisi; i++) {
    gunler.push(null);
  }
  
  for (let gun = 1; gun <= gunSayisi; gun++) {
    gunler.push(gun);
  }

  // Belirli bir gündeki etkinlikler
  const getGunEtkinlikleri = (gun: number) => {
    return etkinlikler.filter(e => {
      const tarih = new Date(e.baslangic);
      return tarih.getDate() === gun && tarih.getMonth() === ay && tarih.getFullYear() === yil;
    });
  };

  // Önceki/Sonraki ay
  const prevMonth = () => {
    setCurrentDate(new Date(yil, ay - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(yil, ay + 1, 1));
    setSelectedDay(null);
  };

  // Seçili günün etkinlikleri
  const selectedDayEtkinlikleri = selectedDay ? getGunEtkinlikleri(selectedDay) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ogrenci" className="p-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Takvim</h1>
                  <p className="text-xs text-slate-400">Etkinlikler ve önemli tarihler</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportIcal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">iCal İndir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Takvim */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              {/* Ay Navigasyonu */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white capitalize">{ayAdi}</h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Gün İsimleri */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(gun => (
                  <div key={gun} className="text-center text-xs font-medium text-slate-500 py-2">
                    {gun}
                  </div>
                ))}
              </div>

              {/* Takvim Günleri */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {gunler.map((gun, idx) => {
                    if (gun === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const gunEtkinlikleri = getGunEtkinlikleri(gun);
                    const bugun = new Date();
                    const isBugun = gun === bugun.getDate() && ay === bugun.getMonth() && yil === bugun.getFullYear();
                    const isSelected = gun === selectedDay;

                    return (
                      <button
                        key={gun}
                        onClick={() => setSelectedDay(gun)}
                        className={`aspect-square p-1 rounded-lg transition-all relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isBugun
                            ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500'
                            : 'hover:bg-slate-700/50 text-white'
                        }`}
                      >
                        <span className="text-sm font-medium">{gun}</span>
                        {gunEtkinlikleri.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {gunEtkinlikleri.slice(0, 3).map((e, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  e.tip === 'canli_ders' ? 'bg-purple-500' :
                                  e.tip === 'sinav' ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tip Açıklaması */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-700/50">
                {Object.entries(tipConfig).map(([tip, config]) => (
                  <div key={tip} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      tip === 'canli_ders' ? 'bg-purple-500' :
                      tip === 'sinav' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs text-slate-400">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seçili Gün Detayı */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedDay ? (
                  <span>
                    {selectedDay} {currentDate.toLocaleDateString('tr-TR', { month: 'long' })}
                  </span>
                ) : (
                  'Gün Seçin'
                )}
              </h3>

              {selectedDay ? (
                selectedDayEtkinlikleri.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEtkinlikleri.map((etkinlik) => {
                      const config = tipConfig[etkinlik.tip];
                      const Icon = config.icon;
                      const saat = new Date(etkinlik.baslangic).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div
                          key={etkinlik.id}
                          className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-slate-800/50`}>
                              <Icon className={`w-4 h-4 ${config.textColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{etkinlik.baslik}</h4>
                              <p className={`text-sm ${config.textColor} flex items-center gap-1 mt-1`}>
                                <Clock className="w-3 h-3" />
                                {saat}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Bu günde etkinlik yok</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Detayları görmek için bir gün seçin</p>
                </div>
              )}
            </div>

            {/* Yaklaşan Etkinlikler */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Yaklaşan Etkinlikler
              </h3>
              
              {etkinlikler.length > 0 ? (
                <div className="space-y-3">
                  {etkinlikler
                    .filter(e => new Date(e.baslangic) >= new Date())
                    .sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime())
                    .slice(0, 5)
                    .map((etkinlik) => {
                      const config = tipConfig[etkinlik.tip];
                      const Icon = config.icon;
                      const tarih = new Date(etkinlik.baslangic);
                      
                      return (
                        <div key={etkinlik.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-4 h-4 ${config.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{etkinlik.baslik}</p>
                            <p className="text-xs text-slate-400">
                              {tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {tarih.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">Yaklaşan etkinlik yok</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OgrenciTakvim() {
  return (
    <RoleGuard allowedRoles={['ogrenci']}>
      <OgrenciTakvimContent />
    </RoleGuard>
  );
}

