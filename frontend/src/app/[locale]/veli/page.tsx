'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, BookOpen, Calendar, FileText, Bell, 
  TrendingUp, AlertCircle, Clock, ChevronRight,
  GraduationCap, MessageSquare, Settings, LogOut,
  CheckCircle, XCircle, AlertTriangle, User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Cocuk {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif: {
    id: string;
    ad: string;
    seviye: number;
    tip: string;
  };
  kurs: {
    id: string;
    ad: string;
  };
  ozet: {
    devamsizlikSayisi: number;
    bekleyenOdevler: number;
    teslimEdilmemisOdevler: number;
    sinavOrtalamasi: number | null;
  };
}

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  okundu: boolean;
  createdAt: string;
}

interface Duyuru {
  id: string;
  baslik: string;
  oncelik: string;
  createdAt: string;
}

interface DashboardData {
  cocuklar: Cocuk[];
  bildirimler: Bildirim[];
  duyurular: Duyuru[];
}

function VeliDashboardContent() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  const fetchDashboard = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/veli/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrtalamaRenk = (ortalama: number | null) => {
    if (ortalama === null) return 'text-gray-400';
    if (ortalama >= 80) return 'text-emerald-500';
    if (ortalama >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Edura</h1>
                <p className="text-xs text-slate-400">Veli Portalı</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {data?.bildirimler && data.bildirimler.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {data.bildirimler.length}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-700/50 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.ad} {user?.soyad}</p>
                  <p className="text-xs text-slate-400">Veli</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hoşgeldin Mesajı */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Hoş Geldiniz, {user?.ad}!
          </h2>
          <p className="text-slate-400">
            Çocuklarınızın akademik durumunu buradan takip edebilirsiniz.
          </p>
        </div>

        {/* Çocuklar Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Çocuklarım
          </h3>
          
          {data?.cocuklar && data.cocuklar.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.cocuklar.map((cocuk) => (
                <div 
                  key={cocuk.id}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
                  onClick={() => router.push(`/veli/cocuk/${cocuk.id}`)}
                >
                  {/* Çocuk Bilgileri */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {cocuk.ad[0]}{cocuk.soyad[0]}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{cocuk.ad} {cocuk.soyad}</h4>
                        <p className="text-sm text-slate-400">{cocuk.sinif?.ad} • {cocuk.kurs?.ad}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </div>

                  {/* İstatistikler */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Devamsızlık */}
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className={`w-4 h-4 ${cocuk.ozet.devamsizlikSayisi > 3 ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className="text-xs text-slate-400">Devamsızlık</span>
                      </div>
                      <p className={`text-lg font-bold ${cocuk.ozet.devamsizlikSayisi > 3 ? 'text-red-400' : 'text-white'}`}>
                        {cocuk.ozet.devamsizlikSayisi}
                        <span className="text-xs font-normal text-slate-500 ml-1">gün</span>
                      </p>
                    </div>

                    {/* Sınav Ortalaması */}
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className={`w-4 h-4 ${getOrtalamaRenk(cocuk.ozet.sinavOrtalamasi)}`} />
                        <span className="text-xs text-slate-400">Ortalama</span>
                      </div>
                      <p className={`text-lg font-bold ${getOrtalamaRenk(cocuk.ozet.sinavOrtalamasi)}`}>
                        {cocuk.ozet.sinavOrtalamasi !== null ? `${cocuk.ozet.sinavOrtalamasi}%` : '-'}
                      </p>
                    </div>

                    {/* Bekleyen Ödevler */}
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className={`w-4 h-4 ${cocuk.ozet.bekleyenOdevler > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="text-xs text-slate-400">Bekleyen</span>
                      </div>
                      <p className={`text-lg font-bold ${cocuk.ozet.bekleyenOdevler > 0 ? 'text-amber-400' : 'text-white'}`}>
                        {cocuk.ozet.bekleyenOdevler}
                        <span className="text-xs font-normal text-slate-500 ml-1">ödev</span>
                      </p>
                    </div>

                    {/* Teslim Edilmemiş */}
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={`w-4 h-4 ${cocuk.ozet.teslimEdilmemisOdevler > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className="text-xs text-slate-400">Yapılmadı</span>
                      </div>
                      <p className={`text-lg font-bold ${cocuk.ozet.teslimEdilmemisOdevler > 0 ? 'text-red-400' : 'text-white'}`}>
                        {cocuk.ozet.teslimEdilmemisOdevler}
                        <span className="text-xs font-normal text-slate-500 ml-1">ödev</span>
                      </p>
                    </div>
                  </div>

                  {/* Hızlı Erişim */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/notlar`); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Notlar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/devamsizlik`); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Yoklama
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/odevler`); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Ödevler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Henüz kayıtlı öğrenci bulunmuyor.</p>
              <p className="text-sm text-slate-500 mt-2">Lütfen okul yönetimiyle iletişime geçin.</p>
            </div>
          )}
        </div>

        {/* Alt Bölüm - Bildirimler ve Duyurular */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Bildirimler */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Bildirimler
              </h3>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Tümünü Gör
              </button>
            </div>
            
            {data?.bildirimler && data.bildirimler.length > 0 ? (
              <div className="space-y-3">
                {data.bildirimler.map((bildirim) => (
                  <div 
                    key={bildirim.id}
                    className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{bildirim.baslik}</p>
                      <p className="text-xs text-slate-400 truncate">{bildirim.mesaj}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(bildirim.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Yeni bildirim yok</p>
              </div>
            )}
          </div>

          {/* Son Duyurular */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Duyurular
              </h3>
              <button 
                onClick={() => router.push('/duyurular')}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Tümünü Gör
              </button>
            </div>
            
            {data?.duyurular && data.duyurular.length > 0 ? (
              <div className="space-y-3">
                {data.duyurular.map((duyuru) => (
                  <div 
                    key={duyuru.id}
                    className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => router.push('/duyurular')}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      duyuru.oncelik === 'ACIL' ? 'bg-red-500' :
                      duyuru.oncelik === 'ONEMLI' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{duyuru.baslik}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(duyuru.createdAt)}</p>
                    </div>
                    {duyuru.oncelik !== 'NORMAL' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        duyuru.oncelik === 'ACIL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {duyuru.oncelik === 'ACIL' ? 'Acil' : 'Önemli'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Yeni duyuru yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Hızlı Erişim Menüsü */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/veli/mesajlar')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Mesajlar</span>
          </button>
          
          <button 
            onClick={() => router.push('/duyurular')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Duyurular</span>
          </button>
          
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Takvim</span>
          </button>
          
          <button className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-slate-500/20 rounded-xl flex items-center justify-center group-hover:bg-slate-500/30 transition-colors">
              <Settings className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Ayarlar</span>
          </button>
        </div>
      </main>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function VeliDashboard() {
  return (
    <RoleGuard allowedRoles={['veli']}>
      <VeliDashboardContent />
    </RoleGuard>
  );
}

