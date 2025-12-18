'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import Modal from '@/components/Modal';

interface User {
  id: number;
  kullaniciAdi: string;
  ad: string;
  soyad?: string;
  role: string;
}

interface Kurs {
  KursID: number;
  KursAdi: string;
  Adres: string;
  Telefon: string;
  Email: string;
  KullaniciAdi: string;
  AktifMi: boolean;
  KayitTarihi: string;
}

interface KursStats {
  ogrenciSayisi: number;
  ogretmenSayisi: number;
  sinifSayisi: number;
  mudurSayisi: number;
  sekreterSayisi: number;
}

interface SystemStats {
  kursSayisi: number;
  toplamOgrenci: number;
  toplamOgretmen: number;
  toplamMudur: number;
}

interface Brans {
  BransID: number;
  BransAdi: string;
}

interface Mudur {
  MudurID: number;
  KursID: number;
  Ad: string;
  Soyad: string;
  Email: string;
  Telefon: string;
  KullaniciAdi: string;
  AktifMi: boolean;
}

interface Ogretmen {
  OgretmenID: number;
  KursID: number;
  BransID: number;
  Ad: string;
  Soyad: string;
  Email: string;
  Telefon: string;
  EgitimKocuMu: boolean;
  KullaniciAdi: string;
  AktifMi: boolean;
}

interface Sekreter {
  SekreterID: number;
  KursID: number;
  Ad: string;
  Soyad: string;
  Email: string;
  Telefon: string;
  KullaniciAdi: string;
  AktifMi: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [branslar, setBranslar] = useState<Brans[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal states
  const [showKursModal, setShowKursModal] = useState(false);
  const [showRaporModal, setShowRaporModal] = useState(false);
  const [showKursDetayModal, setShowKursDetayModal] = useState(false);
  const [showKursDuzenleModal, setShowKursDuzenleModal] = useState(false);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showProfilDropdown, setShowProfilDropdown] = useState(false);
  const [showBildirimDropdown, setShowBildirimDropdown] = useState(false);
  const [showMesajDropdown, setShowMesajDropdown] = useState(false);
  const [showDilDropdown, setShowDilDropdown] = useState(false);
  
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  
  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [kursStats, setKursStats] = useState<KursStats | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [kursForm, setKursForm] = useState({
    kursAdi: '',
    adres: '',
    telefon: '',
    email: '',
    kullaniciAdi: '',
    sifre: '',
  });


  const [duzenleForm, setDuzenleForm] = useState({
    kursAdi: '',
    adres: '',
    telefon: '',
    email: '',
    aktifMi: true,
  });

  const [profilForm, setProfilForm] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: '',
    profilFoto: '',
  });
  const [profilTab, setProfilTab] = useState<'bilgiler' | 'sifre'>('bilgiler');
  const [profilFotoPreview, setProfilFotoPreview] = useState<string | null>(null);

  // Rapor data
  const [raporData, setRaporData] = useState<{
    mudurler: Mudur[];
    ogretmenler: Ogretmen[];
    sekreterler: Sekreter[];
  }>({ mudurler: [], ogretmenler: [], sekreterler: [] });
  const [raporTab, setRaporTab] = useState<'kurslar' | 'mudurler' | 'ogretmenler' | 'sekreterler'>('kurslar');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login/admin');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    
    if (parsedUser.role !== 'admin') {
      router.push('/login/admin');
      return;
    }

    setUser(parsedUser);
    fetchInitialData(token);
  }, [mounted, router]);

  const fetchInitialData = async (token: string) => {
    try {
      const [kurslarRes, statsRes, branslarRes] = await Promise.all([
        fetch('http://localhost:5000/api/users/kurslar', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/users/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/users/branslar', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const kurslarData = await kurslarRes.json();
      const statsData = await statsRes.json();
      const branslarData = await branslarRes.json();

      if (kurslarData.success) setKurslar(kurslarData.data.kurslar);
      if (statsData.success) setSystemStats(statsData.data);
      if (branslarData.success) setBranslar(branslarData.data.branslar);
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login/admin');
  };

  const handleCreateKurs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/kurslar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(kursForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kurs başarıyla oluşturuldu!' });
        setKurslar([...kurslar, data.data.kurs]);
        setTimeout(() => {
          setShowKursModal(false);
          setKursForm({ kursAdi: '', adres: '', telefon: '', email: '', kullaniciAdi: '', sifre: '' });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Kurs oluşturulamadı' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };


  const handleUpdateKurs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKurs) return;
    
    setSubmitLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/kurslar/${selectedKurs.KursID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(duzenleForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kurs başarıyla güncellendi!' });
        setKurslar(kurslar.map(k => k.KursID === selectedKurs.KursID ? data.data.kurs : k));
        setTimeout(() => {
          setShowKursDuzenleModal(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Kurs güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openKursDetay = async (kurs: Kurs) => {
    setSelectedKurs(kurs);
    setShowKursDetayModal(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/kurslar/${kurs.KursID}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setKursStats(data.data);
      }
    } catch (error) {
      console.error('Kurs istatistikleri alınamadı:', error);
    }
  };

  const openKursDuzenle = (kurs: Kurs) => {
    setSelectedKurs(kurs);
    setDuzenleForm({
      kursAdi: kurs.KursAdi,
      adres: kurs.Adres || '',
      telefon: kurs.Telefon || '',
      email: kurs.Email || '',
      aktifMi: kurs.AktifMi,
    });
    setShowKursDuzenleModal(true);
  };

  const openProfil = () => {
    setProfilForm({
      ad: user?.ad || '',
      soyad: user?.soyad || '',
      email: '',
      telefon: '',
      mevcutSifre: '',
      yeniSifre: '',
      yeniSifreTekrar: '',
      profilFoto: '',
    });
    setProfilFotoPreview(null);
    setProfilTab('bilgiler');
    setShowProfilDropdown(false);
    setMessage(null);
    setShowProfilModal(true);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Dosya boyutu 2MB\'dan küçük olmalıdır' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFotoKaldir = () => {
    setProfilFotoPreview(null);
  };

  const handleProfilUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: profilForm.ad,
          soyad: profilForm.soyad,
          email: profilForm.email,
          telefon: profilForm.telefon,
          profilFoto: profilForm.profilFoto,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
        // Local storage'ı güncelle
        const updatedUser = { ...user, ad: profilForm.ad, soyad: profilForm.soyad };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser as User);
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Profil güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSifreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profilForm.yeniSifre !== profilForm.yeniSifreTekrar) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    if (profilForm.yeniSifre.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır!' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mevcutSifre: profilForm.mevcutSifre,
          yeniSifre: profilForm.yeniSifre,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
        setProfilForm(prev => ({ ...prev, mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' }));
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openRaporlar = async () => {
    setShowRaporModal(true);
    
    try {
      const token = localStorage.getItem('token');
      const [mudurlerRes, ogretmenlerRes, sekreterlerRes] = await Promise.all([
        fetch('http://localhost:5000/api/users/mudurler', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/users/ogretmenler', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/users/sekreterler', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const mudurlerData = await mudurlerRes.json();
      const ogretmenlerData = await ogretmenlerRes.json();
      const sekreterlerData = await sekreterlerRes.json();

      setRaporData({
        mudurler: mudurlerData.success ? mudurlerData.data.mudurler : [],
        ogretmenler: ogretmenlerData.success ? ogretmenlerData.data.ogretmenler : [],
        sekreterler: sekreterlerData.success ? sekreterlerData.data.sekreterler : [],
      });
    } catch (error) {
      console.error('Rapor verileri alınamadı:', error);
    }
  };

  const getKursAdi = (kursId: number) => {
    const kurs = kurslar.find(k => k.KursID === kursId);
    return kurs?.KursAdi || '-';
  };

  const getBransAdi = (bransId: number) => {
    const brans = branslar.find(b => b.BransID === bransId);
    return brans?.BransAdi || '-';
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-xl text-white">Edura</span>
                <span className="text-red-500 text-sm ml-2">Admin</span>
              </div>
            </div>

            {/* Right Side - Language, Notifications, Messages, Profile */}
            <div className="flex items-center gap-1">
              {/* Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDilDropdown(!showDilDropdown);
                    setShowBildirimDropdown(false);
                    setShowMesajDropdown(false);
                    setShowProfilDropdown(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700 flex items-center gap-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-xs font-medium uppercase">{locale}</span>
                </button>

                {showDilDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDilDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-2xl z-20 border border-gray-200 py-1 overflow-hidden">
                      {[
                        { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
                        { code: 'en', flag: '🇬🇧', name: 'English' },
                        { code: 'es', flag: '🇪🇸', name: 'Español' },
                        { code: 'ja', flag: '🇯🇵', name: '日本語' },
                        { code: 'fr', flag: '🇫🇷', name: 'Français' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { 
                            router.replace(pathname, { locale: lang.code as 'tr' | 'en' | 'es' | 'ja' | 'fr' }); 
                            setShowDilDropdown(false); 
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${locale === lang.code ? 'bg-violet-50 text-violet-600' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                          {locale === lang.code && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBildirimDropdown(!showBildirimDropdown);
                    setShowDilDropdown(false);
                    setShowMesajDropdown(false);
                    setShowProfilDropdown(false);
                  }}
                  className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">4</span>
                </button>

                {showBildirimDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowBildirimDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl z-20 border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Bildirimler</h3>
                        <button className="text-xs text-violet-600 hover:text-violet-700">Tümünü okundu işaretle</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-violet-500 bg-violet-50/50">
                          <p className="text-sm text-gray-900">Yeni kurs kaydı: <strong>Ataşehir Kurs</strong></p>
                          <p className="text-xs text-gray-500 mt-1">2 dakika önce</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-transparent">
                          <p className="text-sm text-gray-700">Maltepe Gül Kurs şifresini değiştirdi</p>
                          <p className="text-xs text-gray-500 mt-1">1 saat önce</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-transparent">
                          <p className="text-sm text-gray-700">Sistem güncellemesi tamamlandı</p>
                          <p className="text-xs text-gray-500 mt-1">3 saat önce</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-50 border-l-4 border-transparent">
                          <p className="text-sm text-gray-700">Yeni müdür eklendi: Ahmet Yılmaz</p>
                          <p className="text-xs text-gray-500 mt-1">Dün</p>
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 text-center">
                        <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">Tüm bildirimleri gör</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Messages Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMesajDropdown(!showMesajDropdown);
                    setShowDilDropdown(false);
                    setShowBildirimDropdown(false);
                    setShowProfilDropdown(false);
                  }}
                  className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                </button>

                {showMesajDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMesajDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl z-20 border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Mesajlar</h3>
                        <button className="text-xs text-violet-600 hover:text-violet-700">Yeni mesaj</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3 bg-violet-50/50">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">M</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">Maltepe Gül Kurs</p>
                              <span className="text-xs text-gray-500">5 dk</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">Merhaba, yeni öğretmen kaydı hakkında...</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">K</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">Kadıköy Zambak Kurs</p>
                              <span className="text-xs text-gray-500">1 sa</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">Teşekkürler, sorunu çözdük.</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 text-center">
                        <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">Tüm mesajları gör</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => {
                    setShowProfilDropdown(!showProfilDropdown);
                    setShowDilDropdown(false);
                    setShowBildirimDropdown(false);
                    setShowMesajDropdown(false);
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg hover:scale-105 transition-transform"
                >
                  {user.ad?.charAt(0).toUpperCase()}
                </button>

                {showProfilDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfilDropdown(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-2xl z-20 border border-gray-200 py-3">
                      {/* Profile Header */}
                      <div className="px-4 pb-3 flex items-center gap-3 border-b border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {user.ad?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{user.ad} {user.soyad}</p>
                          <p className="text-sm text-gray-500 truncate">{user.kullaniciAdi}@edura.com</p>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2 border-b border-gray-100">
                        <button
                          onClick={openProfil}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-violet-600 hover:bg-gray-50 transition-colors"
                        >
                          Profili düzenle
                        </button>
                        <button
                          onClick={() => {
                            setShowProfilDropdown(false);
                            router.push('/admin/ayarlar');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-violet-600 hover:bg-gray-50 transition-colors"
                        >
                          Hesap ayarları
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Çıkış yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {t('admin.welcome')}, {user.ad}! 🛡️
          </h1>
          <p className="text-red-100">
            {t('admin.systemDescription')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button 
            onClick={() => setShowKursModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 text-left transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Yeni Kurs Ekle</h3>
            <p className="text-sm text-slate-400">Sisteme yeni kurs kaydı oluştur</p>
          </button>

          <button 
            onClick={openRaporlar}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 text-left transition-colors group"
          >
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Raporlar</h3>
            <p className="text-sm text-slate-400">Sistem raporlarını görüntüle</p>
          </button>
        </div>

        {/* System Stats */}
        {systemStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{systemStats.kursSayisi}</p>
                  <p className="text-xs text-slate-400">Toplam Kurs</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{systemStats.toplamOgrenci}</p>
                  <p className="text-xs text-slate-400">Toplam Öğrenci</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{systemStats.toplamOgretmen}</p>
                  <p className="text-xs text-slate-400">Toplam Öğretmen</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{systemStats.toplamMudur}</p>
                  <p className="text-xs text-slate-400">Toplam Müdür</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kurslar Tablosu */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">{t('admin.registeredCourses')}</h2>
            <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
              {kurslar.length} Kurs
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Kurs Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {kurslar.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Henüz kayıtlı kurs bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  kurslar.map((kurs) => (
                    <tr key={kurs.KursID} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {kurs.KursAdi.charAt(0)}
                          </div>
                          <span className="font-medium text-white">{kurs.KursAdi}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{kurs.Adres || '-'}</td>
                      <td className="px-6 py-4 text-slate-300">{kurs.Telefon || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          kurs.AktifMi 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {kurs.AktifMi ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => openKursDetay(kurs)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Görüntüle
                        </button>
                        <button 
                          onClick={() => openKursDuzenle(kurs)}
                          className="text-slate-400 hover:text-white"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Yeni Kurs Modal */}
      <Modal isOpen={showKursModal} onClose={() => setShowKursModal(false)} title="Yeni Kurs Ekle" size="lg">
        <form onSubmit={handleCreateKurs} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kurs Adı *</label>
              <input
                type="text"
                value={kursForm.kursAdi}
                onChange={(e) => setKursForm({ ...kursForm, kursAdi: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={kursForm.email}
                onChange={(e) => setKursForm({ ...kursForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Adres</label>
            <input
              type="text"
              value={kursForm.adres}
              onChange={(e) => setKursForm({ ...kursForm, adres: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Telefon</label>
            <input
              type="text"
              value={kursForm.telefon}
              onChange={(e) => setKursForm({ ...kursForm, telefon: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Giriş Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kullanıcı Adı *</label>
                <input
                  type="text"
                  value={kursForm.kullaniciAdi}
                  onChange={(e) => setKursForm({ ...kursForm, kullaniciAdi: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Şifre *</label>
                <input
                  type="password"
                  value={kursForm.sifre}
                  onChange={(e) => setKursForm({ ...kursForm, sifre: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowKursModal(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Oluşturuluyor...' : 'Kurs Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kurs Detay Modal */}
      <Modal isOpen={showKursDetayModal} onClose={() => setShowKursDetayModal(false)} title="Kurs Detayları" size="lg">
        {selectedKurs && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {selectedKurs.KursAdi.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedKurs.KursAdi}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedKurs.AktifMi ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {selectedKurs.AktifMi ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Adres</p>
                <p className="text-white">{selectedKurs.Adres || '-'}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Telefon</p>
                <p className="text-white">{selectedKurs.Telefon || '-'}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Email</p>
                <p className="text-white">{selectedKurs.Email || '-'}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Kullanıcı Adı</p>
                <p className="text-white">{selectedKurs.KullaniciAdi}</p>
              </div>
            </div>

            {kursStats && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">İstatistikler</h4>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-blue-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{kursStats.ogrenciSayisi}</p>
                    <p className="text-xs text-slate-400">Öğrenci</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">{kursStats.ogretmenSayisi}</p>
                    <p className="text-xs text-slate-400">Öğretmen</p>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{kursStats.sinifSayisi}</p>
                    <p className="text-xs text-slate-400">Sınıf</p>
                  </div>
                  <div className="bg-amber-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{kursStats.mudurSayisi}</p>
                    <p className="text-xs text-slate-400">Müdür</p>
                  </div>
                  <div className="bg-teal-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-teal-400">{kursStats.sekreterSayisi}</p>
                    <p className="text-xs text-slate-400">Sekreter</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => setShowKursDetayModal(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowKursDetayModal(false);
                  openKursDuzenle(selectedKurs);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Düzenle
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Kurs Düzenle Modal */}
      <Modal isOpen={showKursDuzenleModal} onClose={() => setShowKursDuzenleModal(false)} title="Kurs Düzenle" size="lg">
        <form onSubmit={handleUpdateKurs} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Kurs Adı *</label>
            <input
              type="text"
              value={duzenleForm.kursAdi}
              onChange={(e) => setDuzenleForm({ ...duzenleForm, kursAdi: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Adres</label>
            <input
              type="text"
              value={duzenleForm.adres}
              onChange={(e) => setDuzenleForm({ ...duzenleForm, adres: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Telefon</label>
              <input
                type="text"
                value={duzenleForm.telefon}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, telefon: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={duzenleForm.email}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={duzenleForm.aktifMi}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, aktifMi: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowKursDuzenleModal(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Raporlar Modal */}
      <Modal isOpen={showRaporModal} onClose={() => setShowRaporModal(false)} title="Sistem Raporları" size="xl">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700 pb-3">
            {(['kurslar', 'mudurler', 'ogretmenler', 'sekreterler'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRaporTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  raporTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab === 'kurslar' && 'Kurslar'}
                {tab === 'mudurler' && 'Müdürler'}
                {tab === 'ogretmenler' && 'Öğretmenler'}
                {tab === 'sekreterler' && 'Sekreterler'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {raporTab === 'kurslar' && (
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Kurs Adı</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Adres</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {kurslar.map((kurs) => (
                    <tr key={kurs.KursID} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-white">{kurs.KursAdi}</td>
                      <td className="px-4 py-3 text-slate-300">{kurs.Adres || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{kurs.Telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${kurs.AktifMi ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {kurs.AktifMi ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {raporTab === 'mudurler' && (
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {raporData.mudurler.map((mudur) => (
                    <tr key={mudur.MudurID} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-white">{mudur.Ad} {mudur.Soyad}</td>
                      <td className="px-4 py-3 text-slate-300">{getKursAdi(mudur.KursID)}</td>
                      <td className="px-4 py-3 text-slate-300">{mudur.Email || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{mudur.Telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${mudur.AktifMi ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {mudur.AktifMi ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.mudurler.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Kayıtlı müdür bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {raporTab === 'ogretmenler' && (
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Branş</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Eğitim Koçu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {raporData.ogretmenler.map((ogretmen) => (
                    <tr key={ogretmen.OgretmenID} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-white">{ogretmen.Ad} {ogretmen.Soyad}</td>
                      <td className="px-4 py-3 text-slate-300">{getKursAdi(ogretmen.KursID)}</td>
                      <td className="px-4 py-3 text-slate-300">{getBransAdi(ogretmen.BransID)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${ogretmen.EgitimKocuMu ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                          {ogretmen.EgitimKocuMu ? 'Evet' : 'Hayır'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${ogretmen.AktifMi ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {ogretmen.AktifMi ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.ogretmenler.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Kayıtlı öğretmen bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {raporTab === 'sekreterler' && (
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {raporData.sekreterler.map((sekreter) => (
                    <tr key={sekreter.SekreterID} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-white">{sekreter.Ad} {sekreter.Soyad}</td>
                      <td className="px-4 py-3 text-slate-300">{getKursAdi(sekreter.KursID)}</td>
                      <td className="px-4 py-3 text-slate-300">{sekreter.Email || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{sekreter.Telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${sekreter.AktifMi ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {sekreter.AktifMi ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.sekreterler.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Kayıtlı sekreter bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <button
              onClick={() => setShowRaporModal(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>

      {/* Profil Düzenleme Modal - Sadece Ad, Soyad, Resim */}
      <Modal isOpen={showProfilModal} onClose={() => setShowProfilModal(false)} title="Profili Düzenle" size="md" variant="light">
        <form onSubmit={handleProfilUpdate} className="p-2">
          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              {profilFotoPreview ? (
                <img 
                  src={profilFotoPreview} 
                  alt="Profil" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profilForm.ad?.charAt(0)?.toUpperCase() || user?.ad?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  className="hidden" 
                  onChange={handleFotoChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profil Fotoğrafı</p>
              <p className="text-xs text-gray-500 mt-1">JPG veya PNG. Maks 2MB</p>
              {profilFotoPreview && (
                <button 
                  type="button" 
                  onClick={handleFotoKaldir}
                  className="text-xs text-red-500 hover:text-red-600 mt-2"
                >
                  Fotoğrafı kaldır
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                value={profilForm.ad}
                onChange={(e) => setProfilForm({ ...profilForm, ad: e.target.value })}
                placeholder="Adınız"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                type="text"
                value={profilForm.soyad}
                onChange={(e) => setProfilForm({ ...profilForm, soyad: e.target.value })}
                placeholder="Soyadınız"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowProfilModal(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
