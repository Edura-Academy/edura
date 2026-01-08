'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Trash2,
  Loader2
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

function OgretmenAyarlarContent() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profil fotoğrafı state
  const [profilFoto, setProfilFoto] = useState<string | null>(null);
  const [fotoLoading, setFotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profil form state
  const [profilData, setProfilData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    brans: ''
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
    mesajBildirim: true,
    duyuruBildirim: true,
    yoklamaBildirim: true
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      setProfilData({
        ad: user.ad || '',
        soyad: user.soyad || '',
        email: user.email || '',
        telefon: user.telefon || '',
        brans: user.brans || ''
      });
      // Profil fotoğrafını getir
      fetchProfilFoto();
    }
  }, [user]);

  // Profil fotoğrafını getir
  const fetchProfilFoto = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/upload/profile/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setProfilFoto(data.data.url);
      }
    } catch (error) {
      console.log('Profil fotoğrafı bulunamadı');
    }
  };

  // Profil fotoğrafı yükle
  const handleFotoYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Dosya validasyonu
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setMessage({ type: 'error', text: 'Sadece JPG, PNG ve WebP dosyaları yüklenebilir' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Dosya boyutu 8MB\'dan küçük olmalı' });
      return;
    }

    setFotoLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_URL}/upload/profile/user/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(data.data.url);
        setMessage({ type: 'success', text: 'Profil fotoğrafı güncellendi!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Fotoğraf yüklenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fotoğraf yüklenirken hata oluştu' });
    } finally {
      setFotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Profil fotoğrafını sil
  const handleFotoSil = async () => {
    if (!user?.id || !profilFoto) return;

    setFotoLoading(true);
    try {
      const res = await fetch(`${API_URL}/upload/profile/user/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(null);
        setMessage({ type: 'success', text: 'Profil fotoğrafı silindi!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Fotoğraf silinemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fotoğraf silinirken hata oluştu' });
    } finally {
      setFotoLoading(false);
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
        body: JSON.stringify(profilData)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
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

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mevcutSifre: sifreData.mevcutSifre,
          yeniSifre: sifreData.yeniSifre
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi!' });
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
      const res = await fetch(`${API_URL}/users/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bildirimler)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Bildirim ayarları güncellendi!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Hesap Ayarları</h1>
              <p className="text-slate-300 text-sm">Profil ve güvenlik ayarlarınızı yönetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Mesaj */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'guvenlik', label: 'Güvenlik', icon: Lock },
            { id: 'bildirimler', label: 'Bildirimler', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Profil Bilgileri</h2>
            
            <form onSubmit={handleProfilGuncelle} className="space-y-4">
              {/* Profil Fotoğrafı */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  {profilFoto ? (
                    <img
                      src={profilFoto}
                      alt="Profil"
                      className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                      {profilData.ad?.[0]}{profilData.soyad?.[0]}
                    </div>
                  )}
                  
                  {/* Loading overlay */}
                  {fotoLoading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Kamera butonu */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fotoLoading}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Gizli file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFotoYukle}
                  className="hidden"
                />
                
                {/* Fotoğraf butonları */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fotoLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {profilFoto ? 'Değiştir' : 'Fotoğraf Ekle'}
                  </button>
                  
                  {profilFoto && (
                    <button
                      type="button"
                      onClick={handleFotoSil}
                      disabled={fotoLoading}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 mt-2">JPG, PNG veya WebP • Maks 8MB</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                  <input
                    type="text"
                    value={profilData.ad}
                    onChange={e => setProfilData({ ...profilData, ad: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                  <input
                    type="text"
                    value={profilData.soyad}
                    onChange={e => setProfilData({ ...profilData, soyad: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={profilData.email}
                    onChange={e => setProfilData({ ...profilData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={profilData.telefon}
                    onChange={e => setProfilData({ ...profilData, telefon: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5XX XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branş</label>
                <input
                  type="text"
                  value={profilData.brans}
                  onChange={e => setProfilData({ ...profilData, brans: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Matematik"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* Güvenlik Tab */}
        {activeTab === 'guvenlik' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Şifre Değiştir</h2>
            
            <form onSubmit={handleSifreDegistir} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mevcut Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.mevcutSifre}
                    onChange={e => setSifreData({ ...sifreData, mevcutSifre: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.yeniSifre}
                    onChange={e => setSifreData({ ...sifreData, yeniSifre: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">En az 6 karakter olmalıdır</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre (Tekrar)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sifreData.yeniSifreTekrar}
                    onChange={e => setSifreData({ ...sifreData, yeniSifreTekrar: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Shield className="w-5 h-5" />
                {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          </div>
        )}

        {/* Bildirimler Tab */}
        {activeTab === 'bildirimler' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Bildirim Tercihleri</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">E-posta Bildirimleri</p>
                  <p className="text-sm text-slate-500">Önemli güncellemeler için e-posta al</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bildirimler.email}
                    onChange={e => setBildirimler({ ...bildirimler, email: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Anlık Bildirimler</p>
                  <p className="text-sm text-slate-500">Tarayıcı bildirimleri</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bildirimler.push}
                    onChange={e => setBildirimler({ ...bildirimler, push: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <p className="font-medium text-slate-800 mb-4">Bildirim Kategorileri</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'odevBildirim', label: 'Ödev Teslim Bildirimleri' },
                    { key: 'mesajBildirim', label: 'Mesaj Bildirimleri' },
                    { key: 'duyuruBildirim', label: 'Duyuru Bildirimleri' },
                    { key: 'yoklamaBildirim', label: 'Yoklama Hatırlatmaları' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <span className="text-slate-700">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={bildirimler[item.key as keyof typeof bildirimler]}
                        onChange={e => setBildirimler({ ...bildirimler, [item.key]: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBildirimGuncelle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mt-6"
              >
                <Bell className="w-5 h-5" />
                {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OgretmenAyarlarPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenAyarlarContent />
    </RoleGuard>
  );
}

