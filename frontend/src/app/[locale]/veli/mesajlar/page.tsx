'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Send, User, Search, 
  MessageSquare, Loader2, Check, CheckCheck
} from 'lucide-react';

interface Conversation {
  id: string;
  tip: string;
  ad: string | null;
  uyeler: {
    user: {
      id: string;
      ad: string;
      soyad: string;
      role: string;
    };
  }[];
  mesajlar: {
    id: string;
    icerik: string;
    createdAt: string;
  }[];
}

interface Message {
  id: string;
  icerik: string;
  gonderenId: string;
  gonderen: {
    id: string;
    ad: string;
    soyad: string;
  };
  createdAt: string;
  durum: string;
}

export default function VeliMesajlar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversation');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setConversations(result.data || []);
      }
    } catch (error) {
      console.error('Konuşmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessages(result.data || []);
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          icerik: newMessage.trim()
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation);
        fetchConversations(); // Konuşma listesini güncelle
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    const otherMember = conversation.uyeler.find(u => u.user.id !== currentUser?.userId);
    return otherMember?.user;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    }
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long'
    });
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherUser = selectedConv ? getOtherUser(selectedConv) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => selectedConversation ? setSelectedConversation(null) : router.push('/veli')}
              className="p-2 text-slate-400 hover:text-white transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => router.push('/veli')}
              className="p-2 text-slate-400 hover:text-white transition-colors hidden md:block"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {selectedConversation && otherUser ? `${otherUser.ad} ${otherUser.soyad}` : 'Mesajlar'}
              </h1>
              <p className="text-xs text-slate-400">
                {selectedConversation && otherUser ? 'Öğretmen' : 'Öğretmenlerle iletişim'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">
        {/* Konuşmalar Listesi */}
        <div className={`w-full md:w-80 bg-slate-800/30 border-r border-slate-700/50 flex-shrink-0 ${selectedConversation ? 'hidden md:block' : ''}`}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ara..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const other = getOtherUser(conv);
                const lastMessage = conv.mesajlar?.[0];
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-slate-700/30 transition-colors ${
                      selectedConversation === conv.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      {other ? `${other.ad[0]}${other.soyad[0]}` : '?'}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white font-medium truncate">
                        {other ? `${other.ad} ${other.soyad}` : conv.ad || 'Konuşma'}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-slate-400 truncate">{lastMessage.icerik}</p>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Henüz mesaj yok</p>
                <p className="text-sm text-slate-500 mt-1">
                  Öğretmenlerle mesajlaşmaya başlamak için çocuğunuzun öğretmenler sayfasını ziyaret edin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mesaj Alanı */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Mesajlar */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isMe = message.gonderenId === currentUser?.userId;
                  const showDate = index === 0 || 
                    new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                          <div className={`rounded-2xl px-4 py-2 ${
                            isMe 
                              ? 'bg-purple-500 text-white rounded-br-md' 
                              : 'bg-slate-700 text-white rounded-bl-md'
                          }`}>
                            <p className="text-sm">{message.icerik}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className="text-xs text-slate-500">{formatTime(message.createdAt)}</span>
                            {isMe && (
                              message.durum === 'OKUNDU' 
                                ? <CheckCheck className="w-3 h-3 text-purple-400" />
                                : <Check className="w-3 h-3 text-slate-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Mesaj Gönderme */}
              <form onSubmit={sendMessage} className="p-4 border-t border-slate-700/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Mesajlaşmaya başlamak için bir konuşma seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

