'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Star,
  Phone,
  X,
  Users,
  User,
  GraduationCap,
  Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Konusma {
  id: string;
  tip: string;
  ad: string;
  resimUrl?: string;
  sonMesaj?: {
    icerik: string;
    gonderenAd: string;
    tarih: string;
  };
  okunmamis: number;
  uyeler: Array<{
    id: string;
    ad: string;
    rol: string;
    brans?: string;
    grupRol?: string;
    online?: boolean;
  }>;
  sabitle: boolean;
  seslesiz: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Mesaj {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  gonderenRol?: string;
  icerik: string;
  dosyaUrl?: string;
  dosyaTip?: string;
  tarih: string;
  okundu: boolean;
  duzenlendi?: boolean;
}

interface AvailableUser {
  id: string;
  ad: string;
  soyad: string;
  rol: string;
  brans?: string;
  sinif?: string;
}

export default function MesajlarPage() {
  // State
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([]);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filterType, setFilterType] = useState<'hepsi' | 'okunmamis' | 'gruplar'>('hepsi');
  const [yeniMesajTip, setYeniMesajTip] = useState<'personel' | 'ogrenci' | 'grup'>('personel');
  const [showGrupProfil, setShowGrupProfil] = useState(false);
  const [yeniGrupAdi, setYeniGrupAdi] = useState('');
  const [yeniGrupUyeler, setYeniGrupUyeler] = useState<string[]>([]);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [selectedUye, setSelectedUye] = useState<any>(null);
  const [showUyeMenu, setShowUyeMenu] = useState(false);
  const [showProfilPanel, setShowProfilPanel] = useState(false);
  const [profilUye, setProfilUye] = useState<any>(null);
  const [showUyeEkleModal, setShowUyeEkleModal] = useState(false);
  const [secilenYeniUyeler, setSecilenYeniUyeler] = useState<string[]>([]);
  const [showMedyaModal, setShowMedyaModal] = useState(false);
  const [showSikayetModal, setShowSikayetModal] = useState(false);
  const [sikayetMesaj, setSikayetMesaj] = useState('');
  const [engellenenKullanicilar, setEngellenenKullanicilar] = useState<string[]>([]);
  
  // API Loading states
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Current user
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  // Token ve kullanıcı bilgisini al
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Kullanıcı bilgisini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Konuşmaları API'den çek
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setKonusmalar(data.data);
        // İlk konuşmayı seç (eğer seçili değilse)
        if (data.data.length > 0 && !seciliKonusma) {
          setSeciliKonusma(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Konuşmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, seciliKonusma]);

  // Mesajları API'den çek
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMesajlar(data.data);
        if (data.data.length > 0) {
          lastMessageTimeRef.current = data.data[data.data.length - 1].tarih;
        }
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  }, [getAuthHeaders]);

  // Yeni mesajları kontrol et (polling)
  const checkNewMessages = useCallback(async () => {
    if (!seciliKonusma || !lastMessageTimeRef.current) return;
    
    try {
      const response = await fetch(
        `${API_URL}/messages/conversations/${seciliKonusma.id}/messages/new?after=${encodeURIComponent(lastMessageTimeRef.current)}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setMesajlar(prev => {
          const newMessages = data.data.filter(
            (nm: Mesaj) => !prev.some(pm => pm.id === nm.id)
          );
          if (newMessages.length > 0) {
            lastMessageTimeRef.current = newMessages[newMessages.length - 1].tarih;
            return [...prev, ...newMessages];
          }
          return prev;
        });
        // Konuşmalar listesini de güncelle
        fetchConversations();
      }
    } catch (error) {
      console.error('Yeni mesajlar kontrol edilemedi:', error);
    }
  }, [seciliKonusma, getAuthHeaders, fetchConversations]);

  // İlk yüklemede konuşmaları çek
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Konuşma değiştiğinde mesajları çek
  useEffect(() => {
    if (seciliKonusma) {
      fetchMessages(seciliKonusma.id);
    }
  }, [seciliKonusma, fetchMessages]);

  // Polling başlat/durdur
  useEffect(() => {
    if (seciliKonusma) {
      // Her 3 saniyede bir yeni mesajları kontrol et
      pollingRef.current = setInterval(checkNewMessages, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [seciliKonusma, checkNewMessages]);

  // Mesaj listesini en alta kaydır
  useEffect(() => {
    if (mesajListRef.current) {
      mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
    }
  }, [mesajlar]);

  // Mesaj gönder
  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim() || !seciliKonusma || sendingMessage) return;

    setSendingMessage(true);
    const mesajIcerik = yeniMesaj.trim();
    setYeniMesaj('');

    try {
      const response = await fetch(`${API_URL}/messages/conversations/${seciliKonusma.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ icerik: mesajIcerik })
      });
      
      const data = await response.json();
      if (data.success) {
        setMesajlar(prev => [...prev, data.data]);
        lastMessageTimeRef.current = data.data.tarih;
        // Konuşmalar listesini güncelle
        fetchConversations();
      } else {
        setYeniMesaj(mesajIcerik); // Hata durumunda mesajı geri koy
        alert('Mesaj gönderilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      setYeniMesaj(mesajIcerik);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  // Kullanıcıları ara (yeni mesaj için)
  const searchUsers = useCallback(async (query: string, type: 'personel' | 'ogrenci') => {
    setSearchingUsers(true);
    try {
      const params = new URLSearchParams({ type });
      if (query.trim()) {
        params.append('search', query);
      }
      const response = await fetch(`${API_URL}/messages/users?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data);
      }
    } catch (error) {
      console.error('Kullanıcılar aranamadı:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [getAuthHeaders]);

  // Yeni mesaj modalı açıldığında kullanıcıları yükle
  useEffect(() => {
    if (showYeniMesajModal && yeniMesajTip !== 'grup') {
      searchUsers(userSearchQuery, yeniMesajTip);
    }
  }, [showYeniMesajModal, yeniMesajTip, userSearchQuery, searchUsers]);

  // Yeni konuşma oluştur ve mesajlaşma başlat
  const handleStartConversation = async (targetUser: AvailableUser) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          targetUserId: targetUser.id,
          tip: 'OZEL'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Konuşmaları yeniden yükle
        await fetchConversations();
        
        // Yeni veya mevcut konuşmayı bul ve seç
        const newConv: Konusma = {
          id: data.data.id,
          tip: data.data.tip,
          ad: data.data.ad,
          okunmamis: 0,
          uyeler: data.data.uyeler,
          sabitle: false,
          seslesiz: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setSeciliKonusma(newConv);
        setShowYeniMesajModal(false);
        setShowMobileSidebar(false);
        setUserSearchQuery('');
      }
    } catch (error) {
      console.error('Konuşma oluşturulamadı:', error);
      alert('Konuşma başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  // Yeni grup oluştur
  const handleCreateGroup = async () => {
    if (!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0) return;

    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tip: 'OZEL_GRUP',
          ad: yeniGrupAdi.trim(),
          uyeIds: yeniGrupUyeler
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        setYeniGrupAdi('');
        setYeniGrupUyeler([]);
        setShowYeniMesajModal(false);
        alert('Grup başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Grup oluşturulamadı:', error);
      alert('Grup oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMesajGonder();
    }
  };

  // Tarihi Date objesine çevirme (sıralama için)
  const parseTarih = (tarih: string): Date => {
    // Format: "2024-12-18 14:30" veya "18.12.2024 14:30:00"
    if (tarih.includes('-')) {
      // ISO formatı: 2024-12-18 14:30
      return new Date(tarih.replace(' ', 'T'));
    } else if (tarih.includes('.')) {
      // TR formatı: 18.12.2024 14:30:00
      const [datePart, timePart] = tarih.split(' ');
      const [day, month, year] = datePart.split('.');
      return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
    }
    return new Date(tarih);
  };

  // Filtrelenmiş ve sıralanmış konuşmalar (en yeni mesaj en üstte)
  const filteredKonusmalar = konusmalar
    .filter(k => {
      if (aramaText && !k.ad.toLowerCase().includes(aramaText.toLowerCase())) {
        return false;
      }
      if (filterType === 'okunmamis' && k.okunmamis === 0) return false;
      if (filterType === 'gruplar' && k.tip === 'OZEL') return false;
      return true;
    })
    .sort((a, b) => {
      const tarihA = a.sonMesaj?.tarih ? new Date(a.sonMesaj.tarih) : new Date(a.updatedAt);
      const tarihB = b.sonMesaj?.tarih ? new Date(b.sonMesaj.tarih) : new Date(b.updatedAt);
      return tarihB.getTime() - tarihA.getTime(); // En yeni en üstte
    });

  // Sadece saat formatı (HH:mm)
  const formatSaat = (tarih: string) => {
    try {
      const date = new Date(tarih);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Konuşma listesi için kısa tarih
  const formatTarih = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Tarih ayracı için gün etiketi (WhatsApp tarzı)
  const getTarihAyrac = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Bugün';
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Mesajları tarihe göre grupla
  const getMesajlarWithDateSeparators = () => {
    const result: Array<{ type: 'date' | 'message'; content: string | Mesaj }> = [];
    let lastDateKey = '';

    mesajlar.forEach((mesaj) => {
      const date = new Date(mesaj.tarih);
      const dateKey = date.toLocaleDateString('tr-TR');
      
      if (dateKey !== lastDateKey) {
        result.push({ type: 'date', content: getTarihAyrac(mesaj.tarih) });
        lastDateKey = dateKey;
      }
      result.push({ type: 'message', content: mesaj });
    });

    return result;
  };

  // Konuşma tipi ikonu
  const getKonusmaIcon = (tip: string) => {
    switch (tip) {
      case 'OGRETMEN': return '👨‍🏫';
      case 'PERSONEL': return '🏫';
      case 'SINIF': return '📚';
      case 'OZEL_GRUP': return '👥';
      default: return null;
    }
  };

  // Kullanıcı grup yöneticisi mi kontrolü
  const isGrupYoneticisi = () => {
    if (!seciliKonusma || seciliKonusma.tip === 'OZEL' || !currentUser) return false;
    // Personel grubunda müdürler yöneticidir
    const currentUserName = `${currentUser.ad} ${currentUser.soyad}`;
    const member = seciliKonusma.uyeler.find(u => u.ad === currentUserName);
    return member?.grupRol === 'admin' || currentUser.role === 'mudur';
  };

  // Grup ayarı tıklama handler
  const handleGrupAyarClick = (action: string) => {
    if (!isGrupYoneticisi()) {
      setShowAdminWarning(true);
      return;
    }
    
    // Yönetici ise işlem yap
    switch(action) {
      case 'resim':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            alert(`Grup resmi "${file.name}" yükleniyor... (Firebase entegrasyonu hazır)`);
          }
        };
        input.click();
        break;
      case 'ad':
        const yeniAd = prompt('Yeni grup adını girin:', seciliKonusma?.ad);
        if (yeniAd && yeniAd.trim()) {
          alert(`Grup adı "${yeniAd}" olarak değiştirildi!`);
        }
        break;
      case 'bildirim':
        alert('Bildirim ayarları açılıyor...');
        break;
      case 'ayril':
        if (confirm('Gruptan ayrılmak istediğinizden emin misiniz?')) {
          alert('Gruptan ayrıldınız!');
          setShowGrupProfil(false);
        }
        break;
    }
  };

  // Kullanıcıyla mesajlaşma başlat (API ile)
  const handleUyeyleMesajlasma = async (uye: any) => {
    setShowUyeMenu(false);
    setShowProfilPanel(false);
    setShowGrupProfil(false);
    
    // Mevcut konuşmayı kontrol et
    const mevcutKonusma = konusmalar.find(k => 
      k.tip === 'OZEL' && k.uyeler.some(u => u.ad === uye.ad)
    );

    if (mevcutKonusma) {
      // Mevcut konuşma varsa onu seç
      setSeciliKonusma(mevcutKonusma);
      setShowMobileSidebar(false);
    } else {
      // API ile yeni konuşma oluştur
      try {
        const response = await fetch(`${API_URL}/messages/conversations`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            targetUserId: uye.id,
            tip: 'OZEL'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          await fetchConversations();
          const newConv: Konusma = {
            id: data.data.id,
            tip: data.data.tip,
            ad: data.data.ad,
            okunmamis: 0,
            uyeler: data.data.uyeler,
            sabitle: false,
            seslesiz: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setSeciliKonusma(newConv);
          setShowMobileSidebar(false);
        }
      } catch (error) {
        console.error('Konuşma oluşturulamadı:', error);
      }
    }
  };

  // Profil görüntüle
  const handleProfilGoruntule = (uye: any) => {
    setProfilUye(uye);
    setShowProfilPanel(true);
    setShowUyeMenu(false);
    setShowGrupProfil(false); // Grup profil modalını kapat
  };

  return (
    <div className="h-screen flex bg-[#FAFAFA]">
      {/* Sol Panel - Konuşmalar Listesi (WhatsApp Style) */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[360px] bg-white border-r border-[#EEEEEE]`}>
        {/* Header */}
        <div className="bg-white border-b border-[#EEEEEE]">
          {/* Başlık */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-[23px] font-bold text-black tracking-tight">Messages</h1>
              <button
                onClick={() => setShowYeniMesajModal(true)}
                className="w-10 h-10 rounded-full bg-[#27AE60] text-white flex items-center justify-center hover:bg-[#219653] transition-all shadow-lg shadow-[#27AE60]/25"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Arama */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#676767]" />
              <input
                type="text"
                placeholder="Search"
                value={aramaText}
                onChange={(e) => setAramaText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#EEEEEE] rounded-xl text-sm text-black/85 placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30"
              />
            </div>
          </div>

          {/* Sıralama ve Filtreler */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-black/65">Sort by</span>
              <button className="flex items-center gap-1 text-sm text-[#2D9CDB] font-medium">
                Newest
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {/* Mini Filtreler */}
            <div className="flex gap-1">
              <button
                onClick={() => setFilterType('hepsi')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === 'hepsi' ? 'bg-[#27AE60] text-white' : 'text-black/45 hover:bg-[#FAFAFA]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('okunmamis')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === 'okunmamis' ? 'bg-[#27AE60] text-white' : 'text-black/45 hover:bg-[#FAFAFA]'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilterType('gruplar')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === 'gruplar' ? 'bg-[#27AE60] text-white' : 'text-black/45 hover:bg-[#FAFAFA]'
                }`}
              >
                Groups
              </button>
            </div>
          </div>
        </div>

        {/* Konuşmalar Listesi */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#27AE60]" />
              <span className="ml-2 text-black/45">Konuşmalar yükleniyor...</span>
            </div>
          ) : filteredKonusmalar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-[#EEEEEE] flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-black/30" />
              </div>
              <p className="text-black/45 text-center">Henüz konuşma yok</p>
              <button
                onClick={() => setShowYeniMesajModal(true)}
                className="mt-4 px-4 py-2 bg-[#27AE60] text-white rounded-lg text-sm font-medium hover:bg-[#219653] transition-colors"
              >
                Yeni Mesaj Başlat
              </button>
            </div>
          ) : filteredKonusmalar.map((konusma) => (
            <button
              key={konusma.id}
              onClick={() => {
                setSeciliKonusma(konusma);
                setShowMobileSidebar(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                seciliKonusma?.id === konusma.id ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                  konusma.tip === 'OGRETMEN' 
                    ? 'bg-gradient-to-br from-[#9B59B6] to-[#8E44AD]'
                    : konusma.tip === 'PERSONEL'
                      ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                      : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                }`}>
                  {getKonusmaIcon(konusma.tip) || konusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                {konusma.tip === 'OZEL' && konusma.uyeler[0]?.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#27AE60] rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-sm text-black/85 truncate">{konusma.ad}</span>
                  <span className="text-xs text-black/65 flex-shrink-0">
                    {konusma.sonMesaj ? formatTarih(konusma.sonMesaj.tarih) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate pr-2 ${
                    konusma.okunmamis > 0 ? 'text-black/85 font-medium' : 'text-black/45'
                  }`}>
                    {konusma.sonMesaj?.icerik || 'Yeni sohbet'}
                  </p>
                  {konusma.okunmamis > 0 ? (
                    <span className="bg-[#27AE60] text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0">
                      {konusma.okunmamis}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-[#27AE60] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 6L4 17" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Geri Butonu (Mobil) */}
        <div className="p-3 border-t border-[#EEEEEE] md:hidden">
          <Link
            href="/personel"
            className="flex items-center gap-2 text-sm text-black/65 hover:text-black/85 transition-colors"
          >
            <ArrowLeft size={16} />
            Geri Dön
          </Link>
        </div>
      </div>

      {/* Sağ Panel - Mesaj Detay (WhatsApp Style) */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 relative`}>
        {seciliKonusma ? (
          <>
            {/* Konuşma Başlığı - WhatsApp Style */}
            <div className="bg-white border-b border-[#EEEEEE] shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#FAFAFA] transition-colors"
                  >
                    <ArrowLeft size={20} className="text-black/65" />
                  </button>
                  <button
                    onClick={() => seciliKonusma.tip !== 'OZEL' && setShowGrupProfil(true)}
                    className={`flex items-center gap-3 ${seciliKonusma.tip !== 'OZEL' ? 'hover:bg-[#FAFAFA] rounded-lg p-2 -m-2 transition-colors cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="relative">
                      <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        seciliKonusma.tip === 'OGRETMEN' 
                          ? 'bg-gradient-to-br from-[#9B59B6] to-[#8E44AD]'
                          : seciliKonusma.tip === 'PERSONEL'
                            ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                            : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                      }`}>
                        {getKonusmaIcon(seciliKonusma.tip) || seciliKonusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-medium text-base text-black/85 text-left">{seciliKonusma.ad}</h2>
                      <p className="text-sm text-left">
                        {seciliKonusma.tip !== 'OZEL' ? (
                          <span className="text-black/45">{seciliKonusma.uyeler.length} üye</span>
                        ) : (
                          <span className={seciliKonusma.uyeler[0]?.online ? 'text-[#27AE60]' : 'text-black/45'}>
                            {seciliKonusma.uyeler[0]?.online ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                </div>
                
                {/* Header Aksiyonları */}
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Mesajlar - Arkaplan Resimli */}
            <div 
              ref={mesajListRef}
              className="flex-1 overflow-y-auto relative bg-[#FAFAFA]"
            >
              {/* Arkaplan resmi */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(/chat-backgrounds/speech-bubbles.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.12,
                }}
              ></div>
              
              {/* Mesaj içerikleri */}
              <div className="relative z-10 p-4 space-y-2">
                {getMesajlarWithDateSeparators().map((item, index) => {
                  // Tarih Ayracı - WhatsApp Style
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${index}`} className="flex justify-center py-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs font-medium text-black/60 shadow-sm">
                          {item.content as string}
                        </span>
                      </div>
                    );
                  }

                  // Mesaj
                  const mesaj = item.content as Mesaj;
                  const isBenimMesajim = currentUser?.id === mesaj.gonderenId;
                  return (
                    <div
                      key={mesaj.id}
                      className={`flex items-end gap-2 ${isBenimMesajim ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar - Sadece gelen mesajlarda */}
                      {!isBenimMesajim && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3498DB] to-[#2980B9] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                          {mesaj.gonderenAd.charAt(0)}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] px-3 py-2 ${
                          isBenimMesajim
                            ? 'bg-[#DCF8C6] rounded-[12px] rounded-br-[4px]'
                            : 'bg-white rounded-[12px] rounded-bl-[4px] shadow-sm'
                        }`}
                      >
                        {/* Grup mesajlarında gönderen adı */}
                        {seciliKonusma.tip !== 'OZEL' && !isBenimMesajim && (
                          <p className="text-xs font-semibold text-[#2D9CDB] mb-0.5">{mesaj.gonderenAd}</p>
                        )}
                        <div className="flex items-end gap-2">
                          <p className="text-[15px] text-black/90 whitespace-pre-wrap leading-relaxed">{mesaj.icerik}</p>
                          <div className="flex items-center gap-1 flex-shrink-0 -mb-0.5">
                            <span className="text-[11px] text-black/40">{formatSaat(mesaj.tarih)}</span>
                            {isBenimMesajim && (
                              mesaj.okundu 
                                ? <CheckCheck size={14} className="text-[#53BDEB]" />
                                : <Check size={14} className="text-black/30" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mesaj Gönderme - WhatsApp Style */}
            <div className="bg-white border-t border-[#EEEEEE] shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={yeniMesaj}
                    onChange={(e) => setYeniMesaj(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here.."
                    className="w-full px-4 py-2.5 bg-[#FAFAFA] rounded-xl text-sm text-black/85 placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30 border border-[#EEEEEE]"
                  />
                </div>
                <button
                  onClick={handleMesajGonder}
                  disabled={!yeniMesaj.trim() || sendingMessage}
                  className="text-sm font-medium text-[#27AE60] hover:text-[#219653] transition-colors disabled:text-black/30 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    'Send message'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#27AE60]/20 to-[#27AE60]/10 flex items-center justify-center">
                <Users size={48} className="text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-medium text-black/85 mb-2">Konuşma Seçin</h3>
              <p className="text-sm text-black/45">Mesajlaşmaya başlamak için<br/>soldaki listeden bir kişi seçin</p>
            </div>
          </div>
        )}

        {/* Profil Görüntüleme Paneli (WhatsApp benzeri) */}
        {showProfilPanel && profilUye && (
          <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-white shadow-2xl z-50 flex flex-col animate-slideIn">
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Kişi Bilgisi</h3>
              <button
                onClick={() => setShowProfilPanel(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profil Bilgileri */}
            <div className="flex-1 overflow-y-auto">
              {/* Profil Resmi ve İsim */}
              <div className="p-8 text-center bg-slate-50">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 ${
                  profilUye.rol === 'Müdür'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                    : profilUye.rol === 'Sekreter'
                      ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                      : 'bg-gradient-to-br from-slate-400 to-slate-600'
                }`}>
                  {profilUye.ad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{profilUye.ad}</h2>
                <p className="text-slate-600 mb-2">{profilUye.rol}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profilUye.online ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <span className="text-sm text-slate-500">{profilUye.online ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
              </div>

              {/* Hakkında */}
              <div className="p-4 border-b border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Hakkında</p>
                <p className="text-sm text-slate-700">{profilUye.rol === 'Müdür' ? '🏢 Eğitim yönetimi' : profilUye.rol === 'Sekreter' ? '📋 İdari işlemler' : '📚 Eğitim'}</p>
              </div>

              {/* İletişim Seçenekleri */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">İletişim</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      handleUyeyleMesajlasma(profilUye);
                      setShowProfilPanel(false);
                    }}
                    className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-3 transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800">Mesaj</p>
                      <p className="text-xs text-slate-500">Mesaj gönder</p>
                    </div>
                  </button>

                  <button disabled className="w-full p-3 bg-green-50 rounded-lg flex items-center gap-3 opacity-60 cursor-not-allowed">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Phone size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800">Sesli Ara</p>
                      <p className="text-xs text-slate-400 italic">Çok yakında...</p>
                    </div>
                  </button>

                  <button disabled className="w-full p-3 bg-purple-50 rounded-lg flex items-center gap-3 opacity-60 cursor-not-allowed">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800">Görüntülü Ara</p>
                      <p className="text-xs text-slate-400 italic">Çok yakında...</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Medya ve Dosyalar */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Medya ve Dosyalar</h3>
                  <button 
                    onClick={() => setShowMedyaModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Tümünü Gör
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="aspect-square bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">📸</span>
                  </button>
                  <button className="aspect-square bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">📄</span>
                  </button>
                  <button className="aspect-square bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">🎵</span>
                  </button>
                </div>
              </div>

              {/* Diğer İşlemler */}
              <div className="p-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Diğer İşlemler</h3>
                <div className="space-y-2">
                  <button className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    <span className="text-sm font-medium text-slate-700">Bildirimleri Kapat</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (profilUye) {
                        const engelliMi = engellenenKullanicilar.includes(profilUye.ad);
                        if (engelliMi) {
                          setEngellenenKullanicilar(prev => prev.filter(ad => ad !== profilUye.ad));
                          alert(`${profilUye.ad} engeli kaldırıldı`);
                        } else {
                          setEngellenenKullanicilar(prev => [...prev, profilUye.ad]);
                          alert(`${profilUye.ad} engellendi`);
                        }
                      }
                    }}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 text-red-600"
                  >
                    <span className="text-xl">🚫</span>
                    <span className="text-sm font-medium">
                      {profilUye && engellenenKullanicilar.includes(profilUye.ad) ? 'Engeli Kaldır' : 'Engelle'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowSikayetModal(true)}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 text-red-600"
                  >
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm font-medium">Şikayet Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Yeni Mesaj Modal */}
      {showYeniMesajModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Yeni Mesaj</h3>
              <button
                onClick={() => setShowYeniMesajModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Tab Seçimi */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setYeniMesajTip('personel')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  yeniMesajTip === 'personel' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <User size={16} /> Personel
              </button>
              <button
                onClick={() => setYeniMesajTip('ogrenci')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  yeniMesajTip === 'ogrenci' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <GraduationCap size={16} /> Öğrenci
              </button>
              <button
                onClick={() => setYeniMesajTip('grup')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  yeniMesajTip === 'grup' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={16} /> Yeni Grup
              </button>
            </div>

            <div className="p-4">
              {yeniMesajTip === 'grup' ? (
                // Yeni Grup Oluşturma
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Grup Adı</label>
                    <input
                      type="text"
                      value={yeniGrupAdi}
                      onChange={(e) => setYeniGrupAdi(e.target.value)}
                      placeholder="Örn: Rehberlik Öğretmenleri"
                      className="w-full px-4 py-2.5 bg-slate-100 rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Üyeler Seç ({yeniGrupUyeler.length} seçildi)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={yeniGrupUyeler.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setYeniGrupUyeler([...yeniGrupUyeler, user.id]);
                              } else {
                                setYeniGrupUyeler(yeniGrupUyeler.filter(id => id !== user.id));
                              }
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            user.rol === 'mudur' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            user.rol === 'sekreter' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                            user.rol === 'ogretmen' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                            'bg-gradient-to-br from-green-400 to-green-600'
                          }`}>
                            {user.ad[0]}{user.soyad[0]}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-slate-800">{user.ad} {user.soyad}</p>
                            <p className="text-xs text-slate-500">
                              {user.rol === 'mudur' ? 'Müdür' :
                               user.rol === 'sekreter' ? 'Sekreter' :
                               user.rol === 'ogretmen' ? `${user.brans || ''} Öğretmeni` :
                               `Öğrenci${user.sinif ? ` • ${user.sinif}` : ''}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateGroup}
                    disabled={!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Grubu Oluştur
                  </button>
                </div>
              ) : (
                <>
                  {/* Arama */}
                  <div className="relative mb-4">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={yeniMesajTip === 'personel' ? 'Personel ara...' : 'Öğrenci ara...'}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Kişiler */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-slate-500">Yükleniyor...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p>Kullanıcı bulunamadı</p>
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            user.rol === 'mudur' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            user.rol === 'sekreter' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                            user.rol === 'ogretmen' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                            'bg-gradient-to-br from-green-400 to-green-600'
                          }`}>
                            {user.ad[0]}{user.soyad[0]}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-slate-800">{user.ad} {user.soyad}</p>
                            <p className="text-xs text-slate-500">
                              {user.rol === 'mudur' ? 'Müdür' :
                               user.rol === 'sekreter' ? 'Sekreter' :
                               user.rol === 'ogretmen' ? `${user.brans || ''} Öğretmeni` :
                               `Öğrenci${user.sinif ? ` • ${user.sinif}` : ''}`}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Üye Menüsü Modal */}
      {showUyeMenu && selectedUye && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Üye Bilgisi */}
            <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold mb-3 ${
                selectedUye.rol === 'Müdür'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                  : selectedUye.rol === 'Sekreter'
                    ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                    : 'bg-gradient-to-br from-slate-400 to-slate-600'
              }`}>
                {selectedUye.ad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{selectedUye.ad}</h3>
              <p className="text-sm text-slate-600 mt-1">{selectedUye.rol}</p>
              {selectedUye.rol === 'Müdür' && (
                <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  👑 Yönetici
                </span>
              )}
            </div>

            {/* İşlem Menüsü */}
            <div className="p-4">
              <div className="space-y-2">
                <button 
                  onClick={() => handleProfilGoruntule(selectedUye)}
                  className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Üyeyi Görüntüle</span>
                </button>

                <button 
                  onClick={() => handleUyeyleMesajlasma(selectedUye)}
                  className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Mesaj Gönder</span>
                </button>

                {/* Yönetici Özellikleri */}
                {isGrupYoneticisi() && (
                  <>
                    <div className="border-t border-slate-200 my-2"></div>
                    
                    {selectedUye.rol === 'Müdür' ? (
                      <button 
                        onClick={() => {
                          if (confirm(`${selectedUye.ad} yönetici rolünden düşürülsün mü?`)) {
                            alert(`${selectedUye.ad} artık yönetici değil`);
                            setShowUyeMenu(false);
                          }
                        }}
                        className="w-full p-3 text-left hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-orange-700">Yönetici Rolünden Düşür</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (confirm(`${selectedUye.ad} yönetici yapılsın mı?`)) {
                            alert(`${selectedUye.ad} artık yönetici!`);
                            setShowUyeMenu(false);
                          }
                        }}
                        className="w-full p-3 text-left hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">👑</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-700">Yönetici Yap</span>
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        if (confirm(`${selectedUye.ad} gruptan çıkarılsın mı?`)) {
                          alert(`${selectedUye.ad} gruptan çıkarıldı`);
                          setShowUyeMenu(false);
                        }
                      }}
                      className="w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <X size={20} className="text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-red-600">Gruptan Çıkar</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowUyeMenu(false)}
                className="w-full mt-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yönetici Uyarı Modalı */}
      {showAdminWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Yetki Gerekli</h3>
              <p className="text-sm text-slate-600 mb-6">
                Bu işlemi sadece grup yöneticileri yapabilir.
              </p>
              <button
                onClick={() => setShowAdminWarning(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grup Profil Modal */}
      {showGrupProfil && seciliKonusma && seciliKonusma.tip !== 'ozel' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Grup Bilgileri</h3>
              <button
                onClick={() => setShowGrupProfil(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grup Avatar ve İsim */}
            <div className="p-6 text-center border-b border-slate-200">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 ${
                seciliKonusma.tip === 'ogretmenler' 
                  ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                {getKonusmaIcon(seciliKonusma.tip) || '👥'}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{seciliKonusma.ad}</h2>
              <p className="text-sm text-slate-500">Grup • {seciliKonusma.uyeler.length} üye</p>
            </div>

            {/* Üyeler Listesi */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
                  <span>👥 Grup Üyeleri ({seciliKonusma.uyeler.length})</span>
                  <button 
                    onClick={() => {
                      if (!isGrupYoneticisi()) {
                        setShowAdminWarning(true);
                      } else {
                        setShowUyeEkleModal(true);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full font-medium transition-all hover:shadow-lg hover:from-blue-600 hover:to-blue-800"
                  >
                    <Plus size={16} />
                    <span className="text-xs">Üye Ekle</span>
                  </button>
                </h3>
                <div className="space-y-2">
                  {seciliKonusma.uyeler.map((uye, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedUye(uye);
                        setShowUyeMenu(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        uye.rol === 'Müdür'
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                          : uye.rol === 'Sekreter'
                            ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                            : 'bg-gradient-to-br from-slate-400 to-slate-600'
                      }`}>
                        {uye.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-800 flex items-center gap-2">
                          {uye.ad}
                          {uye.rol === 'Müdür' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Yönetici</span>}
                        </p>
                        <p className="text-xs text-slate-500">{uye.rol}</p>
                      </div>
                      {uye.online && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grup Ayarları */}
              <div className="p-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">⚙️ Grup Ayarları</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleGrupAyarClick('resim')}
                    className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">🖼️</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">Grup Resmini Değiştir</span>
                      {!isGrupYoneticisi() && <span className="block text-xs text-slate-400 mt-0.5">Sadece yöneticiler</span>}
                    </div>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('ad')}
                    className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">✏️</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">Grup Adını Düzenle</span>
                      {!isGrupYoneticisi() && <span className="block text-xs text-slate-400 mt-0.5">Sadece yöneticiler</span>}
                    </div>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('bildirim')}
                    className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">📢</span>
                    <span className="text-sm font-medium text-slate-700">Bildirim Ayarları</span>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('ayril')}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 text-red-600"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="text-sm font-medium">Gruptan Ayrıl</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Medya Modal - Personel */}
      {showMedyaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Medya ve Dosyalar</h3>
              <button onClick={() => setShowMedyaModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">📸 Fotoğraflar</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
                      <span className="text-3xl">🖼️</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">📄 Belgeler</h4>
                <div className="space-y-2">
                  {['Toplantı Notları.pdf', 'Rapor.xlsx', 'Sunum.pptx'].map((dosya, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{dosya}</p>
                        <p className="text-xs text-slate-500">1.8 MB • 2 gün önce</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şikayet Modal - Personel */}
      {showSikayetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 bg-red-600 text-white">
              <h3 className="text-lg font-bold">Kullanıcıyı Şikayet Et</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm text-yellow-800">Şikayetiniz yöneticiye iletilecektir.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Şikayet Edilen: <span className="font-bold">{profilUye?.ad}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Şikayet Nedeni</label>
                <textarea
                  value={sikayetMesaj}
                  onChange={(e) => setSikayetMesaj(e.target.value)}
                  placeholder="Şikayetinizi detaylı olarak yazın..."
                  className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSikayetModal(false);
                    setSikayetMesaj('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (sikayetMesaj.trim()) {
                      alert(`Şikayetiniz yöneticiye iletildi.\n\nŞikayet Edilen: ${profilUye?.ad}\nMesaj: ${sikayetMesaj}`);
                      setShowSikayetModal(false);
                      setSikayetMesaj('');
                      setShowProfilPanel(false);
                    }
                  }}
                  disabled={!sikayetMesaj.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    sikayetMesaj.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Şikayet Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Üye Ekleme Modal - Personel */}
      {showUyeEkleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Gruba Üye Ekle</h3>
              <button onClick={() => { setShowUyeEkleModal(false); setSecilenYeniUyeler([]); }} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">Gruba eklemek istediğiniz kişileri seçin:</p>
              <div className="space-y-2">
                {availableUsers.map((user) => {
                  const uyeAd = `${user.ad} ${user.soyad}`;
                  const mevcutMu = seciliKonusma?.uyeler.some(u => u.ad === uyeAd);
                  if (mevcutMu) return null;
                  const seciliMi = secilenYeniUyeler.includes(user.id);
                  
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        if (seciliMi) {
                          setSecilenYeniUyeler(prev => prev.filter(id => id !== user.id));
                        } else {
                          setSecilenYeniUyeler(prev => [...prev, user.id]);
                        }
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        seciliMi ? 'bg-blue-50 border-2 border-blue-500' : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900">{uyeAd}</p>
                        <p className="text-xs text-slate-500">
                          {user.rol === 'mudur' ? 'Müdür' : user.rol === 'sekreter' ? 'Sekreter' : user.rol === 'ogretmen' ? `${user.brans} Öğretmeni` : 'Öğrenci'}
                        </p>
                      </div>
                      {seciliMi && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3">
              <button onClick={() => { setShowUyeEkleModal(false); setSecilenYeniUyeler([]); }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
                İptal
              </button>
              <button
                onClick={() => {
                  if (secilenYeniUyeler.length > 0) {
                    alert(`${secilenYeniUyeler.length} kişi gruba eklendi!`);
                    setShowUyeEkleModal(false);
                    setSecilenYeniUyeler([]);
                  }
                }}
                disabled={secilenYeniUyeler.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  secilenYeniUyeler.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Ekle ({secilenYeniUyeler.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
