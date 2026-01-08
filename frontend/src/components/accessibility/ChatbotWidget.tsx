'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import VoiceInput from './VoiceInput';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ChatMode = 'chat' | 'voice';

// Rol bazlı kapsamlı hızlı yanıt butonları
const QUICK_REPLIES: Record<string, { id: string; icon: string; text: string; query: string }[]> = {
  ogrenci: [
    { id: 'overview', icon: '📋', text: 'Günlük özet', query: 'Günlük özetimi ver' },
    { id: 'exam', icon: '📊', text: 'Sınav sonuçlarım', query: 'Son sınav sonuçlarım nasıl?' },
    { id: 'homework', icon: '📚', text: 'Bekleyen ödevler', query: 'Bekleyen ödevlerim neler?' },
    { id: 'schedule', icon: '📅', text: 'Bugünkü dersler', query: 'Bugün hangi derslerim var?' },
    { id: 'xp', icon: '⭐', text: 'XP & Seviye', query: 'XP puanım ve seviyem nedir?' },
    { id: 'leaderboard', icon: '🏆', text: 'Sıralamam', query: 'Liderlik tablosunda kaçıncıyım?' },
    { id: 'daily', icon: '❓', text: 'Günün sorusu', query: 'Günün sorusu hakkında bilgi ver' },
    { id: 'live', icon: '🎥', text: 'Canlı dersler', query: 'Yaklaşan canlı dersler var mı?' },
  ],
  ogretmen: [
    { id: 'overview', icon: '📋', text: 'Günlük özet', query: 'Günlük özetimi ver' },
    { id: 'today', icon: '📅', text: 'Bugünkü dersler', query: 'Bugün hangi derslerim var?' },
    { id: 'week', icon: '🗓️', text: 'Haftalık program', query: 'Haftalık ders programım nedir?' },
    { id: 'classes', icon: '👥', text: 'Sınıflarım', query: 'Sınıflarım ve öğrenci sayıları nedir?' },
    { id: 'homework', icon: '📚', text: 'Ödev durumları', query: 'Ödev teslim durumları nasıl?' },
    { id: 'exams', icon: '📊', text: 'Sınav analizleri', query: 'Son sınav sonuç analizleri nedir?' },
    { id: 'live', icon: '🎥', text: 'Canlı dersler', query: 'Planlanmış canlı derslerim var mı?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
  veli: [
    { id: 'overview', icon: '📋', text: 'Genel durum', query: 'Çocuklarımın genel durumu nasıl?' },
    { id: 'exam', icon: '📊', text: 'Sınav sonuçları', query: 'Çocuğumun sınav sonuçları nasıl?' },
    { id: 'homework', icon: '📚', text: 'Ödev durumu', query: 'Çocuğumun ödev durumu nasıl?' },
    { id: 'attendance', icon: '📋', text: 'Devamsızlık', query: 'Çocuğumun devamsızlık durumu nedir?' },
    { id: 'schedule', icon: '📅', text: 'Ders programı', query: 'Çocuğumun bugünkü dersleri neler?' },
    { id: 'success', icon: '🎮', text: 'Başarılar & XP', query: 'Çocuğumun XP ve rozet durumu nedir?' },
    { id: 'payment', icon: '💰', text: 'Ödeme durumu', query: 'Ödeme durumum nedir?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
  mudur: [
    { id: 'overview', icon: '📋', text: 'Genel durum', query: 'Kurs genel durumu nedir?' },
    { id: 'stats', icon: '📊', text: 'İstatistikler', query: 'Detaylı kurs istatistikleri nedir?' },
    { id: 'today', icon: '📅', text: 'Bugünkü dersler', query: 'Bugün kaç ders var?' },
    { id: 'staff', icon: '👥', text: 'Personel', query: 'Personel listesi nedir?' },
    { id: 'attendance', icon: '📋', text: 'Devamsızlık', query: 'Bugünkü devamsızlık durumu nedir?' },
    { id: 'pending', icon: '⏳', text: 'Bekleyen onaylar', query: 'Bekleyen onaylar var mı?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
  sekreter: [
    { id: 'overview', icon: '📋', text: 'Günlük özet', query: 'Günlük özet ver' },
    { id: 'payments', icon: '💰', text: 'Ödemeler', query: 'Ödeme durumları nasıl?' },
    { id: 'today', icon: '📅', text: 'Bugünkü dersler', query: 'Bugünkü ders programı nedir?' },
    { id: 'students', icon: '👥', text: 'Son kayıtlar', query: 'Son öğrenci kayıtları neler?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
  kursSahibi: [
    { id: 'overview', icon: '📊', text: 'Genel durum', query: 'Kursun genel durumu nedir?' },
    { id: 'finance', icon: '💰', text: 'Finansal özet', query: 'Finansal durum nasıl?' },
    { id: 'managers', icon: '👔', text: 'Müdürler', query: 'Müdürlerim kimler?' },
    { id: 'staff', icon: '👥', text: 'Personel özeti', query: 'Personel özeti nedir?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
  admin: [
    { id: 'status', icon: '🖥️', text: 'Sistem durumu', query: 'Sistem durumu nedir?' },
    { id: 'stats', icon: '📊', text: 'Genel istatistikler', query: 'Toplam kullanıcı ve kurs sayısı?' },
    { id: 'support', icon: '🎫', text: 'Destek talepleri', query: 'Bekleyen destek talepleri var mı?' },
    { id: 'announce', icon: '📢', text: 'Duyurular', query: 'Son duyurular neler?' },
  ],
};

// Robot İkonu
const RobotIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="12" rx="2" />
    <circle cx="9" cy="10" r="2" fill="white" />
    <circle cx="15" cy="10" r="2" fill="white" />
    <circle cx="9" cy="10" r="1" fill="#1e40af" />
    <circle cx="15" cy="10" r="1" fill="#1e40af" />
    <line x1="12" y1="4" x2="12" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="1" r="1.5" fill="currentColor" />
    <rect x="8" y="13" width="8" height="1.5" rx="0.5" fill="white" />
    <rect x="6" y="17" width="12" height="5" rx="1" fill="currentColor" />
    <circle cx="12" cy="19.5" r="1.5" fill="white" />
  </svg>
);

// Rol bazlı başlıklar ve açıklamalar
const ROLE_CONFIG: Record<string, { title: string; subtitle: string; greeting: string }> = {
  ogrenci: {
    title: 'Edu',
    subtitle: 'Öğrenci Asistanı',
    greeting: 'Sınav sonuçlarını, ödevlerini, XP puanını sorabilirsin. Nasıl yardımcı olabilirim?'
  },
  ogretmen: {
    title: 'Edu',
    subtitle: 'Öğretmen Asistanı',
    greeting: 'Derslerinizi, sınıflarınızı, ödev durumlarını ve sınav analizlerini sorabilirsiniz.'
  },
  veli: {
    title: 'Edu',
    subtitle: 'Veli Asistanı',
    greeting: 'Çocuğunuzun sınav sonuçlarını, ödevlerini, devamsızlığını sorabilirsiniz.'
  },
  mudur: {
    title: 'Edu',
    subtitle: 'Yönetici Asistanı',
    greeting: 'Kurs istatistiklerini, personeli, dersleri ve bekleyen onayları sorgulayabilirsiniz.'
  },
  sekreter: {
    title: 'Edu',
    subtitle: 'Sekreter Asistanı',
    greeting: 'Ödemeleri, kayıtları ve ders programını sorgulayabilirsiniz.'
  },
  kursSahibi: {
    title: 'Edu',
    subtitle: 'Kurs Sahibi Asistanı',
    greeting: 'Genel durumu, finansal özeti ve müdürlerinizi sorgulayabilirsiniz.'
  },
  admin: {
    title: 'Edu',
    subtitle: 'Sistem Asistanı',
    greeting: 'Sistem durumu ve istatistikleri sorgulayabilirsiniz.'
  },
};

export function ChatbotWidget() {
  const { speak, ttsEnabled, isSpeaking, stop, currentLocale } = useAccessibility();
  const { user, token } = useAuth();
  const t = useTranslations('chatbot');
  const tAccess = useTranslations('accessibility');
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role || 'ogrenci';
  const quickReplies = QUICK_REPLIES[userRole] || QUICK_REPLIES.ogrenci;
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.ogrenci;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && mode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Merhaba ${user.ad}! 👋\n\n${roleConfig.greeting}`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      if (ttsEnabled) {
        speak(welcomeMessage.content);
      }
    }
  }, [isOpen, user, messages.length, ttsEnabled, speak, roleConfig.greeting]);

  useEffect(() => {
    setMessages([]);
    setShowQuickReplies(true);
  }, [currentLocale]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !token) return;

    setShowQuickReplies(false);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content.trim(), locale: currentLocale }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.success ? data.response : t('error'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (ttsEnabled) {
        speak(assistantMessage.content, true);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('connectionError'),
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, token, ttsEnabled, speak, t, currentLocale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleVoiceResult = (transcript: string) => sendMessage(transcript);
  const handleQuickReply = (query: string) => sendMessage(query);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (ttsEnabled) {
      speak(!isOpen ? tAccess('assistantOpened') : tAccess('assistantClosed'));
      if (isOpen) stop();
    }
  };

  const switchMode = (newMode: ChatMode) => {
    setMode(newMode);
    if (ttsEnabled) {
      speak(newMode === 'voice' ? tAccess('voiceModeActivated') : tAccess('chatModeActivated'));
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickReplies(true);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (!mounted) return null;

  return (
    <>
      {/* Widget Butonu */}
      <div className="fixed bottom-6 right-4 z-50">
        <button
          onClick={toggleWidget}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center
            shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isOpen 
              ? 'bg-gradient-to-br from-gray-600 to-gray-800' 
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            }
          `}
          aria-label={isOpen ? 'Asistanı kapat' : 'Asistanı aç'}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <RobotIcon className="w-7 h-7 text-white" />
          )}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      {/* Chat Penceresi */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ height: '560px', maxHeight: 'calc(100vh - 140px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                <RobotIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{roleConfig.title}</h3>
                <p className="text-xs text-blue-100">{roleConfig.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => switchMode(mode === 'chat' ? 'voice' : 'chat')}
                className={`p-2 rounded-lg transition-all ${mode === 'voice' ? 'bg-white/25 scale-105' : 'hover:bg-white/15'}`}
                title={mode === 'voice' ? 'Yazı Modu' : 'Sesli Mod'}
              >
                {mode === 'voice' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={clearChat} 
                className="p-2 rounded-lg hover:bg-white/15 transition-all" 
                title="Sohbeti Temizle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-md">
                    <RobotIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex flex-col max-w-[78%]">
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                    }`}
                    onMouseEnter={() => ttsEnabled && speak(message.content)}
                    tabIndex={0}
                    onFocus={() => ttsEnabled && speak(message.content)}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className={`text-[10px] mt-1 text-gray-400 ${message.role === 'user' ? 'text-right mr-1' : 'ml-2'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ml-2 shadow-md">
                    <span className="text-white font-medium text-sm">{user?.ad?.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-md">
                  <RobotIcon className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Hızlı Yanıtlar */}
            {showQuickReplies && messages.length <= 1 && !isLoading && (
              <div className="pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">💡 Hızlı erişim:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.slice(0, 8).map((reply) => (
                    <button 
                      key={reply.id} 
                      onClick={() => handleQuickReply(reply.query)}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow"
                    >
                      <span className="text-base">{reply.icon}</span>
                      <span className="truncate">{reply.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {mode === 'chat' ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Mesajını yaz..." 
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all" 
                />
                <button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            ) : (
              <VoiceInput onResult={handleVoiceResult} isProcessing={isLoading} />
            )}

            {isSpeaking && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/30 rounded-lg py-2">
                <div className="flex gap-0.5">
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-blue-600 dark:text-blue-400">Konuşuyor...</span>
                <button onClick={stop} className="text-red-500 hover:text-red-600 font-medium ml-2">Durdur</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ChatbotWidget;
