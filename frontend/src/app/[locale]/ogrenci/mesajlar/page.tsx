'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  mockOgrenci, 
  mockOgretmenler, 
  mockSinifArkadoslari,
  mockTumKonusmalar,
  type Konusma 
} from '../../../../lib/mockData';

interface MesajDetay {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
}

// Mock mesaj detayları
const getMockMesajlar = (konusmaId: string): MesajDetay[] => {
  if (konusmaId.startsWith('grup-sinif')) {
    return [
      { id: '1', gonderenId: 'og1', gonderenAd: 'Mehmet Yılmaz', mesaj: 'Arkadaşlar yarın matematik sınavı var, unutmayın! 📝', tarih: '2024-12-18 08:00', okundu: true },
      { id: '2', gonderenId: 'ogr2', gonderenAd: 'Ali Kaya', mesaj: 'Hangi konulardan çıkacak bilen var mı?', tarih: '2024-12-18 08:15', okundu: true },
      { id: '3', gonderenId: 'og1', gonderenAd: 'Mehmet Yılmaz', mesaj: '1. ve 2. ünite dahil. Denklemler, problemler ve geometri.', tarih: '2024-12-18 08:20', okundu: true },
      { id: '4', gonderenId: 'ogr3', gonderenAd: 'Ayşe Demir', mesaj: 'Teşekkürler hocam! 🙏', tarih: '2024-12-18 08:25', okundu: true },
      { id: '5', gonderenId: 'ogr4', gonderenAd: 'Fatma Çelik', mesaj: 'Ben geometride zorlanıyorum, çalışma grubu kuralım mı?', tarih: '2024-12-18 09:00', okundu: true },
      { id: '6', gonderenId: 'ben', gonderenAd: `${mockOgrenci.ad} ${mockOgrenci.soyad}`, mesaj: 'Ben de katılırım! 💪', tarih: '2024-12-18 09:10', okundu: true },
      { id: '7', gonderenId: 'ogr2', gonderenAd: 'Ali Kaya', mesaj: 'Yarınki sınav için herkes hazır mı? 📝', tarih: '2024-12-18 09:30', okundu: false },
    ];
  } else if (konusmaId === 'ozel-arkadas1') {
    return [
      { id: '1', gonderenId: 'ogr2', gonderenAd: mockSinifArkadoslari[0]?.ad + ' ' + mockSinifArkadoslari[0]?.soyad, mesaj: 'Selam! Bugün ders nasıldı?', tarih: '2024-12-17 15:00', okundu: true },
      { id: '2', gonderenId: 'ben', gonderenAd: `${mockOgrenci.ad} ${mockOgrenci.soyad}`, mesaj: 'İyiydi, ama matematik zor geldi biraz 😅', tarih: '2024-12-17 15:05', okundu: true },
      { id: '3', gonderenId: 'ogr2', gonderenAd: mockSinifArkadoslari[0]?.ad + ' ' + mockSinifArkadoslari[0]?.soyad, mesaj: 'Aynen bende de öyle. Ödev yaptın mı?', tarih: '2024-12-17 16:30', okundu: true },
      { id: '4', gonderenId: 'ogr2', gonderenAd: mockSinifArkadoslari[0]?.ad + ' ' + mockSinifArkadoslari[0]?.soyad, mesaj: 'Matematik ödevini yaptın mı? Bende 5. soru takıldı 🤔', tarih: '2024-12-17 16:45', okundu: false },
    ];
  } else {
    // Öğretmen mesajları
    return [
      { id: '1', gonderenId: 'og1', gonderenAd: 'Öğretmen', mesaj: 'Merhaba! Yarınki derse kadar sayfa 45-50 arasındaki problemleri çözmenizi bekliyorum.', tarih: '2024-12-17 14:00', okundu: true },
      { id: '2', gonderenId: 'ben', gonderenAd: `${mockOgrenci.ad} ${mockOgrenci.soyad}`, mesaj: 'Tamam hocam, teşekkürler! 📚', tarih: '2024-12-17 14:10', okundu: true },
    ];
  }
};

export default function OgrenciMesajlar() {
  const [konusmalar] = useState<Konusma[]>(mockTumKonusmalar);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(konusmalar[0] || null);
  const [mesajlar, setMesajlar] = useState<MesajDetay[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showYeniKonusmaModal, setShowYeniKonusmaModal] = useState(false);
  const [yeniKonusmaTip, setYeniKonusmaTip] = useState<'ogretmen' | 'arkadas'>('ogretmen');

  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lise mi ortaokul mu kontrolü
  const isLise = mockOgrenci.seviye >= 9;

  // Konuşma değiştiğinde mesajları güncelle
  useEffect(() => {
    if (seciliKonusma) {
      setMesajlar(getMockMesajlar(seciliKonusma.id));
    }
  }, [seciliKonusma]);

  // Mesaj listesini en alta kaydır
  useEffect(() => {
    if (mesajListRef.current) {
      mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
    }
  }, [mesajlar]);

  const handleMesajGonder = () => {
    if (!yeniMesaj.trim() || !seciliKonusma) return;

    const yeniMesajObj: MesajDetay = {
      id: String(mesajlar.length + 1),
      gonderenId: 'ben',
      gonderenAd: `${mockOgrenci.ad} ${mockOgrenci.soyad}`,
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

  const filteredKonusmalar = konusmalar.filter(k =>
    k.ad.toLowerCase().includes(aramaText.toLowerCase())
  );

  const formatTarih = (tarih: string) => {
    const parts = tarih.split(' ');
    if (parts.length > 1) {
      return parts[1]?.slice(0, 5) || '';
    }
    return tarih;
  };

  // Konuşma tipi ikonu
  const getKonusmaIcon = (tip: string) => {
    switch (tip) {
      case 'sinif': return '👥';
      case 'ogretmen_grup': return '👨‍🏫';
      default: return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sol Panel - Konuşmalar Listesi */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-96 bg-white border-r border-gray-200`}>
        {/* Başlık */}
        <div className={`p-4 border-b border-gray-200 ${isLise ? 'bg-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/ogrenci"
                className={`p-2 rounded-lg transition-colors ${isLise ? 'hover:bg-gray-100' : 'hover:bg-white/20'}`}
              >
                <svg className={`w-5 h-5 ${isLise ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className={`text-xl font-bold ${isLise ? 'text-gray-800' : 'text-white'}`}>💬 Mesajlarım</h1>
            </div>
            <button
              onClick={() => setShowYeniKonusmaModal(true)}
              className={`p-2 rounded-lg transition-colors ${isLise ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Arama */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Kişi veya grup ara..."
              value={aramaText}
              onChange={(e) => setAramaText(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 ${
                isLise 
                  ? 'bg-gray-100 text-gray-800 placeholder:text-gray-500 focus:ring-gray-300'
                  : 'bg-white/20 text-white placeholder:text-white/70 focus:ring-white/50'
              }`}
            />
          </div>
        </div>

        {/* Konuşmalar Listesi */}
        <div className="flex-1 overflow-y-auto">
          {filteredKonusmalar.length > 0 ? (
            filteredKonusmalar.map((konusma) => (
              <button
                key={konusma.id}
                onClick={() => {
                  setSeciliKonusma(konusma);
                  setShowMobileSidebar(false);
                }}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  seciliKonusma?.id === konusma.id ? 'bg-blue-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    konusma.tip === 'sinif' 
                      ? 'bg-gradient-to-br from-green-400 to-green-600'
                      : isLise 
                        ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                        : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                  }`}>
                    {konusma.tip === 'sinif' ? '👥' : konusma.ad.charAt(0)}
                  </div>
                  {konusma.tip === 'ozel' && konusma.uyeler[0]?.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 truncate flex items-center gap-1">
                      {konusma.ad}
                      {konusma.tip === 'sinif' && <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Grup</span>}
                    </span>
                    <span className="text-xs text-gray-400">{formatTarih(konusma.sonMesajTarih)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate pr-2">{konusma.sonMesaj}</p>
                    {konusma.okunmamis > 0 && (
                      <span className={`text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-medium ${
                        isLise ? 'bg-gray-700' : 'bg-blue-500'
                      }`}>
                        {konusma.okunmamis}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {konusma.tip === 'sinif' ? `${konusma.uyeler.length} üye` : konusma.uyeler[0]?.rol}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">📭</span>
              <p>Mesaj bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel - Mesaj Detay */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
        {seciliKonusma ? (
          <>
            {/* Konuşma Başlığı */}
            <div className={`p-4 border-b border-gray-200 flex items-center justify-between ${
              isLise ? 'bg-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className={`md:hidden p-2 rounded-lg transition-colors ${
                    isLise ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isLise ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${
                    seciliKonusma.tip === 'sinif'
                      ? 'bg-gradient-to-br from-green-400 to-green-600'
                      : isLise 
                        ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                        : 'bg-gradient-to-br from-white/30 to-white/10'
                  }`}>
                    {seciliKonusma.tip === 'sinif' ? '👥' : seciliKonusma.ad.charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className={`font-semibold ${isLise ? 'text-gray-800' : 'text-white'}`}>{seciliKonusma.ad}</h2>
                  <p className={`text-sm flex items-center gap-1 ${isLise ? 'text-gray-500' : 'text-white/80'}`}>
                    {seciliKonusma.tip === 'sinif' ? (
                      <span>{seciliKonusma.uyeler.length} üye</span>
                    ) : (
                      <>
                        <span>{seciliKonusma.uyeler[0]?.rol}</span>
                        <span>•</span>
                        <span className={seciliKonusma.uyeler[0]?.online ? 'text-green-400' : ''}>
                          {seciliKonusma.uyeler[0]?.online ? '🟢 Çevrimiçi' : 'Çevrimdışı'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Mesajlar - Arkaplan Resimli */}
            <div 
              ref={mesajListRef}
              className="flex-1 overflow-y-auto relative"
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
              <div className="relative z-10 p-4 space-y-4">
                {/* Tarih Ayracı */}
                <div className="flex items-center justify-center">
                  <span className="px-4 py-1.5 bg-white text-gray-500 text-xs rounded-full shadow-sm font-medium">
                    📅 Bugün
                  </span>
                </div>

                {mesajlar.map((mesaj) => (
                  <div
                    key={mesaj.id}
                    className={`flex ${mesaj.gonderenId === 'ben' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        mesaj.gonderenId === 'ben'
                          ? isLise 
                            ? 'bg-gray-800 text-white rounded-br-md'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {/* Grup mesajlarında gönderen adı */}
                      {seciliKonusma.tip === 'sinif' && mesaj.gonderenId !== 'ben' && (
                        <p className="text-xs font-semibold text-blue-600 mb-1">{mesaj.gonderenAd}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{mesaj.mesaj}</p>
                      <div className={`flex items-center justify-end gap-1 mt-2 ${
                        mesaj.gonderenId === 'ben' ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">{formatTarih(mesaj.tarih)}</span>
                        {mesaj.gonderenId === 'ben' && (
                          mesaj.okundu 
                            ? <span className="text-xs">✓✓</span>
                            : <span className="text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesaj Gönderme */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                  <span className="text-xl">📎</span>
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={yeniMesaj}
                    onChange={(e) => setYeniMesaj(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesajınızı yazın..."
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                  <span className="text-xl">😊</span>
                </button>
                <button
                  onClick={handleMesajGonder}
                  disabled={!yeniMesaj.trim()}
                  className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLise 
                      ? 'bg-gray-800 text-white hover:bg-gray-900'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
                  }`}
                >
                  <span className="text-xl">📨</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div className="text-center">
              <span className="text-6xl block mb-4">💬</span>
              <p className="text-lg font-medium">Konuşma Seçin</p>
              <p className="text-sm mt-1">Mesajlaşmaya başlamak için soldaki listeden bir kişi seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Yeni Konuşma Modal */}
      {showYeniKonusmaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`p-4 flex justify-between items-center ${
              isLise ? 'bg-gray-800 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
            }`}>
              <h3 className="text-lg font-bold">✉️ Yeni Mesaj</h3>
              <button
                onClick={() => setShowYeniKonusmaModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tab Seçimi */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setYeniKonusmaTip('ogretmen')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'ogretmen' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👨‍🏫 Öğretmenler
              </button>
              <button
                onClick={() => setYeniKonusmaTip('arkadas')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'arkadas' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Sınıf Arkadaşları
              </button>
            </div>

            <div className="p-4">
              {/* Arama */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder={yeniKonusmaTip === 'ogretmen' ? 'Öğretmen ara...' : 'Arkadaş ara...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Liste */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {yeniKonusmaTip === 'ogretmen' ? (
                  // Öğretmenler
                  mockOgretmenler.filter(o => o.kursId === mockOgrenci.kursId).slice(0, 6).map((ogretmen) => (
                    <button
                      key={ogretmen.id}
                      onClick={() => setShowYeniKonusmaModal(false)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${
                        isLise 
                          ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                          : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                      }`}>
                        {ogretmen.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{ogretmen.ad} {ogretmen.soyad}</p>
                        <p className="text-xs text-gray-500">{ogretmen.brans}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  // Sınıf Arkadaşları
                  mockSinifArkadoslari.map((arkadas) => (
                    <button
                      key={arkadas.id}
                      onClick={() => setShowYeniKonusmaModal(false)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${
                        isLise 
                          ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                          : 'bg-gradient-to-br from-green-400 to-green-600'
                      }`}>
                        {arkadas.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{arkadas.ad} {arkadas.soyad}</p>
                        <p className="text-xs text-gray-500">Sınıf Arkadaşı • {arkadas.sinif}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
