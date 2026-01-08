'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, MessageSquare, User, BookOpen, 
  Send, Loader2
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  brans: string | null;
  dersler: string[];
}

interface OgretmenlerData {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
  };
  ogretmenler: Ogretmen[];
}

export default function CocukOgretmenler() {
  const router = useRouter();
  const params = useParams();
  const cocukId = params.cocukId as string;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [data, setData] = useState<OgretmenlerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    fetchOgretmenler();
  }, [cocukId]);

  const fetchOgretmenler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/veli/cocuk/${cocukId}/ogretmenler`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Öğretmenler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (ogretmenId: string) => {
    setStartingChat(ogretmenId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/veli/mesaj/baslat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ogretmenId,
          cocukId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Mesajlar sayfasına yönlendir
        router.push(`/veli/mesajlar?conversation=${result.data.conversationId}`);
      }
    } catch (error) {
      console.error('Konuşma başlatılamadı:', error);
    } finally {
      setStartingChat(null);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl border-b sticky top-0 z-50`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push(`/veli/cocuk/${cocukId}`)}
              className={`p-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Öğretmenlerle İletişim</h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{data?.cocuk.ad} {data?.cocuk.soyad}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bilgi Notu */}
        <div className={`${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'} border rounded-xl p-4 mb-6`}>
          <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            <strong>Bilgi:</strong> Aşağıdaki öğretmenlerle {data?.cocuk.ad}&apos;in dersleri hakkında mesajlaşabilirsiniz.
          </p>
        </div>

        {/* Öğretmen Listesi */}
        {data?.ogretmenler && data.ogretmenler.length > 0 ? (
          <div className="space-y-4">
            {data.ogretmenler.map((ogretmen) => (
              <div 
                key={ogretmen.id}
                className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl border p-4 shadow-sm`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {ogretmen.ad[0]}{ogretmen.soyad[0]}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>{ogretmen.ad} {ogretmen.soyad}</h3>
                    {ogretmen.brans && (
                      <p className="text-sm text-purple-500">{ogretmen.brans}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ogretmen.dersler.map((ders, index) => (
                        <span 
                          key={index}
                          className={`text-xs px-2 py-1 ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-lg flex items-center gap-1`}
                        >
                          <BookOpen className="w-3 h-3" />
                          {ders}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mesaj Butonu */}
                  <button
                    onClick={() => startConversation(ogretmen.id)}
                    disabled={startingChat === ogretmen.id}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors"
                  >
                    {startingChat === ogretmen.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Mesaj</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl border p-12 text-center`}>
            <User className={`w-12 h-12 ${isDark ? 'text-slate-500' : 'text-slate-400'} mx-auto mb-4`} />
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Henüz kayıtlı öğretmen bulunmuyor</p>
          </div>
        )}
      </main>
    </div>
  );
}

