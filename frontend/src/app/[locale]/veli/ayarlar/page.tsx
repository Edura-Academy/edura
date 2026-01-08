'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Camera,
  Check,
  Volume2,
  Palette,
  Type,
  MousePointer2,
  Accessibility,
  Upload,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

function VeliAyarlarContent() {
  const { user, token, updateUser } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    ttsEnabled,
    setTtsEnabled,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    colorBlindMode,
    setColorBlindMode,
    lineHeight,
    setLineHeight,
    largeCursor,
    setLargeCursor,
    reducedMotion,
    setReducedMotion,
    dyslexiaFont,
    setDyslexiaFont,
    ttsRate,
    setTtsRate,
    ttsPitch,
    setTtsPitch,
    speak,
    FONT_SIZE_MIN,
    FONT_SIZE_MAX,
    resetSettings,
  } = useAccessibility();
  
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profil fotoğrafı state
  const [profilFoto, setProfilFoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Profil form state
  const [profilData, setProfilData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
  });

  // Şifre form state
  const [sifreData, setSifreData] = useState({
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: ''
  });

  // Bildirim ayarları
  const [bildirimler, setBildirimler] = useState({
    email: true,
    push: true,
    odevBildirim: true,
    devamsizlikBildirim: true,
    sinavBildirim: true,
    mesajBildirim: true,
    duyuruBildirim: true
  });
  
  // Push notification state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      setProfilData({
        ad: user.ad || '',
        soyad: user.soyad || '',
        email: user.email || '',
        telefon: user.telefon || '',
      });
      setProfilFoto(user.profilFoto || null);
      
      // Firebase'den profil fotoğrafını çek
      fetchProfilePhoto();
      
      // Bildirim ayarlarını localStorage'dan yükle
      loadNotificationSettings();
    }
    
    // Push notification iznini kontrol et
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [user]);

  // Bildirim ayarlarını yükle
  const loadNotificationSettings = () => {
    try {
      const saved = localStorage.getItem(`veli_bildirim_ayarlari_${user?.id}`);
      if (saved) {
        setBildirimler(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Bildirim ayarları yüklenemedi:', error);
    }
  };

  // Push notification izni iste
  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setMessage({ type: 'error', text: 'Tarayıcınız bildirimleri desteklemiyor' });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        setMessage({ type: 'success', text: 'Bildirim izni verildi!' });
        speak('Bildirim izni verildi');
        
        // FCM token'ı kaydet (Firebase entegrasyonu varsa)
        // saveFcmToken();
      } else if (permission === 'denied') {
        setMessage({ type: 'error', text: 'Bildirim izni reddedildi. Tarayıcı ayarlarından değiştirebilirsiniz.' });
      }
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      setMessage({ type: 'error', text: 'Bildirim izni istenirken bir hata oluştu' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Profil fotoğrafını çek
  const fetchProfilePhoto = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`${API_URL}/upload/profile/veli/${user.id}`);
      const data = await res.json();
      if (data.success && data.data?.url) {
        setProfilFoto(data.data.url);
        // Auth context'i de güncelle
        if (updateUser && user) {
          updateUser({ ...user, profilFoto: data.data.url });
        }
      }
    } catch (error) {
      console.error('Profil fotoğrafı alınamadı:', error);
    }
  };

  // Profil fotoğrafı yükle
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !token) return;

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Sadece JPG, PNG ve WebP dosyaları yüklenebilir' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Dosya boyutu kontrolü (8MB)
    if (file.size > 8 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Dosya boyutu 8MB\'dan büyük olamaz' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_URL}/upload/profile/veli/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(data.data.url);
        setMessage({ type: 'success', text: 'Profil fotoğrafı başarıyla yüklendi!' });
        speak('Profil fotoğrafı başarıyla yüklendi');
        
        // Auth context'i güncelle
        if (updateUser && user) {
          updateUser({ ...user, profilFoto: data.data.url });
        }
        setShowPhotoModal(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Fotoğraf yüklenemedi' });
      }
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Fotoğraf yüklenirken bir hata oluştu' });
    } finally {
      setUploadingPhoto(false);
      setTimeout(() => setMessage(null), 3000);
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Profil fotoğrafını sil
  const handlePhotoDelete = async () => {
    if (!user?.id || !token) return;

    setUploadingPhoto(true);
    try {
      const res = await fetch(`${API_URL}/upload/profile/veli/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(null);
        setMessage({ type: 'success', text: 'Profil fotoğrafı silindi!' });
        speak('Profil fotoğrafı silindi');
        
        // Auth context'i güncelle
        if (updateUser && user) {
          updateUser({ ...user, profilFoto: undefined });
        }
        setShowPhotoModal(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Fotoğraf silinemedi' });
      }
    } catch (error) {
      console.error('Fotoğraf silme hatası:', error);
      setMessage({ type: 'error', text: 'Fotoğraf silinirken bir hata oluştu' });
    } finally {
      setUploadingPhoto(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleProfilGuncelle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ad: profilData.ad,
          soyad: profilData.soyad,
          telefon: profilData.telefon
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
        speak('Profil başarıyla güncellendi');
        
        // Auth context'i güncelle
        if (updateUser && user) {
          updateUser({ 
            ...user, 
            ad: profilData.ad, 
            soyad: profilData.soyad, 
            telefon: profilData.telefon 
          });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSifreDegistir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sifreData.yeniSifre !== sifreData.yeniSifreTekrar) {
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor' });
      return;
    }
    if (sifreData.yeniSifre.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır' });
      return;
    }

    // Şifre güçlülük kontrolü
    const hasUpperCase = /[A-Z]/.test(sifreData.yeniSifre);
    const hasLowerCase = /[a-z]/.test(sifreData.yeniSifre);
    const hasNumbers = /\d/.test(sifreData.yeniSifre);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(sifreData.yeniSifre);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setMessage({ type: 'error', text: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/sifre/degistir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: sifreData.mevcutSifre,
          newPassword: sifreData.yeniSifre
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi!' });
        speak('Şifre başarıyla değiştirildi');
        setSifreData({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre değiştirilemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBildirimGuncelle = async () => {
    setLoading(true);
    try {
      // Bildirim ayarlarını localStorage'a kaydet
      localStorage.setItem(`veli_bildirim_ayarlari_${user?.id}`, JSON.stringify(bildirimler));
      
      // Push bildirimleri açıksa ve izin yoksa izin iste
      if (bildirimler.push && pushPermission !== 'granted') {
        await requestPushPermission();
      }
      
      setMessage({ type: 'success', text: 'Bildirim ayarları güncellendi!' });
      speak('Bildirim ayarları güncellendi');
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({ 
    enabled, 
    onToggle, 
    activeColor = 'bg-purple-600' 
  }: { 
    enabled: boolean; 
    onToggle: () => void; 
    activeColor?: string;
  }) => (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled ? activeColor : isDark ? 'bg-slate-600' : 'bg-slate-300'
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );

  // Font boyutu için slider progress
  const currentFontSize = typeof fontSize === 'number' ? fontSize : 16;
  const fontSizeProgress = ((currentFontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} backdrop-blur-xl border-b px-6 py-4`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/veli" 
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              onMouseEnter={() => speak('Geri dön')}
            >
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
            </Link>
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Hesap Ayarları</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profil, güvenlik ve erişilebilirlik ayarlarınızı yönetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Mesaj */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'guvenlik', label: 'Güvenlik', icon: Lock },
            { id: 'bildirimler', label: 'Bildirimler', icon: Bell },
            { id: 'erisilebilirlik', label: 'Erişilebilirlik', icon: Accessibility }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                speak(`${tab.label} sekmesi`);
              }}
              onMouseEnter={() => speak(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : isDark 
                    ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profil Tab */}
        {activeTab === 'profil' && (
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6`}>Profil Bilgileri</h2>
            
            <form onSubmit={handleProfilGuncelle} className="space-y-4">
              {/* Profil Fotoğrafı */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {profilFoto ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg">
                      <Image
                        src={profilFoto}
                        alt="Profil Fotoğrafı"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {profilData.ad?.[0]}{profilData.soyad?.[0]}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors shadow-md"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Gizli file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Ad</label>
                  <input
                    type="text"
                    value={profilData.ad}
                    onChange={e => setProfilData({ ...profilData, ad: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Soyad</label>
                  <input
                    type="text"
                    value={profilData.soyad}
                    onChange={e => setProfilData({ ...profilData, soyad: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>E-posta</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={profilData.email}
                    readOnly
                    disabled
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg cursor-not-allowed ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-slate-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  E-posta değiştirmek için yöneticinizle iletişime geçin
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Telefon</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type="tel"
                    value={profilData.telefon}
                    onChange={e => setProfilData({ ...profilData, telefon: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    placeholder="5XX XXX XX XX"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* Güvenlik Tab */}
        {activeTab === 'guvenlik' && (
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6`}>Şifre Değiştir</h2>
            
            <form onSubmit={handleSifreDegistir} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Mevcut Şifre</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.mevcutSifre}
                    onChange={e => setSifreData({ ...sifreData, mevcutSifre: e.target.value })}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Yeni Şifre</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.yeniSifre}
                    onChange={e => setSifreData({ ...sifreData, yeniSifre: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    required
                    minLength={6}
                  />
                </div>
                
                {/* Şifre Gücü Göstergesi */}
                {sifreData.yeniSifre && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = (() => {
                          let score = 0;
                          if (sifreData.yeniSifre.length >= 6) score++;
                          if (sifreData.yeniSifre.length >= 8) score++;
                          if (/[A-Z]/.test(sifreData.yeniSifre) && /[a-z]/.test(sifreData.yeniSifre)) score++;
                          if (/\d/.test(sifreData.yeniSifre)) score++;
                          if (/[!@#$%^&*(),.?":{}|<>]/.test(sifreData.yeniSifre)) score++;
                          return Math.min(score, 4);
                        })();
                        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
                        return (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              level <= strength ? colors[strength - 1] : isDark ? 'bg-slate-600' : 'bg-slate-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {(() => {
                        let score = 0;
                        if (sifreData.yeniSifre.length >= 6) score++;
                        if (sifreData.yeniSifre.length >= 8) score++;
                        if (/[A-Z]/.test(sifreData.yeniSifre) && /[a-z]/.test(sifreData.yeniSifre)) score++;
                        if (/\d/.test(sifreData.yeniSifre)) score++;
                        if (/[!@#$%^&*(),.?":{}|<>]/.test(sifreData.yeniSifre)) score++;
                        score = Math.min(score, 4);
                        const labels = ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü'];
                        return labels[score - 1] || 'Çok zayıf';
                      })()}
                    </div>
                  </div>
                )}
                
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} mt-1`}>
                  En az 6 karakter, büyük/küçük harf ve rakam içermelidir
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Yeni Şifre (Tekrar)</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.yeniSifreTekrar}
                    onChange={e => setSifreData({ ...sifreData, yeniSifreTekrar: e.target.value })}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      sifreData.yeniSifreTekrar && sifreData.yeniSifre !== sifreData.yeniSifreTekrar
                        ? 'border-red-500 focus:ring-red-500'
                        : sifreData.yeniSifreTekrar && sifreData.yeniSifre === sifreData.yeniSifreTekrar
                          ? 'border-green-500 focus:ring-green-500'
                          : 'focus:ring-purple-500'
                    } ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                  {sifreData.yeniSifreTekrar && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                      sifreData.yeniSifre === sifreData.yeniSifreTekrar ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {sifreData.yeniSifre === sifreData.yeniSifreTekrar ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {sifreData.yeniSifreTekrar && sifreData.yeniSifre !== sifreData.yeniSifreTekrar && (
                  <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Shield className="w-5 h-5" />
                {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          </div>
        )}

        {/* Bildirimler Tab */}
        {activeTab === 'bildirimler' && (
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6`}>Bildirim Tercihleri</h2>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} rounded-lg`}>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>E-posta Bildirimleri</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Önemli güncellemeler için e-posta al</p>
                </div>
                <ToggleSwitch
                  enabled={bildirimler.email}
                  onToggle={() => setBildirimler({ ...bildirimler, email: !bildirimler.email })}
                />
              </div>

              <div className={`p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} rounded-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Anlık Bildirimler</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tarayıcı bildirimleri</p>
                  </div>
                  <ToggleSwitch
                    enabled={bildirimler.push}
                    onToggle={() => setBildirimler({ ...bildirimler, push: !bildirimler.push })}
                  />
                </div>
                {/* Push notification izin durumu */}
                <div className="mt-3 flex items-center gap-2">
                  {pushPermission === 'granted' ? (
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                      ✓ İzin verildi
                    </span>
                  ) : pushPermission === 'denied' ? (
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                      ✗ İzin reddedildi
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={requestPushPermission}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        isDark 
                          ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-300' 
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                      }`}
                    >
                      İzin Ver
                    </button>
                  )}
                </div>
              </div>

              <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-4 mt-4`}>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'} mb-4`}>Bildirim Kategorileri</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'odevBildirim', label: 'Ödev Bildirimleri', desc: 'Çocuğunuzun ödevleri hakkında' },
                    { key: 'devamsizlikBildirim', label: 'Devamsızlık Bildirimleri', desc: 'Devamsızlık kayıtları' },
                    { key: 'sinavBildirim', label: 'Sınav Sonuçları', desc: 'Sınav ve deneme sonuçları' },
                    { key: 'mesajBildirim', label: 'Mesaj Bildirimleri', desc: 'Öğretmenlerden gelen mesajlar' },
                    { key: 'duyuruBildirim', label: 'Duyuru Bildirimleri', desc: 'Kurum duyuruları' }
                  ].map(item => (
                    <label 
                      key={item.key} 
                      className={`flex items-center justify-between p-3 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} rounded-lg cursor-pointer`}
                    >
                      <div>
                        <span className={`block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={bildirimler[item.key as keyof typeof bildirimler]}
                        onChange={e => setBildirimler({ ...bildirimler, [item.key]: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBildirimGuncelle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 mt-6"
              >
                <Bell className="w-5 h-5" />
                {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* Erişilebilirlik Tab */}
        {activeTab === 'erisilebilirlik' && (
          <div className="space-y-4">
            {/* Sesli Okuma Ayarları */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6 flex items-center gap-2`}>
                <Volume2 className="w-5 h-5 text-purple-500" />
                Sesli Okuma
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Sesli Okuma</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ekrandaki öğeleri sesli dinleyin</p>
                  </div>
                  <ToggleSwitch
                    enabled={ttsEnabled}
                    onToggle={() => {
                      setTtsEnabled(!ttsEnabled);
                      if (!ttsEnabled) setTimeout(() => speak('Sesli okuma açıldı'), 100);
                    }}
                  />
                </div>

                {ttsEnabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Konuşma Hızı</span>
                        <span className="text-sm font-medium text-purple-500">{ttsRate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={ttsRate}
                        onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                        className="a11y-slider w-full"
                        style={{ '--slider-progress': `${((ttsRate - 0.5) / 1.5) * 100}%` } as React.CSSProperties}
                      />
                      <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>Yavaş</span>
                        <span>Hızlı</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Konuşma Tonu</span>
                        <span className="text-sm font-medium text-purple-500">{ttsPitch.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={ttsPitch}
                        onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                        className="a11y-slider w-full"
                        style={{ '--slider-progress': `${((ttsPitch - 0.5) / 1.5) * 100}%` } as React.CSSProperties}
                      />
                      <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>Kalın</span>
                        <span>İnce</span>
                      </div>
                    </div>

                    <button
                      onClick={() => speak('Bu bir test mesajıdır. Ses ayarlarınızı kontrol edebilirsiniz.', true)}
                      className={`w-full py-2 px-4 rounded-lg text-sm transition-colors ${
                        isDark 
                          ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-300' 
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                      }`}
                    >
                      🔈 Sesi Test Et
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Yazı Boyutu */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6 flex items-center gap-2`}>
                <Type className="w-5 h-5 text-purple-500" />
                Yazı Boyutu
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Boyut</span>
                  <span className="text-xl font-bold text-purple-500">{currentFontSize}px</span>
                </div>
                <input
                  type="range"
                  min={FONT_SIZE_MIN}
                  max={FONT_SIZE_MAX}
                  step="1"
                  value={currentFontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  onMouseUp={() => speak(`Yazı boyutu ${currentFontSize} piksel`)}
                  className="a11y-slider w-full"
                  style={{ '--slider-progress': `${fontSizeProgress}%` } as React.CSSProperties}
                />
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>{FONT_SIZE_MIN}px</span>
                  <span>{FONT_SIZE_MAX}px</span>
                </div>

                {/* Önizleme */}
                <div className={`mt-3 p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontSize: `${currentFontSize}px` }}>
                    Örnek metin - Bu yazı {currentFontSize}px boyutunda görünüyor.
                  </p>
                </div>
              </div>
            </div>

            {/* Görsel Ayarlar */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6 flex items-center gap-2`}>
                <Palette className="w-5 h-5 text-purple-500" />
                Görsel Ayarlar
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Yüksek Kontrast</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daha belirgin renkler</p>
                  </div>
                  <ToggleSwitch
                    enabled={highContrast}
                    onToggle={() => {
                      setHighContrast(!highContrast);
                      speak(`Yüksek kontrast ${!highContrast ? 'açıldı' : 'kapatıldı'}`);
                    }}
                    activeColor="bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Büyük İmleç</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daha görünür fare imleci</p>
                  </div>
                  <ToggleSwitch
                    enabled={largeCursor}
                    onToggle={() => {
                      setLargeCursor(!largeCursor);
                      speak(`Büyük imleç ${!largeCursor ? 'açıldı' : 'kapatıldı'}`);
                    }}
                    activeColor="bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Hareket Azaltma</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Animasyonları devre dışı bırak</p>
                  </div>
                  <ToggleSwitch
                    enabled={reducedMotion}
                    onToggle={() => {
                      setReducedMotion(!reducedMotion);
                      speak(`Hareket azaltma ${!reducedMotion ? 'açıldı' : 'kapatıldı'}`);
                    }}
                    activeColor="bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Disleksi Dostu Font</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Okumayı kolaylaştıran font</p>
                  </div>
                  <ToggleSwitch
                    enabled={dyslexiaFont}
                    onToggle={() => {
                      setDyslexiaFont(!dyslexiaFont);
                      speak(`Disleksi dostu font ${!dyslexiaFont ? 'açıldı' : 'kapatıldı'}`);
                    }}
                    activeColor="bg-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Renk Körlüğü Modu */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6 flex items-center gap-2`}>
                <Eye className="w-5 h-5 text-purple-500" />
                Renk Körlüğü Modu
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'none', label: 'Normal', desc: 'Varsayılan', color: 'from-gray-500 to-gray-600' },
                  { value: 'protanopia', label: 'Protanopi', desc: 'Kırmızı körlüğü', color: 'from-yellow-500 to-orange-500' },
                  { value: 'deuteranopia', label: 'Deuteranopi', desc: 'Yeşil körlüğü', color: 'from-cyan-500 to-blue-500' },
                  { value: 'tritanopia', label: 'Tritanopi', desc: 'Mavi-sarı körlüğü', color: 'from-pink-500 to-purple-500' },
                  { value: 'monochromacy', label: 'Akromatopsi', desc: 'Tam renk körlüğü', color: 'from-gray-400 to-gray-500' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setColorBlindMode(mode.value as typeof colorBlindMode);
                      speak(`Renk modu: ${mode.label}`);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      colorBlindMode === mode.value
                        ? 'border-purple-500 bg-purple-500/20'
                        : isDark 
                          ? 'border-slate-700 bg-slate-700/30 hover:border-slate-600' 
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-full h-2 rounded-full bg-gradient-to-r ${mode.color} mb-3`} />
                    <span className={`block font-medium ${colorBlindMode === mode.value ? 'text-purple-400' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {mode.label}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Satır Aralığı */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-6`}>Satır Aralığı</h2>
              
              <div className="flex gap-3">
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'medium', label: 'Geniş' },
                  { value: 'large', label: 'Çok Geniş' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setLineHeight(item.value as typeof lineHeight);
                      speak(`Satır aralığı ${item.label}`);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      lineHeight === item.value
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : isDark 
                          ? 'border-slate-700 bg-slate-700/30 text-slate-300 hover:border-slate-600' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sıfırla */}
            <button
              onClick={() => {
                resetSettings();
                speak('Tüm erişilebilirlik ayarları sıfırlandı');
                setMessage({ type: 'success', text: 'Ayarlar varsayılana sıfırlandı' });
                setTimeout(() => setMessage(null), 3000);
              }}
              className={`w-full py-3 px-4 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }`}
            >
              🔄 Varsayılana Sıfırla
            </button>
          </div>
        )}
      </div>

      {/* Profil Fotoğrafı Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl w-full max-w-md overflow-hidden shadow-2xl`}>
            {/* Modal Header */}
            <div className={`p-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Profil Fotoğrafı
              </h3>
              <button 
                onClick={() => setShowPhotoModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Mevcut Fotoğraf Önizleme */}
              <div className="flex justify-center mb-6">
                {profilFoto ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg">
                    <Image
                      src={profilFoto}
                      alt="Profil Fotoğrafı"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profilData.ad?.[0]}{profilData.soyad?.[0]}
                  </div>
                )}
              </div>

              {/* Bilgi Mesajı */}
              <p className={`text-sm text-center mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Desteklenen formatlar: JPG, PNG, WebP (max 8MB)
              </p>

              {/* Butonlar */}
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {uploadingPhoto ? 'Yükleniyor...' : 'Yeni Fotoğraf Yükle'}
                </button>

                {profilFoto && (
                  <button
                    onClick={handlePhotoDelete}
                    disabled={uploadingPhoto}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors disabled:opacity-50 ${
                      isDark 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    Fotoğrafı Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VeliAyarlarPage() {
  return (
    <RoleGuard allowedRoles={['veli']}>
      <VeliAyarlarContent />
    </RoleGuard>
  );
}

