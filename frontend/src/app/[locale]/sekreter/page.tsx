'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  CreditCard,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  ClipboardList,
  ChevronRight,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Stats {
  toplamOgrenci: number;
  bekleyenOdemeler: number;
  bugunDevamsiz: number;
  yeniKayitlar: number;
}

interface BekleyenOdeme {
  id: string;
  ogrenciAd: string;
  tutar: number;
  vadeTarihi: string;
}

function SekreterDashboardContent() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bekleyenOdemeler, setBekleyenOdemeler] = useState<BekleyenOdeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const fetchData = async (token: string) => {
    try {
      const [statsRes, odemelerRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/sekreter/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/dashboard/sekreter/bekleyen-odemeler`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (odemelerRes.ok) {
        const odemelerData = await odemelerRes.json();
        if (odemelerData.success) {
          setBekleyenOdemeler(odemelerData.data);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Edura</h1>
                <p className="text-xs text-indigo-600 font-medium">Sekreter Paneli</p>
              </div>
            </div>

            {/* Arama */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                href="/sekreter/mesajlar"
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
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center text-white font-medium text-sm">
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
                        href="/sekreter/ayarlar"
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
          <p className="text-slate-500 mt-1">Günlük işlemlerinizi buradan yönetebilirsiniz.</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Toplam Öğrenci</p>
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
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Bekleyen Ödeme</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.bekleyenOdemeler || 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Bugün Devamsız</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.bugunDevamsiz || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Yeni Kayıtlar</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.yeniKayitlar || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/sekreter/ogrenciler"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Öğrenci Kaydı</h3>
            <p className="text-xs text-slate-500 mt-1">Yeni öğrenci kaydet</p>
          </Link>

          <Link
            href="/sekreter/odemeler"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Ödeme Takibi</h3>
            <p className="text-xs text-slate-500 mt-1">Ödeme al ve takip et</p>
          </Link>

          <Link
            href="/sekreter/yoklama"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Yoklama</h3>
            <p className="text-xs text-slate-500 mt-1">Günlük yoklama al</p>
          </Link>

          <Link
            href="/sekreter/duyurular"
            className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Duyurular</h3>
            <p className="text-xs text-slate-500 mt-1">Duyuruları görüntüle</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bekleyen Ödemeler */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Yaklaşan Ödemeler
              </h3>
              <Link href="/sekreter/odemeler" className="text-sm text-indigo-600 hover:text-indigo-700">
                Tümünü Gör
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {bekleyenOdemeler.map((odeme) => (
                <div key={odeme.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{odeme.ogrenciAd}</p>
                    <p className="text-xs text-slate-500">Vade: {formatDate(odeme.vadeTarihi)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(odeme.tutar)}</p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-700">Ödeme Al</button>
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
                href="/sekreter/ogrenciler?action=yeni"
                className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-indigo-900">Yeni Öğrenci Kaydı</p>
                  <p className="text-xs text-indigo-600">Sisteme yeni öğrenci ekle</p>
                </div>
              </Link>

              <Link
                href="/sekreter/odemeler?action=al"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Ödeme Al</p>
                  <p className="text-xs text-green-600">Öğrenci ödemesi kaydet</p>
                </div>
              </Link>

              <Link
                href="/sekreter/veli-bilgilendirme"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Veli Bilgilendirme</p>
                  <p className="text-xs text-purple-600">Velilere toplu mesaj gönder</p>
                </div>
              </Link>

              <Link
                href="/sekreter/belgeler"
                className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Belge Oluştur</p>
                  <p className="text-xs text-amber-600">Öğrenci belgesi düzenle</p>
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
export default function SekreterDashboard() {
  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <SekreterDashboardContent />
    </RoleGuard>
  );
}

