'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Calendar, FileText, Clock,
  TrendingUp, AlertCircle, MessageSquare, User,
  GraduationCap, CheckCircle, XCircle, Award,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
}

export default function CocukDetay() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [cocuk, setCocuk] = useState<Cocuk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCocuk();
  }, [cocukId]);

  const fetchCocuk = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/veli/cocuk/${cocukId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setCocuk(result.data);
      }
    } catch (error) {
      console.error('Öğrenci bilgisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!cocuk) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={isDark ? 'text-white' : 'text-slate-900'}>Öğrenci bulunamadı</p>
          <button 
            onClick={() => router.push('/veli')}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Notlar & Sınav Sonuçları',
      description: 'Tüm ders notları ve sınav sonuçlarını görüntüle',
      icon: BookOpen,
      color: 'purple',
      path: `/veli/cocuk/${cocukId}/notlar`
    },
    {
      title: 'Devamsızlık Kayıtları',
      description: 'Yoklama ve devamsızlık durumunu incele',
      icon: Calendar,
      color: 'amber',
      path: `/veli/cocuk/${cocukId}/devamsizlik`
    },
    {
      title: 'Ödevler',
      description: 'Verilen ödevler ve teslim durumları',
      icon: FileText,
      color: 'emerald',
      path: `/veli/cocuk/${cocukId}/odevler`
    },
    {
      title: 'Ders Programı',
      description: 'Haftalık ders programını görüntüle',
      icon: Clock,
      color: 'blue',
      path: `/veli/cocuk/${cocukId}/ders-programi`
    },
    {
      title: 'Öğretmenlerle İletişim',
      description: 'Ders öğretmenleriyle mesajlaşma',
      icon: MessageSquare,
      color: 'pink',
      path: `/veli/cocuk/${cocukId}/ogretmenler`
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', hover: 'hover:bg-amber-500/30' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
      pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', hover: 'hover:bg-pink-500/30' }
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl border-b sticky top-0 z-50`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push('/veli')}
              className={`p-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Öğrenci Detayı</h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cocuk.ad} {cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Öğrenci Kartı */}
        <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl border p-6 mb-8 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
              {cocuk.ad[0]}{cocuk.soyad[0]}
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cocuk.ad} {cocuk.soyad}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1`}>
                  <GraduationCap className="w-4 h-4" />
                  {cocuk.sinif?.ad}
                </span>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1`}>
                  <User className="w-4 h-4" />
                  {cocuk.ogrenciNo}
                </span>
              </div>
              <p className="text-sm text-purple-500 mt-1">{cocuk.kurs?.ad}</p>
            </div>
          </div>
        </div>

        {/* Menü Kartları */}
        <div className="space-y-4">
          {menuItems.map((item) => {
            const colors = getColorClasses(item.color);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-4 p-4 ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl border hover:border-purple-500/50 transition-all group text-left shadow-sm`}
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.hover} transition-colors`}>
                  <item.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium group-hover:text-purple-500 transition-colors`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-purple-500 transition-colors`} />
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

