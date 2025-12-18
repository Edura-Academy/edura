'use client';

import { useState, useRef, useEffect } from 'react';
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
  Clock,
  Star,
  Trash2,
  Archive,
  Filter,
  ChevronDown,
  User,
  Users,
  Mail,
  Phone,
  X,
} from 'lucide-react';

// Mock kişiler
const mockKisiler = [
  { id: '1', ad: 'Ahmet Yıldırım', rol: 'Müdür', email: 'ahmet@edura.com', avatar: null, online: true },
  { id: '2', ad: 'Fatma Öztürk', rol: 'Öğretmen', email: 'fatma@edura.com', avatar: null, online: true },
  { id: '3', ad: 'Ayşe Kaya', rol: 'Sekreter', email: 'ayse@edura.com', avatar: null, online: false },
  { id: '4', ad: 'Ali Demir', rol: 'Öğretmen', email: 'ali@edura.com', avatar: null, online: false },
  { id: '5', ad: 'Zeynep Çelik', rol: 'Veli', email: 'zeynep@gmail.com', avatar: null, online: false },
];

// Mock konuşmalar
const mockKonusmalar = [
  {
    id: '1',
    kisiId: '1',
    kisiAd: 'Ahmet Yıldırım',
    kisiRol: 'Müdür',
    online: true,
    sonMesaj: 'Yarınki toplantı için gündem maddelerini hazırladım.',
    sonMesajTarih: '2024-01-15 14:30',
    okunmamis: 2,
    favorili: true,
  },
  {
    id: '2',
    kisiId: '2',
    kisiAd: 'Fatma Öztürk',
    kisiRol: 'Öğretmen',
    online: true,
    sonMesaj: 'Ders programı değişikliği hakkında konuşabilir miyiz?',
    sonMesajTarih: '2024-01-15 11:20',
    okunmamis: 0,
    favorili: false,
  },
  {
    id: '3',
    kisiId: '3',
    kisiAd: 'Ayşe Kaya',
    kisiRol: 'Sekreter',
    online: false,
    sonMesaj: 'Puantaj formları sisteme yüklendi.',
    sonMesajTarih: '2024-01-14 16:45',
    okunmamis: 1,
    favorili: false,
  },
  {
    id: '4',
    kisiId: '5',
    kisiAd: 'Zeynep Çelik',
    kisiRol: 'Veli',
    online: false,
    sonMesaj: 'Can\'ın not durumu hakkında görüşmek istiyorum.',
    sonMesajTarih: '2024-01-13 10:00',
    okunmamis: 0,
    favorili: false,
  },
];

// Mock mesajlar (seçili konuşma için)
const mockMesajDetay = [
  { id: '1', gonderenId: '1', mesaj: 'Merhaba, yarınki öğretmenler kurulu toplantısı için gündem maddelerini hazırladım.', tarih: '2024-01-15 14:00', okundu: true },
  { id: '2', gonderenId: 'ben', mesaj: 'Merhaba, teşekkürler. Gündem maddelerini paylaşır mısınız?', tarih: '2024-01-15 14:15', okundu: true },
  { id: '3', gonderenId: '1', mesaj: '1. Dönem sonu değerlendirmesi\n2. Yeni dönem planlaması\n3. Veli toplantısı tarihi\n4. Sosyal etkinlikler', tarih: '2024-01-15 14:20', okundu: true },
  { id: '4', gonderenId: '1', mesaj: 'Ayrıca sizden matematik dersi için bir sunum hazırlamanızı rica ediyorum.', tarih: '2024-01-15 14:25', okundu: true },
  { id: '5', gonderenId: '1', mesaj: 'Yarınki toplantı için gündem maddelerini hazırladım.', tarih: '2024-01-15 14:30', okundu: false },
];

export default function MesajlarPage() {
  const [konusmalar] = useState(mockKonusmalar);
  const [kisiler] = useState(mockKisiler);
  const [seciliKonusma, setSeciliKonusma] = useState(mockKonusmalar[0]);
  const [mesajlar, setMesajlar] = useState(mockMesajDetay);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filterType, setFilterType] = useState<'hepsi' | 'okunmamis' | 'favoriler'>('hepsi');
  
  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mesaj listesini en alta kaydır
  useEffect(() => {
    if (mesajListRef.current) {
      mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
    }
  }, [mesajlar]);

  const handleMesajGonder = () => {
    if (!yeniMesaj.trim()) return;

    const yeniMesajObj = {
      id: String(mesajlar.length + 1),
      gonderenId: 'ben',
      mesaj: yeniMesaj,
      tarih: new Date().toLocaleString('tr-TR'),
      okundu: false,
    };

    setMesajlar([...mesajlar, yeniMesajObj]);
    setYeniMesaj('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMesajGonder();
    }
  };

  const filteredKonusmalar = konusmalar.filter(k => {
    if (aramaText && !k.kisiAd.toLowerCase().includes(aramaText.toLowerCase())) {
      return false;
    }
    if (filterType === 'okunmamis' && k.okunmamis === 0) return false;
    if (filterType === 'favoriler' && !k.favorili) return false;
    return true;
  });

  const formatTarih = (tarih: string) => {
    const date = new Date(tarih);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return tarih.split(' ')[1]?.slice(0, 5) || '';
    } else if (days === 1) {
      return 'Dün';
    } else if (days < 7) {
      const gunler = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return gunler[date.getDay()];
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex">
      {/* Sol Panel - Konuşmalar Listesi */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-96 bg-white border-r border-slate-200`}>
        {/* Başlık */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/personel"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Mesajlar</h1>
            </div>
            <button
              onClick={() => setShowYeniMesajModal(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Kişi veya mesaj ara..."
              value={aramaText}
              onChange={(e) => setAramaText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtreler */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilterType('hepsi')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === 'hepsi' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hepsi
            </button>
            <button
              onClick={() => setFilterType('okunmamis')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === 'okunmamis' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Okunmamış
            </button>
            <button
              onClick={() => setFilterType('favoriler')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === 'favoriler' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Favoriler
            </button>
          </div>
        </div>

        {/* Konuşmalar Listesi */}
        <div className="flex-1 overflow-y-auto">
          {filteredKonusmalar.map((konusma) => (
            <button
              key={konusma.id}
              onClick={() => {
                setSeciliKonusma(konusma);
                setShowMobileSidebar(false);
              }}
              className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                seciliKonusma?.id === konusma.id ? 'bg-blue-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                  {konusma.kisiAd.split(' ').map(n => n[0]).join('')}
                </div>
                {konusma.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 truncate">{konusma.kisiAd}</span>
                  <span className="text-xs text-slate-400">{formatTarih(konusma.sonMesajTarih)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 truncate pr-2">{konusma.sonMesaj}</p>
                  <div className="flex items-center gap-2">
                    {konusma.favorili && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    {konusma.okunmamis > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {konusma.okunmamis}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{konusma.kisiRol}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sağ Panel - Mesaj Detay */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-white`}>
        {seciliKonusma ? (
          <>
            {/* Konuşma Başlığı */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {seciliKonusma.kisiAd.split(' ').map(n => n[0]).join('')}
                  </div>
                  {seciliKonusma.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">{seciliKonusma.kisiAd}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <span>{seciliKonusma.kisiRol}</span>
                    <span>•</span>
                    <span className={seciliKonusma.online ? 'text-green-600' : ''}>
                      {seciliKonusma.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Phone size={20} className="text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Star size={20} className={seciliKonusma.favorili ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Mesajlar */}
            <div 
              ref={mesajListRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
              {/* Tarih Ayracı */}
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 bg-white text-slate-500 text-xs rounded-full shadow-sm">
                  Bugün
                </span>
              </div>

              {mesajlar.map((mesaj) => (
                <div
                  key={mesaj.id}
                  className={`flex ${mesaj.gonderenId === 'ben' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      mesaj.gonderenId === 'ben'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-slate-800 shadow-sm rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{mesaj.mesaj}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      mesaj.gonderenId === 'ben' ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                      <span className="text-xs">{mesaj.tarih.split(' ')[1]?.slice(0, 5)}</span>
                      {mesaj.gonderenId === 'ben' && (
                        mesaj.okundu 
                          ? <CheckCheck size={14} className="text-blue-200" />
                          : <Check size={14} className="text-blue-200" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mesaj Gönderme */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                  <Paperclip size={22} />
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={yeniMesaj}
                    onChange={(e) => setYeniMesaj(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesajınızı yazın..."
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleMesajGonder}
                  disabled={!yeniMesaj.trim()}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Mail size={48} className="mx-auto mb-4 opacity-50" />
              <p>Konuşma seçin</p>
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
            <div className="p-4">
              {/* Arama */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kişi ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kişiler */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {kisiler.map((kisi) => (
                  <button
                    key={kisi.id}
                    onClick={() => {
                      // Yeni konuşma başlat
                      setShowYeniMesajModal(false);
                    }}
                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {kisi.ad.split(' ').map(n => n[0]).join('')}
                      </div>
                      {kisi.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-slate-800">{kisi.ad}</p>
                      <p className="text-xs text-slate-500">{kisi.rol}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
