'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FinansalOzet {
  toplamGelir: number;
  aylikGelir: number;
  bekleyenOdemeler: number;
  tahsilEdilen: number;
  ogrenciSayisi: number;
  ortalamaOdeme: number;
}

interface OdemeKaydi {
  id: string;
  ogrenciAd: string;
  tutar: number;
  tarih: string;
  durum: 'ODENDI' | 'BEKLEMEDE' | 'GECIKTI';
  tip: string;
}

function FinansalRaporlarContent() {
  const { token } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'hafta' | 'ay' | 'yil'>('ay');
  const [ozet, setOzet] = useState<FinansalOzet>({
    toplamGelir: 0,
    aylikGelir: 0,
    bekleyenOdemeler: 0,
    tahsilEdilen: 0,
    ogrenciSayisi: 0,
    ortalamaOdeme: 0,
  });
  const [sonOdemeler, setSonOdemeler] = useState<OdemeKaydi[]>([]);

  useEffect(() => {
    if (token) {
      fetchFinansalVeriler();
    }
  }, [token, selectedPeriod]);

  const fetchFinansalVeriler = async () => {
    try {
      // API'den finansal verileri çek
      const [ozetRes, odemelerRes] = await Promise.all([
        fetch(`${API_URL}/odeme/ozet?period=${selectedPeriod}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/odeme/son-odemeler`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ozetData = await ozetRes.json();
      const odemelerData = await odemelerRes.json();

      if (ozetData.success) {
        setOzet(ozetData.data);
      }
      if (odemelerData.success) {
        setSonOdemeler(odemelerData.data);
      }
    } catch (error) {
      console.error('Finansal veriler alınamadı:', error);
      // Demo veriler
      setOzet({
        toplamGelir: 125000,
        aylikGelir: 45000,
        bekleyenOdemeler: 12500,
        tahsilEdilen: 32500,
        ogrenciSayisi: 156,
        ortalamaOdeme: 2500,
      });
      setSonOdemeler([
        { id: '1', ogrenciAd: 'Ahmet Yılmaz', tutar: 2500, tarih: '2026-01-05', durum: 'ODENDI', tip: 'Taksit' },
        { id: '2', ogrenciAd: 'Ayşe Demir', tutar: 3000, tarih: '2026-01-04', durum: 'ODENDI', tip: 'Kayıt' },
        { id: '3', ogrenciAd: 'Mehmet Kaya', tutar: 2500, tarih: '2026-01-03', durum: 'BEKLEMEDE', tip: 'Taksit' },
        { id: '4', ogrenciAd: 'Fatma Öz', tutar: 2500, tarih: '2026-01-02', durum: 'GECIKTI', tip: 'Taksit' },
        { id: '5', ogrenciAd: 'Ali Can', tutar: 5000, tarih: '2026-01-01', durum: 'ODENDI', tip: 'Kayıt' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case 'ODENDI':
        return isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700';
      case 'BEKLEMEDE':
        return isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700';
      case 'GECIKTI':
        return isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-700';
    }
  };

  const getDurumLabel = (durum: string) => {
    switch (durum) {
      case 'ODENDI': return 'Ödendi';
      case 'BEKLEMEDE': return 'Beklemede';
      case 'GECIKTI': return 'Gecikti';
      default: return durum;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/kurs-sahibi" 
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Finansal Raporlar</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gelir ve ödeme takibi</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-xl transition-colors`}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Rapor İndir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Period Selector */}
        <div className={`flex items-center justify-between mb-6 p-1 ${isDark ? 'bg-slate-800/50' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex gap-1 p-1">
            {[
              { id: 'hafta', label: 'Bu Hafta' },
              { id: 'ay', label: 'Bu Ay' },
              { id: 'yil', label: 'Bu Yıl' },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as 'hafta' | 'ay' | 'yil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period.id
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} px-4`}>
            <Calendar className="w-4 h-4" />
            <span>Ocak 2026</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <Wallet className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <ArrowUpRight className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(ozet.toplamGelir)}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Toplam Gelir</p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                <ArrowUpRight className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(ozet.aylikGelir)}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Aylık Gelir</p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <CreditCard className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <ArrowDownRight className="w-3 h-3" />
                <span>-3%</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(ozet.bekleyenOdemeler)}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Bekleyen Ödemeler</p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <PiggyBank className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(ozet.ortalamaOdeme)}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Ortalama Ödeme</p>
          </div>
        </div>

        {/* Son Ödemeler */}
        <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border overflow-hidden`}>
          <div className={`p-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'} flex items-center justify-between`}>
            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Son Ödemeler</h2>
            <button className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <tr>
                  <th className={`px-5 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase`}>Öğrenci</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase`}>Tutar</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase`}>Tip</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase`}>Tarih</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase`}>Durum</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                {sonOdemeler.map((odeme) => (
                  <tr key={odeme.id} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className={`px-5 py-4 ${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>{odeme.ogrenciAd}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>{formatCurrency(odeme.tutar)}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{odeme.tip}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {new Date(odeme.tarih).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDurumBadge(odeme.durum)}`}>
                        {getDurumLabel(odeme.durum)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sonOdemeler.length === 0 && (
            <div className="p-8 text-center">
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Henüz ödeme kaydı bulunmuyor</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FinansalRaporlarPage() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <FinansalRaporlarContent />
    </RoleGuard>
  );
}

