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
  Star,
  Phone,
  X,
  Users,
  User,
  GraduationCap,
} from 'lucide-react';
import { 
  mockPersonelKonusmalar, 
  mockPersonel,
  mockOgretmenler,
  mockOgrenciler,
  mockMudurler,
  mockSekreterler,
  type PersonelKonusma 
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
  if (konusmaId === 'grup-ogretmenler') {
    return [
      { id: '1', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Değerli öğretmenler, yarınki toplantı için hazırlıklarınızı tamamlayın.', tarih: '2024-12-18 08:00', okundu: true },
      { id: '2', gonderenId: 'og2', gonderenAd: 'Fatma Öztürk', mesaj: 'Anlaşıldı müdürüm. Sunum hazır.', tarih: '2024-12-18 08:15', okundu: true },
      { id: '3', gonderenId: 'ben', gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`, mesaj: 'Ben de 8. sınıf deneme sonuçları analizini getireceğim.', tarih: '2024-12-18 08:30', okundu: true },
      { id: '4', gonderenId: 'og3', gonderenAd: 'Ali Demir', mesaj: 'Toplantıda veli görüşmeleri de konuşulacak mı?', tarih: '2024-12-18 08:45', okundu: true },
      { id: '5', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Evet, gündem maddesi olarak ekledim. Yarınki toplantı saat 10:00\'da olacak. Katılımınızı bekliyoruz.', tarih: '2024-12-18 09:00', okundu: false },
    ];
  } else if (konusmaId === 'grup-personel') {
    return [
      { id: '1', gonderenId: 's1', gonderenAd: 'Ayşe Demir', mesaj: 'Herkese günaydın! Bu hafta puantaj formları doldurmayı unutmayın.', tarih: '2024-12-17 09:00', okundu: true },
      { id: '2', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Teşekkürler Ayşe Hanım. Herkes cuma gününe kadar tamamlasın lütfen.', tarih: '2024-12-17 09:30', okundu: true },
      { id: '3', gonderenId: 'ben', gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`, mesaj: 'Not edildi 📝', tarih: '2024-12-17 10:00', okundu: true },
      { id: '4', gonderenId: 's1', gonderenAd: 'Ayşe Demir', mesaj: 'Haftalık puantaj formlarını doldurmayı unutmayın!', tarih: '2024-12-17 16:30', okundu: false },
    ];
  } else if (konusmaId === 'ozel-mudur') {
    return [
      { id: '1', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Merhaba, yarınki toplantı için hazırlıklar nasıl gidiyor?', tarih: '2024-12-18 08:30', okundu: true },
      { id: '2', gonderenId: 'ben', gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`, mesaj: 'Müdürüm, sunum hazır. 8. sınıf deneme sonuçlarını analiz ettim.', tarih: '2024-12-18 08:35', okundu: true },
      { id: '3', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Mükemmel! 👏 Özellikle matematik dersindeki gelişimi vurgulayalım.', tarih: '2024-12-18 08:40', okundu: true },
      { id: '4', gonderenId: 'm1', gonderenAd: 'Ahmet Yıldırım', mesaj: 'Toplantı için hazırlıklar nasıl gidiyor?', tarih: '2024-12-18 08:45', okundu: false },
    ];
  } else if (konusmaId === 'ozel-ogrenci1') {
    return [
      { id: '1', gonderenId: 'ben', gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`, mesaj: 'Ahmet, yarınki derse kadar sayfa 45-50 arasındaki problemleri çözmenizi bekliyorum.', tarih: '2024-12-17 14:00', okundu: true },
      { id: '2', gonderenId: 'ogr1', gonderenAd: 'Ahmet Yılmaz', mesaj: 'Tamam hocam, teşekkürler! 📚', tarih: '2024-12-17 14:10', okundu: true },
    ];
  } else {
    return [
      { id: '1', gonderenId: 'other', gonderenAd: 'Kişi', mesaj: 'Merhaba!', tarih: '2024-12-17 10:00', okundu: true },
      { id: '2', gonderenId: 'ben', gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`, mesaj: 'Merhaba, nasıl yardımcı olabilirim?', tarih: '2024-12-17 10:05', okundu: true },
    ];
  }
};

export default function MesajlarPage() {
  const [konusmalar] = useState<PersonelKonusma[]>(mockPersonelKonusmalar);
  const [seciliKonusma, setSeciliKonusma] = useState<PersonelKonusma | null>(konusmalar[0] || null);
  const [mesajlar, setMesajlar] = useState<MesajDetay[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filterType, setFilterType] = useState<'hepsi' | 'okunmamis' | 'gruplar'>('hepsi');
  const [yeniMesajTip, setYeniMesajTip] = useState<'personel' | 'ogrenci'>('personel');
  
  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!yeniMesaj.trim()) return;

    const yeniMesajObj: MesajDetay = {
      id: String(mesajlar.length + 1),
      gonderenId: 'ben',
      gonderenAd: `${mockPersonel.ad} ${mockPersonel.soyad}`,
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
    if (aramaText && !k.ad.toLowerCase().includes(aramaText.toLowerCase())) {
      return false;
    }
    if (filterType === 'okunmamis' && k.okunmamis === 0) return false;
    if (filterType === 'gruplar' && k.tip === 'ozel') return false;
    return true;
  });

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
      case 'ogretmenler': return '👨‍🏫';
      case 'personel': return '🏫';
      case 'sinif_ogrencileri': return '📚';
      default: return null;
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
              placeholder="Kişi veya grup ara..."
              value={aramaText}
              onChange={(e) => setAramaText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={() => setFilterType('gruplar')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === 'gruplar' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Gruplar
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  konusma.tip === 'ogretmenler' 
                    ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                    : konusma.tip === 'personel'
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                      : 'bg-gradient-to-br from-slate-400 to-slate-600'
                }`}>
                  {getKonusmaIcon(konusma.tip) || konusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                {konusma.tip === 'ozel' && konusma.uyeler[0]?.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 truncate flex items-center gap-1">
                    {konusma.ad}
                    {konusma.tip !== 'ozel' && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">Grup</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">{formatTarih(konusma.sonMesajTarih)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 truncate pr-2">{konusma.sonMesaj}</p>
                  {konusma.okunmamis > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-medium">
                      {konusma.okunmamis}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {konusma.tip !== 'ozel' ? `${konusma.uyeler.length} üye` : konusma.uyeler[0]?.rol}
                </span>
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
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold ${
                    seciliKonusma.tip === 'ogretmenler' 
                      ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                      : seciliKonusma.tip === 'personel'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600'
                  }`}>
                    {getKonusmaIcon(seciliKonusma.tip) || seciliKonusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  {seciliKonusma.tip === 'ozel' && seciliKonusma.uyeler[0]?.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">{seciliKonusma.ad}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    {seciliKonusma.tip !== 'ozel' ? (
                      <span>{seciliKonusma.uyeler.length} üye</span>
                    ) : (
                      <>
                        <span>{seciliKonusma.uyeler[0]?.rol}</span>
                        <span>•</span>
                        <span className={seciliKonusma.uyeler[0]?.online ? 'text-green-600' : ''}>
                          {seciliKonusma.uyeler[0]?.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Phone size={20} className="text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Mesajlar */}
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
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                        mesaj.gonderenId === 'ben'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-slate-800 rounded-bl-md'
                      }`}
                    >
                      {/* Grup mesajlarında gönderen adı */}
                      {seciliKonusma.tip !== 'ozel' && mesaj.gonderenId !== 'ben' && (
                        <p className="text-xs font-semibold text-blue-600 mb-1">{mesaj.gonderenAd}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{mesaj.mesaj}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        mesaj.gonderenId === 'ben' ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        <span className="text-xs">{formatTarih(mesaj.tarih)}</span>
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
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <Users size={48} className="mx-auto mb-4 opacity-50" />
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
                <Users size={16} /> Personel
              </button>
              <button
                onClick={() => setYeniMesajTip('ogrenci')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  yeniMesajTip === 'ogrenci' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <GraduationCap size={16} /> Öğrenciler
              </button>
            </div>

            <div className="p-4">
              {/* Arama */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={yeniMesajTip === 'personel' ? 'Personel ara...' : 'Öğrenci ara...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kişiler */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {yeniMesajTip === 'personel' ? (
                  // Personel listesi (müdürler, sekreterler, öğretmenler)
                  <>
                    {mockMudurler.filter(m => m.kursId === mockPersonel.kursId).map((mudur) => (
                      <button
                        key={mudur.id}
                        onClick={() => setShowYeniMesajModal(false)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {mudur.ad[0]}{mudur.soyad[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-800">{mudur.ad} {mudur.soyad}</p>
                          <p className="text-xs text-slate-500">Müdür</p>
                        </div>
                      </button>
                    ))}
                    {mockSekreterler.filter(s => s.kursId === mockPersonel.kursId).map((sekreter) => (
                      <button
                        key={sekreter.id}
                        onClick={() => setShowYeniMesajModal(false)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {sekreter.ad[0]}{sekreter.soyad[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-800">{sekreter.ad} {sekreter.soyad}</p>
                          <p className="text-xs text-slate-500">Sekreter</p>
                        </div>
                      </button>
                    ))}
                    {mockOgretmenler.filter(o => o.kursId === mockPersonel.kursId && o.id !== mockPersonel.id).slice(0, 5).map((ogretmen) => (
                      <button
                        key={ogretmen.id}
                        onClick={() => setShowYeniMesajModal(false)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {ogretmen.ad[0]}{ogretmen.soyad[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-800">{ogretmen.ad} {ogretmen.soyad}</p>
                          <p className="text-xs text-slate-500">{ogretmen.brans} Öğretmeni</p>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  // Öğrenci listesi
                  mockOgrenciler.filter(o => o.kursId === mockPersonel.kursId).slice(0, 10).map((ogrenci) => (
                    <button
                      key={ogrenci.id}
                      onClick={() => setShowYeniMesajModal(false)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {ogrenci.ad[0]}{ogrenci.soyad[0]}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-800">{ogrenci.ad} {ogrenci.soyad}</p>
                        <p className="text-xs text-slate-500">Öğrenci • {ogrenci.sinif}</p>
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
