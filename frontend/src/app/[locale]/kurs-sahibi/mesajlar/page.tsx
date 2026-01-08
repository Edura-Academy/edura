'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Conversation {
  id: string;
  tip: string;
  ad?: string;
  sonMesaj?: {
    icerik: string;
    createdAt: string;
  };
  uyeler: {
    user: {
      id: string;
      ad: string;
      soyad: string;
      role: string;
    };
  }[];
  okunmamisSayisi?: number;
}

function MesajlarPageContent() {
  const { user, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Konuşmalar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.ad) return conv.ad;
    const otherUser = conv.uyeler.find(u => u.user.id !== user?.id);
    return otherUser ? `${otherUser.user.ad} ${otherUser.user.soyad}` : 'Konuşma';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      mudur: 'Müdür',
      ogretmen: 'Öğretmen',
      sekreter: 'Sekreter',
      ogrenci: 'Öğrenci',
      veli: 'Veli',
    };
    return labels[role] || role;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR');
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/kurs-sahibi" 
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mesajlar</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Müdürlerle iletişim</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className={`mb-6 flex items-center gap-3 ${isDark ? 'bg-slate-800/50' : 'bg-white'} rounded-xl px-4 py-3 border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <Search className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Konuşma ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Conversations List */}
        <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border overflow-hidden`}>
          {filteredConversations.length > 0 ? (
            <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
              {filteredConversations.map((conv) => {
                const otherUser = conv.uyeler.find(u => u.user.id !== user?.id);
                return (
                  <Link
                    key={conv.id}
                    href={`/mudur/mesajlar?conversation=${conv.id}`}
                    className={`flex items-center gap-4 p-4 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} ${isDark ? 'text-indigo-400' : 'text-indigo-600'} font-semibold`}>
                      {otherUser ? `${otherUser.user.ad?.charAt(0)}${otherUser.user.soyad?.charAt(0)}` : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                          {getConversationTitle(conv)}
                        </h3>
                        {conv.sonMesaj && (
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            {formatTime(conv.sonMesaj.createdAt)}
                          </span>
                        )}
                      </div>
                      {otherUser && (
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {getRoleLabel(otherUser.user.role)}
                        </span>
                      )}
                      {conv.sonMesaj && (
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} truncate mt-1`}>
                          {conv.sonMesaj.icerik}
                        </p>
                      )}
                    </div>
                    {conv.okunmamisSayisi && conv.okunmamisSayisi > 0 && (
                      <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {conv.okunmamisSayisi}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <MessageSquare className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {searchTerm ? 'Arama kriterlerine uygun konuşma bulunamadı' : 'Henüz mesajınız bulunmuyor'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MesajlarPage() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <MesajlarPageContent />
    </RoleGuard>
  );
}

