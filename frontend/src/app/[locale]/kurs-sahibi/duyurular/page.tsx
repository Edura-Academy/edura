'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Plus,
  Search,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Pin,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  kategori: string;
  pinlendi: boolean;
  yayinTarihi: string;
  olusturan?: {
    ad: string;
    soyad: string;
  };
}

function DuyurularPageContent() {
  const { token } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchDuyurular();
    }
  }, [token]);

  const fetchDuyurular = async () => {
    try {
      const response = await fetch(`${API_URL}/duyuru`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDuyurular(data.data);
      }
    } catch (error) {
      console.error('Duyurular alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOncelikBadge = (oncelik: string) => {
    switch (oncelik) {
      case 'ACIL':
        return isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
      case 'ONEMLI':
        return isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700';
      default:
        return isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700';
    }
  };

  const getOncelikLabel = (oncelik: string) => {
    switch (oncelik) {
      case 'ACIL': return 'Acil';
      case 'ONEMLI': return 'Önemli';
      default: return 'Normal';
    }
  };

  const filteredDuyurular = duyurular.filter(d =>
    d.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.icerik.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Duyurular</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kurs duyurularını görüntüle</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className={`mb-6 flex items-center gap-3 ${isDark ? 'bg-slate-800/50' : 'bg-white'} rounded-xl px-4 py-3 border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <Search className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Duyuru ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Duyurular Listesi */}
        <div className="space-y-4">
          {filteredDuyurular.length > 0 ? (
            filteredDuyurular.map((duyuru) => (
              <div
                key={duyuru.id}
                className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5 transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {duyuru.pinlendi && (
                        <Pin className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                      )}
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{duyuru.baslik}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOncelikBadge(duyuru.oncelik)}`}>
                        {getOncelikLabel(duyuru.oncelik)}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} line-clamp-2`}>{duyuru.icerik}</p>
                    <div className={`flex items-center gap-4 mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(duyuru.yayinTarihi).toLocaleDateString('tr-TR')}
                      </span>
                      {duyuru.olusturan && (
                        <span>• {duyuru.olusturan.ad} {duyuru.olusturan.soyad}</span>
                      )}
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Bell className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {searchTerm ? 'Arama kriterlerine uygun duyuru bulunamadı' : 'Henüz duyuru bulunmuyor'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DuyurularPage() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <DuyurularPageContent />
    </RoleGuard>
  );
}

