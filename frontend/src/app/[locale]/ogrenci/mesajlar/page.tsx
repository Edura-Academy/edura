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
  const [konusmalar, setKonusmalar] = useState<Konusma[]>(mockTumKonusmalar);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(konusmalar[0] || null);
  const [mesajlar, setMesajlar] = useState<MesajDetay[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showYeniKonusmaModal, setShowYeniKonusmaModal] = useState(false);
  const [yeniKonusmaTip, setYeniKonusmaTip] = useState<'ogretmen' | 'arkadas' | 'grup'>('ogretmen');
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

    const simdi = new Date();
    const tarihStr = simdi.toLocaleString('tr-TR');

    const yeniMesajObj: MesajDetay = {
      id: String(mesajlar.length + 1),
      gonderenId: 'ben',
      gonderenAd: `${mockOgrenci.ad} ${mockOgrenci.soyad}`,
      mesaj: yeniMesaj,
      tarih: tarihStr,
      okundu: false,
    };

    setMesajlar([...mesajlar, yeniMesajObj]);

    // Konuşmayı güncelle ve en üste çıkar
    setKonusmalar(prev => {
      const guncellenmis = prev.map(k => {
        if (k.id === seciliKonusma.id) {
          return {
            ...k,
            sonMesaj: yeniMesaj.length > 50 ? yeniMesaj.substring(0, 50) + '...' : yeniMesaj,
            sonMesajTarih: tarihStr
          };
        }
        return k;
      });
      
      // En son mesaj gönderilen konuşmayı en üste çıkar
      const guncelKonusma = guncellenmis.find(k => k.id === seciliKonusma.id);
      const digerler = guncellenmis.filter(k => k.id !== seciliKonusma.id);
      
      return guncelKonusma ? [guncelKonusma, ...digerler] : guncellenmis;
    });

    setYeniMesaj('');
    inputRef.current?.focus();
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
    .filter(k => k.ad.toLowerCase().includes(aramaText.toLowerCase()))
    .sort((a, b) => {
      const tarihA = parseTarih(a.sonMesajTarih);
      const tarihB = parseTarih(b.sonMesajTarih);
      return tarihB.getTime() - tarihA.getTime(); // En yeni en üstte
    });

  const formatTarih = (tarih: string) => {
    // Tarih formatı: "18.12.2024 14:30:00" veya benzeri
    const parts = tarih.split(' ');
    if (parts.length > 1) {
      // Saat kısmını al (14:30:00 -> 14:30)
      return parts[1]?.slice(0, 5) || '';
    }
    return tarih;
  };

  // Sadece saat formatı
  const formatSaat = (tarih: string) => {
    const parts = tarih.split(' ');
    if (parts.length > 1) {
      return parts[1]?.slice(0, 5) || '';
    }
    // Eğer tarih formatı farklıysa (2024-12-18 14:30 gibi)
    if (tarih.includes(' ')) {
      const timePart = tarih.split(' ')[1];
      return timePart?.slice(0, 5) || '';
    }
    return '';
  };

  // Konuşma tipi ikonu
  const getKonusmaIcon = (tip: string) => {
    switch (tip) {
      case 'sinif': return '👥';
      case 'ogretmen_grup': return '👨‍🏫';
      default: return null;
    }
  };

  // Kullanıcı grup yöneticisi mi kontrolü
  const isGrupYoneticisi = () => {
    if (!seciliKonusma || seciliKonusma.tip !== 'sinif') return false;
    // Öğrenci grubunda öğretmenler yöneticidir
    const currentUserName = `${mockOgrenci.ad} ${mockOgrenci.soyad}`;
    const currentUser = seciliKonusma.uyeler.find(u => u.ad === currentUserName);
    return currentUser?.rol === 'Öğretmen';
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
        // Grup resmi değiştirme
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

  // Kullanıcıyla mesajlaşma başlat
  const handleUyeyleMesajlasma = (uye: any) => {
    setShowUyeMenu(false);
    setShowProfilPanel(false);
    setShowGrupProfil(false);
    
    // Mevcut konuşmayı kontrol et
    const mevcutKonusma = konusmalar.find(k => 
      k.tip === 'ozel' && k.uyeler.some(u => u.ad === uye.ad)
    );

    if (mevcutKonusma) {
      // Mevcut konuşma varsa onu seç
      setSeciliKonusma(mevcutKonusma);
      setShowMobileSidebar(false);
    } else {
      // Yeni konuşma oluştur ve listeye ekle
      const yeniKonusma: Konusma = {
        id: `ozel-${Date.now()}`,
        tip: 'ozel',
        ad: uye.ad,
        sonMesaj: 'Yeni sohbet başlatıldı',
        sonMesajTarih: new Date().toLocaleString('tr-TR'),
        okunmamis: 0,
        uyeler: [{
          ad: uye.ad,
          rol: uye.rol,
          online: uye.online || false
        }]
      };
      
      // Konuşmayı listeye ekle
      setKonusmalar(prev => [yeniKonusma, ...prev]);
      setSeciliKonusma(yeniKonusma);
      setShowMobileSidebar(false);
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
                onClick={() => setShowYeniKonusmaModal(true)}
                className="w-10 h-10 rounded-full bg-[#27AE60] text-white flex items-center justify-center hover:bg-[#219653] transition-all shadow-lg shadow-[#27AE60]/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Arama */}
          <div className="px-4 py-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#676767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={aramaText}
                onChange={(e) => setAramaText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#EEEEEE] rounded-xl text-sm text-black/85 placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30"
              />
            </div>
          </div>

          {/* Sıralama */}
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-black/65">Sort by</span>
            <button className="flex items-center gap-1 text-sm text-[#2D9CDB] font-medium">
              Newest
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Konuşmalar Listesi */}
        <div className="flex-1 overflow-y-auto">
          {filteredKonusmalar.length > 0 ? (
            filteredKonusmalar.map((konusma, index) => (
              <button
                key={konusma.id}
                onClick={() => {
                  setSeciliKonusma(konusma);
                  setShowMobileSidebar(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                  seciliKonusma?.id === konusma.id 
                    ? 'bg-[#FAFAFA]' 
                    : 'hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                    konusma.tip === 'sinif' 
                      ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                      : 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                  }`}>
                    {konusma.tip === 'sinif' ? '👥' : konusma.ad.charAt(0)}
                  </div>
                  {konusma.tip === 'ozel' && konusma.uyeler[0]?.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#27AE60] rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {konusma.tip === 'ozel' && konusma.uyeler[0]?.online && (
                        <svg className="w-3 h-3 text-[#27AE60]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                      <span className="font-medium text-sm text-black/85 truncate">{konusma.ad}</span>
                    </div>
                    <span className="text-xs text-black/65 flex-shrink-0">{formatTarih(konusma.sonMesajTarih)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate pr-2 ${
                      konusma.okunmamis > 0 ? 'text-black/85 font-medium' : 'text-black/45'
                    }`}>
                      {konusma.sonMesaj}
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
            ))
          ) : (
            <div className="p-8 text-center text-black/45">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-sm">Mesaj bulunamadı</p>
            </div>
          )}
        </div>

        {/* Geri Butonu (Mobil) */}
        <div className="p-3 border-t border-[#EEEEEE] md:hidden">
          <Link
            href="/ogrenci"
            className="flex items-center gap-2 text-sm text-black/65 hover:text-black/85 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
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
                    <svg className="w-5 h-5 text-black/65" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => seciliKonusma.tip === 'sinif' && setShowGrupProfil(true)}
                    className={`flex items-center gap-3 ${seciliKonusma.tip === 'sinif' ? 'hover:bg-[#FAFAFA] rounded-lg p-2 -m-2 transition-colors cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="relative">
                      <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        seciliKonusma.tip === 'sinif'
                          ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                          : 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                      }`}>
                        {seciliKonusma.tip === 'sinif' ? '👥' : seciliKonusma.ad.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-medium text-base text-black/85 text-left">{seciliKonusma.ad}</h2>
                      <p className="text-sm text-left">
                        {seciliKonusma.tip === 'sinif' ? (
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
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
              <div className="relative z-10 p-4 space-y-3">
                {/* Tarih Ayracı - WhatsApp Style */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-[#EEEEEE]"></div>
                  <span className="text-xs font-medium text-black/45">Today</span>
                  <div className="flex-1 h-px bg-[#EEEEEE]"></div>
                </div>

                {mesajlar.map((mesaj) => (
                  <div
                    key={mesaj.id}
                    className={`flex items-end gap-2 ${mesaj.gonderenId === 'ben' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar - Sadece gelen mesajlarda */}
                    {mesaj.gonderenId !== 'ben' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3498DB] to-[#2980B9] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                        {mesaj.gonderenAd.charAt(0)}
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] px-4 py-2.5 ${
                        mesaj.gonderenId === 'ben'
                          ? 'bg-[#F4F4F7] rounded-[16px] rounded-br-[4px]'
                          : 'bg-[#F4F4F7] rounded-[16px] rounded-bl-[4px]'
                      }`}
                    >
                      {/* Grup mesajlarında gönderen adı */}
                      {seciliKonusma.tip === 'sinif' && mesaj.gonderenId !== 'ben' && (
                        <p className="text-xs font-semibold text-[#2D9CDB] mb-1">{mesaj.gonderenAd}</p>
                      )}
                      <p className="text-sm text-black/85 whitespace-pre-wrap leading-relaxed">{mesaj.mesaj}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="text-[11px] text-black/45">{formatTarih(mesaj.tarih)}</span>
                        {mesaj.gonderenId === 'ben' && (
                          <svg className={`w-4 h-4 ${mesaj.okundu ? 'text-[#27AE60]' : 'text-black/30'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            {mesaj.okundu && <path d="M15 6L4 17" strokeLinecap="round" strokeLinejoin="round"/>}
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesaj Gönderme - WhatsApp Style */}
            <div className="bg-white border-t border-[#EEEEEE] shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
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
                  disabled={!yeniMesaj.trim()}
                  className="text-sm font-medium text-[#27AE60] hover:text-[#219653] transition-colors disabled:text-black/30 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Send message
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#27AE60]/20 to-[#27AE60]/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#27AE60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black/85 mb-2">Konuşma Seçin</h3>
              <p className="text-sm text-black/45">Mesajlaşmaya başlamak için<br/>soldaki listeden bir kişi seçin</p>
            </div>
          </div>
        )}

        {/* Profil Görüntüleme Paneli (WhatsApp Style) */}
        {showProfilPanel && profilUye && (
          <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-white shadow-2xl z-50 flex flex-col animate-slideIn">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-white border-b border-[#EEEEEE]">
              <h3 className="text-lg font-bold text-black/85">Kişi Bilgisi</h3>
              <button
                onClick={() => setShowProfilPanel(false)}
                className="p-2 hover:bg-[#FAFAFA] rounded-lg transition-colors text-black/45"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profil Bilgileri */}
            <div className="flex-1 overflow-y-auto">
              {/* Profil Resmi ve İsim */}
              <div className="p-8 text-center bg-[#FAFAFA]">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 ${
                  profilUye.rol === 'Öğretmen'
                    ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                    : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                }`}>
                  {profilUye.ad.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-black/85 mb-1">{profilUye.ad}</h2>
                <p className="text-black/65 mb-2">{profilUye.rol}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profilUye.online ? 'bg-[#27AE60]' : 'bg-black/30'}`}></div>
                  <span className={`text-sm ${profilUye.online ? 'text-[#27AE60]' : 'text-black/45'}`}>
                    {profilUye.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Hakkında */}
              <div className="p-4 border-b border-[#EEEEEE]">
                <p className="text-xs text-black/45 uppercase tracking-wider mb-2">Hakkında</p>
                <p className="text-sm text-black/85">{profilUye.rol === 'Öğretmen' ? '📚 Eğitim vermek benim tutkum' : '🎓 Öğrenmek için buradayım'}</p>
              </div>

              {/* İletişim Seçenekleri */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-black/85 mb-3">İletişim</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      handleUyeyleMesajlasma(profilUye);
                      setShowProfilPanel(false);
                    }}
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-all bg-[#27AE60]/10 hover:bg-[#27AE60]/20"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#27AE60]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-black/85">Mesaj</p>
                      <p className="text-xs text-black/45">Mesaj gönder</p>
                    </div>
                  </button>

                  <button 
                    disabled
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-all opacity-50 cursor-not-allowed bg-[#FAFAFA]"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3498DB]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-black/85">Sesli Ara</p>
                      <p className="text-xs text-black/30 italic">Çok yakında...</p>
                    </div>
                  </button>

                  <button 
                    disabled
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-all opacity-50 cursor-not-allowed bg-[#FAFAFA]"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#9B59B6]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-black/85">Görüntülü Ara</p>
                      <p className="text-xs text-black/30 italic">Çok yakında...</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Medya ve Dosyalar */}
              <div className="p-4 border-t border-[#EEEEEE]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-black/85">Medya ve Dosyalar</h3>
                  <button 
                    onClick={() => setShowMedyaModal(true)}
                    className="text-xs text-[#2D9CDB] hover:text-[#2185C5] font-medium"
                  >
                    Tümünü Gör
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="aspect-square bg-[#FAFAFA] hover:bg-[#EEEEEE] rounded-xl flex items-center justify-center transition-colors border border-[#EEEEEE]">
                    <span className="text-2xl">📸</span>
                  </button>
                  <button className="aspect-square bg-[#FAFAFA] hover:bg-[#EEEEEE] rounded-xl flex items-center justify-center transition-colors border border-[#EEEEEE]">
                    <span className="text-2xl">📄</span>
                  </button>
                  <button className="aspect-square bg-[#FAFAFA] hover:bg-[#EEEEEE] rounded-xl flex items-center justify-center transition-colors border border-[#EEEEEE]">
                    <span className="text-2xl">🎵</span>
                  </button>
                </div>
              </div>

              {/* Diğer İşlemler */}
              <div className="p-4 border-t border-[#EEEEEE]">
                <h3 className="text-sm font-semibold text-black/85 mb-3">Diğer İşlemler</h3>
                <div className="space-y-2">
                  <button className="w-full p-3 text-left hover:bg-[#FAFAFA] rounded-xl transition-colors flex items-center gap-3">
                    <svg className="w-5 h-5 text-black/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-sm font-medium text-black/85">Bildirimleri Kapat</span>
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
                    className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 text-[#E74C3C]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium">
                      {profilUye && engellenenKullanicilar.includes(profilUye.ad) ? 'Engeli Kaldır' : 'Engelle'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowSikayetModal(true)}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 text-[#E74C3C]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">Şikayet Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Üye Menüsü Modal */}
      {showUyeMenu && selectedUye && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Üye Bilgisi */}
            <div className={`p-6 text-center ${
              isLise ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
            }`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ${
                selectedUye.rol === 'Öğretmen'
                  ? isLise 
                    ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                    : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                  : 'bg-gradient-to-br from-green-400 to-green-600'
              }`}>
                {selectedUye.ad.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{selectedUye.ad}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedUye.rol}</p>
              {selectedUye.rol === 'Öğretmen' && (
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
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isLise ? 'bg-gray-100' : 'bg-blue-50'
                  }`}>
                    <span className="text-lg">👤</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Üyeyi Görüntüle</span>
                </button>

                <button 
                  onClick={() => handleUyeyleMesajlasma(selectedUye)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isLise ? 'bg-gray-100' : 'bg-blue-50'
                  }`}>
                    <span className="text-lg">💬</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Mesaj Gönder</span>
                </button>

                {/* Yönetici Özellikleri */}
                {isGrupYoneticisi() && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    {selectedUye.rol === 'Öğretmen' ? (
                      <button 
                        onClick={() => {
                          if (confirm(`${selectedUye.ad} yönetici rolünden düşürülsün mü?`)) {
                            alert(`${selectedUye.ad} artık yönetici değil`);
                            setShowUyeMenu(false);
                          }
                        }}
                        className="w-full p-3 text-left hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
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
                        className="w-full p-3 text-left hover:bg-yellow-50 rounded-xl transition-colors flex items-center gap-3"
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
                      className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">🚫</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">Gruptan Çıkar</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowUyeMenu(false)}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Üye Ekleme Modal */}
      {showUyeEkleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className={`p-4 flex items-center justify-between ${
              isLise ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}>
              <h3 className="text-lg font-bold text-white">Gruba Üye Ekle</h3>
              <button
                onClick={() => {
                  setShowUyeEkleModal(false);
                  setSecilenYeniUyeler([]);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">Gruba eklemek istediğiniz kişileri seçin:</p>
              <div className="space-y-2">
                {mockSinifArkadoslari.map(arkadas => {
                  const mevcutMu = seciliKonusma?.uyeler.some(u => u.ad === arkadas.ad);
                  if (mevcutMu) return null;
                  
                  const seciliMi = secilenYeniUyeler.includes(arkadas.ad);
                  
                  return (
                    <button
                      key={arkadas.id}
                      onClick={() => {
                        if (seciliMi) {
                          setSecilenYeniUyeler(prev => prev.filter(ad => ad !== arkadas.ad));
                        } else {
                          setSecilenYeniUyeler(prev => [...prev, arkadas.ad]);
                        }
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        seciliMi
                          ? isLise ? 'bg-gray-100 border-2 border-gray-800' : 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isLise ? 'bg-gray-600' : 'bg-green-500'
                      }`}>
                        {arkadas.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{arkadas.ad}</p>
                        <p className="text-xs text-gray-500">Öğrenci</p>
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

            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowUyeEkleModal(false);
                  setSecilenYeniUyeler([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  secilenYeniUyeler.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isLise ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Ekle ({secilenYeniUyeler.length})
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
              <h3 className="text-lg font-bold text-gray-800 mb-2">Yetki Gerekli</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bu işlemi sadece grup yöneticileri yapabilir.
              </p>
              <button
                onClick={() => setShowAdminWarning(false)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isLise 
                    ? 'bg-gray-800 text-white hover:bg-gray-900' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
                }`}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grup Profil Modal */}
      {showGrupProfil && seciliKonusma && seciliKonusma.tip === 'sinif' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className={`p-4 flex justify-between items-center ${
              isLise ? 'bg-gray-800 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
            }`}>
              <h3 className="text-lg font-bold">Grup Bilgileri</h3>
              <button
                onClick={() => setShowGrupProfil(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grup Avatar ve İsim */}
            <div className="p-6 text-center border-b border-gray-200">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                👥
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{seciliKonusma.ad}</h2>
              <p className="text-sm text-gray-500">Grup • {seciliKonusma.uyeler.length} üye</p>
            </div>

            {/* Üyeler Listesi */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>👥 Grup Üyeleri ({seciliKonusma.uyeler.length})</span>
                  <button 
                    onClick={() => {
                      if (!isGrupYoneticisi()) {
                        setShowAdminWarning(true);
                      } else {
                        setShowUyeEkleModal(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all hover:shadow-lg ${
                      isLise 
                        ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
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
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        uye.rol === 'Öğretmen'
                          ? isLise 
                            ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                            : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                          : 'bg-gradient-to-br from-green-400 to-green-600'
                      }`}>
                        {uye.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800 flex items-center gap-2">
                          {uye.ad}
                          {uye.rol === 'Öğretmen' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Yönetici</span>}
                        </p>
                        <p className="text-xs text-gray-500">{uye.rol}</p>
                      </div>
                      {uye.online && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grup Ayarları */}
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">⚙️ Grup Ayarları</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleGrupAyarClick('resim')}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">🖼️</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Grup Resmini Değiştir</span>
                      {!isGrupYoneticisi() && <span className="block text-xs text-gray-400 mt-0.5">Sadece yöneticiler</span>}
                    </div>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('ad')}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">✏️</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Grup Adını Düzenle</span>
                      {!isGrupYoneticisi() && <span className="block text-xs text-gray-400 mt-0.5">Sadece yöneticiler</span>}
                    </div>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('bildirim')}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">📢</span>
                    <span className="text-sm font-medium text-gray-700">Bildirim Ayarları</span>
                  </button>
                  <button 
                    onClick={() => handleGrupAyarClick('ayril')}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 text-red-600"
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
                👨‍🏫 Öğretmen
              </button>
              <button
                onClick={() => setYeniKonusmaTip('arkadas')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'arkadas' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Arkadaş
              </button>
              <button
                onClick={() => setYeniKonusmaTip('grup')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'grup' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Yeni Grup
              </button>
            </div>

            <div className="p-4">
              {yeniKonusmaTip === 'grup' ? (
                // Yeni Grup Oluşturma
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grup Adı</label>
                    <input
                      type="text"
                      value={yeniGrupAdi}
                      onChange={(e) => setYeniGrupAdi(e.target.value)}
                      placeholder="Örn: Matematik Çalışma Grubu"
                      className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Üyeler Seç ({yeniGrupUyeler.length} seçildi)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {mockSinifArkadoslari.map((arkadas) => (
                        <label
                          key={arkadas.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={yeniGrupUyeler.includes(arkadas.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setYeniGrupUyeler([...yeniGrupUyeler, arkadas.id]);
                              } else {
                                setYeniGrupUyeler(yeniGrupUyeler.filter(id => id !== arkadas.id));
                              }
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
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
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (yeniGrupAdi.trim() && yeniGrupUyeler.length > 0) {
                        // Grup oluştur
                        alert(`"${yeniGrupAdi}" grubu ${yeniGrupUyeler.length} üye ile oluşturuldu!`);
                        setYeniGrupAdi('');
                        setYeniGrupUyeler([]);
                        setShowYeniKonusmaModal(false);
                      }
                    }}
                    disabled={!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0}
                    className={`w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLise 
                        ? 'bg-gray-800 text-white hover:bg-gray-900' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
                    }`}
                  >
                    ✓ Grubu Oluştur
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Medya ve Dosyalar Modal */}
      {showMedyaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className={`p-4 flex items-center justify-between ${
              isLise ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}>
              <h3 className="text-lg font-bold text-white">Medya ve Dosyalar</h3>
              <button
                onClick={() => setShowMedyaModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Fotoğraflar */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📸 Fotoğraflar</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                        <span className="text-3xl">🖼️</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Belgeler */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📄 Belgeler</h4>
                  <div className="space-y-2">
                    {['Matematik Ödevi.pdf', 'Proje Sunumu.pptx', 'Notlar.docx'].map((dosya, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors cursor-pointer">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{dosya}</p>
                          <p className="text-xs text-gray-500">2.4 MB • 3 gün önce</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ses Dosyaları */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">🎵 Ses Kayıtları</h4>
                  <div className="space-y-2">
                    {['Sesli Mesaj 1', 'Sesli Mesaj 2'].map((ses, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors cursor-pointer">
                        <span className="text-2xl">🎵</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{ses}</p>
                          <p className="text-xs text-gray-500">0:45</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şikayet Modal */}
      {showSikayetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 bg-red-600 text-white">
              <h3 className="text-lg font-bold">Kullanıcıyı Şikayet Et</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm text-yellow-800">
                  Şikayetiniz sınıfınızın danışman öğretmenine iletilecektir. Lütfen durumu detaylı bir şekilde açıklayın.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şikayet Edilen: <span className="font-bold">{profilUye?.ad}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şikayet Nedeni</label>
                <textarea
                  value={sikayetMesaj}
                  onChange={(e) => setSikayetMesaj(e.target.value)}
                  placeholder="Şikayetinizi detaylı olarak yazın..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSikayetModal(false);
                    setSikayetMesaj('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (sikayetMesaj.trim()) {
                      alert(`Şikayetiniz danışman öğretmeninize iletildi.\n\nŞikayet Edilen: ${profilUye?.ad}\nMesaj: ${sikayetMesaj}`);
                      setShowSikayetModal(false);
                      setSikayetMesaj('');
                      setShowProfilPanel(false);
                    }
                  }}
                  disabled={!sikayetMesaj.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sikayetMesaj.trim()
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Şikayet Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
