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
  TrendingUp,
  UserPlus,
  ClipboardList,
  ChevronRight,
  Building,
  UserCheck,
  BarChart3,
  Megaphone,
  HelpCircle,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Stats {
  toplamOgrenci: number;
  toplamOgretmen: number;
  toplamSekreter: number;
  toplamSinif: number;
}

interface RecentUser {
  id: string;
  ad: string;
  soyad: string;
  role: string;
  createdAt: string;
}

function MudurDashboardContent() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const fetchData = async (token: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users?aktif=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (usersData.success) {
        setRecentUsers(usersData.data.slice(0, 5));
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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ogretmen: 'Öğretmen',
      sekreter: 'Sekreter',
      ogrenci: 'Öğrenci',
      veli: 'Veli',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ogretmen: 'bg-blue-100 text-blue-700',
      sekreter: 'bg-purple-100 text-purple-700',
      ogrenci: 'bg-green-100 text-green-700',
      veli: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Edura</h1>
                <p className="text-xs text-teal-600 font-medium">Müdür Paneli</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bildirimler */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mesajlar */}
              <Link
                href="/mudur/mesajlar"
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
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                    {user?.ad?.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">
                    {user?.ad} {user?.soyad}
                  </span>
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
                        href="/mudur/ayarlar"
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
          <p className="text-slate-500 mt-1">Kurumunuzun genel durumunu buradan takip edebilirsiniz.</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Öğrenci</p>
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
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Öğretmen</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.toplamOgretmen || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Sekreter</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.toplamSekreter || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Sınıf</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.toplamSinif || 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/mudur/kullanicilar"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-teal-200 transition-colors">
              <UserPlus className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Kullanıcı Yönetimi</h3>
            <p className="text-xs text-slate-500 mt-1">Personel ve öğrenci ekle/düzenle</p>
          </Link>

          <Link
            href="/mudur/siniflar"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Sınıf Yönetimi</h3>
            <p className="text-xs text-slate-500 mt-1">Sınıf oluştur ve düzenle</p>
          </Link>

          <Link
            href="/mudur/raporlar"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Raporlar</h3>
            <p className="text-xs text-slate-500 mt-1">Detaylı istatistikler</p>
          </Link>

          <Link
            href="/mudur/duyurular"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Duyurular</h3>
            <p className="text-xs text-slate-500 mt-1">Duyuru oluştur ve yönet</p>
          </Link>
        </div>

        {/* Destek & Yardım */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/mudur/sistem-duyurulari"
            className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white">Sistem Duyuruları</h3>
              <p className="text-xs text-purple-200 mt-1">Edura&apos;dan önemli bildirimler</p>
            </div>
          </Link>

          <Link
            href="/mudur/destek"
            className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-5 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <LifeBuoy className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white">Destek Talebi</h3>
              <p className="text-xs text-teal-200 mt-1">Teknik destek alın</p>
            </div>
          </Link>

          <Link
            href="/mudur/yardim"
            className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl p-5 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white">Yardım Merkezi</h3>
              <p className="text-xs text-rose-200 mt-1">Sık sorulan sorular</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Eklenen Kullanıcılar */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Son Eklenen Kullanıcılar</h3>
              <Link href="/mudur/kullanicilar" className="text-sm text-teal-600 hover:text-teal-700">
                Tümünü Gör
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentUsers.length > 0 ? (
                recentUsers.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-medium text-sm">
                        {u.ad?.charAt(0)}{u.soyad?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{u.ad} {u.soyad}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Henüz kullanıcı eklenmemiş
                </div>
              )}
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Hızlı İşlemler</h3>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/mudur/kullanicilar?action=ekle&role=ogretmen"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Yeni Öğretmen Ekle</p>
                  <p className="text-xs text-blue-600">Kadronuza yeni öğretmen ekleyin</p>
                </div>
              </Link>

              <Link
                href="/mudur/kullanicilar?action=ekle&role=sekreter"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Yeni Sekreter Ekle</p>
                  <p className="text-xs text-purple-600">Kadronuza yeni sekreter ekleyin</p>
                </div>
              </Link>

              <Link
                href="/mudur/duyurular?action=yeni"
                className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Duyuru Yayınla</p>
                  <p className="text-xs text-amber-600">Tüm personele duyuru gönderin</p>
                </div>
              </Link>

              <Link
                href="/mudur/raporlar"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Raporları İncele</p>
                  <p className="text-xs text-green-600">Haftalık performans raporlarını görüntüle</p>
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
export default function MudurDashboard() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <MudurDashboardContent />
    </RoleGuard>
  );
}

