'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  ChevronRight,
  Clock,
  CheckCircle,
  Video,
  PenTool,
  BarChart3,
  FolderOpen,
  PlayCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Stats {
  toplamOgrenci: number;
  toplamDers: number;
  bekleyenOdevler: number;
  bugunDersSayisi: number;
}

interface BugunDers {
  id: string;
  ad: string;
  sinif: string;
  saat: string;
  durum: 'bekliyor' | 'devam_ediyor' | 'tamamlandi';
}

function OgretmenDashboardContent() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bugunDersler, setBugunDersler] = useState<BugunDers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const fetchData = async (token: string) => {
    try {
      // Dashboard istatistiklerini çek
      const [statsRes, derslerRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/ogretmen/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogretmen/bugun-dersler`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (derslerRes.ok) {
        const derslerData = await derslerRes.json();
        if (derslerData.success) {
          setBugunDersler(derslerData.data);
        }
      }
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case 'tamamlandi':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Tamamlandı</span>;
      case 'devam_ediyor':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full animate-pulse">Devam Ediyor</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">Bekliyor</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Edura</h1>
                <p className="text-xs text-blue-600 font-medium">Öğretmen Paneli</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Canlı Ders Başlat */}
              <Link
                href="/ogretmen/canli-ders"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Video className="w-4 h-4" />
                Canlı Ders
              </Link>

              {/* Bildirimler */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mesajlar */}
              <Link
                href="/ogretmen/mesajlar"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* Profil */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                    {user?.ad?.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-700">{user?.ad} {user?.soyad}</p>
                    <p className="text-xs text-slate-500">{user?.brans || 'Öğretmen'}</p>
                  </div>
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-medium text-slate-900">{user?.ad} {user?.soyad}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <Link
                        href="/ogretmen/ayarlar"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4" />
                        Hesap Ayarları
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hoşgeldin */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Hoş Geldiniz, {user?.ad}!</h2>
          <p className="text-slate-500 mt-1">Bugün {stats?.bugunDersSayisi || 0} dersiniz var.</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Öğrencilerim</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.toplamOgrenci || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Derslerim</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.toplamDers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Bekleyen Ödev</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.bekleyenOdevler || 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Bugün Ders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.bugunDersSayisi || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Link
            href="/ogretmen/yoklama"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Yoklama Al</h3>
            <p className="text-xs text-slate-500 mt-1">Günlük yoklama</p>
          </Link>

          <Link
            href="/ogretmen/odevler"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
              <PenTool className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Ödev Ver</h3>
            <p className="text-xs text-slate-500 mt-1">Ödev oluştur</p>
          </Link>

          <Link
            href="/ogretmen/sinavlar"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Sınav Oluştur</h3>
            <p className="text-xs text-slate-500 mt-1">Online sınav</p>
          </Link>

          <Link
            href="/ogretmen/materyaller"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <FolderOpen className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Materyaller</h3>
            <p className="text-xs text-slate-500 mt-1">Dosya paylaş</p>
          </Link>

          <Link
            href="/ogretmen/raporlar"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-teal-200 transition-colors">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Raporlar</h3>
            <p className="text-xs text-slate-500 mt-1">Performans</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bugünkü Dersler */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Bugünkü Dersler
              </h3>
              <Link href="/ogretmen/ders-programi" className="text-sm text-blue-600 hover:text-blue-700">
                Tüm Program
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {bugunDersler.map((ders) => (
                <div key={ders.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ders.durum === 'devam_ediyor' ? 'bg-blue-100' : 
                      ders.durum === 'tamamlandi' ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      <BookOpen className={`w-5 h-5 ${
                        ders.durum === 'devam_ediyor' ? 'text-blue-600' : 
                        ders.durum === 'tamamlandi' ? 'text-green-600' : 'text-slate-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{ders.ad}</p>
                      <p className="text-xs text-slate-500">{ders.sinif} • {ders.saat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDurumBadge(ders.durum)}
                    {ders.durum === 'devam_ediyor' && (
                      <Link
                        href={`/ogretmen/canli-ders/${ders.id}`}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Hızlı İşlemler</h3>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/ogretmen/canli-ders"
                className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Canlı Ders Başlat</p>
                  <p className="text-xs text-red-600">Anında ders başlat</p>
                </div>
              </Link>

              <Link
                href="/ogretmen/odevler?action=yeni"
                className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Yeni Ödev Ver</p>
                  <p className="text-xs text-amber-600">Öğrencilere ödev ata</p>
                </div>
              </Link>

              <Link
                href="/ogretmen/sinavlar?action=yeni"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Online Sınav Oluştur</p>
                  <p className="text-xs text-purple-600">Çoktan seçmeli sınav hazırla</p>
                </div>
              </Link>

              <Link
                href="/ogretmen/mesajlar"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Mesaj Gönder</p>
                  <p className="text-xs text-blue-600">Öğrenci veya veliye mesaj at</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function OgretmenDashboard() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenDashboardContent />
    </RoleGuard>
  );
}

