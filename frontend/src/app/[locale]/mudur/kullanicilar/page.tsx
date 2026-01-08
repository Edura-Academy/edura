'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  GraduationCap,
  User,
  UserCheck,
  X,
  Eye,
  EyeOff,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Sinif {
  id: string;
  ad: string;
  seviye?: string;
}

interface UserData {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon?: string;
  role: string;
  aktif: boolean;
  sinif?: Sinif;
  brans?: string;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ogretmen: { label: 'Öğretmen', color: 'bg-blue-100 text-blue-700', icon: User },
  sekreter: { label: 'Sekreter', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  ogrenci: { label: 'Öğrenci', color: 'bg-green-100 text-green-700', icon: GraduationCap },
  veli: { label: 'Veli', color: 'bg-amber-100 text-amber-700', icon: Users },
};

function KullanicilarContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserData[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    toplam: number;
    basarili: number;
    basarisiz: number;
    basarisizlar: Array<{ user: any; error: string }>;
  } | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    ad: '',
    soyad: '',
    telefon: '',
    role: 'ogretmen' as string,
    sinifId: '',
    brans: '',
  });

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users?aktif=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSiniflar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/siniflar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSiniflar(data.data);
      }
    } catch (error) {
      console.error('Sınıflar alınamadı:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchSiniflar();
  }, [fetchUsers, fetchSiniflar]);

  useEffect(() => {
    const action = searchParams.get('action');
    const role = searchParams.get('role');
    
    if (action === 'ekle') {
      setForm(prev => ({ ...prev, role: role || 'ogretmen' }));
      setShowAddModal(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          sinifId: form.sinifId || undefined,
          brans: form.brans || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kullanıcı başarıyla oluşturuldu!' });
        fetchUsers();
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: form.ad,
          soyad: form.soyad,
          telefon: form.telefon || undefined,
          email: form.email,
          sinifId: form.sinifId || undefined,
          brans: form.brans || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kullanıcı güncellendi!' });
        fetchUsers();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!confirm(`${user.ad} ${user.soyad} kullanıcısını silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      alert('Bir hata oluştu');
    }
    setOpenMenu(null);
  };

  const openEdit = (user: UserData) => {
    setSelectedUser(user);
    setForm({
      email: user.email,
      password: '',
      ad: user.ad,
      soyad: user.soyad,
      telefon: user.telefon || '',
      role: user.role,
      sinifId: user.sinif?.id || '',
      brans: user.brans || '',
    });
    setShowEditModal(true);
    setOpenMenu(null);
  };

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      ad: '',
      soyad: '',
      telefon: '',
      role: 'ogretmen',
      sinifId: '',
      brans: '',
    });
  };

  // Toplu import işlemi
  const handleBulkImport = async () => {
    if (!importData.trim()) {
      setMessage({ type: 'error', text: 'Lütfen kullanıcı verisi girin' });
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      // JSON parse et
      let usersToImport;
      try {
        usersToImport = JSON.parse(importData);
      } catch {
        setMessage({ type: 'error', text: 'Geçersiz JSON formatı' });
        setImportLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/users/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          users: usersToImport,
          defaultPassword: 'Edura2024!'
        }),
      });

      const data = await res.json();

      if (data.success) {
        setImportResult({
          toplam: data.data.toplam,
          basarili: data.data.basarili,
          basarisiz: data.data.basarisiz,
          basarisizlar: data.data.basarisizlar
        });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Import başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setImportLoading(false);
    }
  };

  // Import şablonunu indir
  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${API_URL}/users/import/sablon`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        const template = JSON.stringify(data.data.exampleData, null, 2);
        const blob = new Blob([template], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kullanici-import-sablonu.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Şablon indirilemedi:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    ogretmen: users.filter((u) => u.role === 'ogretmen').length,
    sekreter: users.filter((u) => u.role === 'sekreter').length,
    ogrenci: users.filter((u) => u.role === 'ogrenci').length,
    veli: users.filter((u) => u.role === 'veli').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Kullanıcı Yönetimi</h1>
                  <p className="text-xs text-slate-500">Personel ve öğrenci ekle/düzenle</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setImportData('');
                  setImportResult(null);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-2 border border-teal-600 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Toplu Import</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Yeni Kullanıcı</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(stats).map(([role, count]) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(filterRole === role ? 'all' : role)}
                className={`bg-white rounded-xl p-4 border transition-all ${
                  filterRole === role ? 'border-teal-500 ring-2 ring-teal-200' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium">{config.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                  </div>
                  <div className={`w-10 h-10 ${config.color.replace('text-', 'bg-').replace('700', '100')} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Arama ve Filtreler */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>

          {showFilters && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterRole('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterRole === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tümü
                </button>
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterRole === role ? config.color : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kullanıcı Listesi */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanıcı</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">E-posta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Detay</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.ogrenci;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-medium text-sm">
                              {user.ad?.charAt(0)}{user.soyad?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.ad} {user.soyad}</p>
                              <p className="text-xs text-slate-500 sm:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                            {roleConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">
                          {user.role === 'ogretmen' && user.brans && <span>{user.brans}</span>}
                          {user.role === 'ogrenci' && user.sinif && <span>{user.sinif.ad}</span>}
                          {user.role === 'sekreter' && <span>-</span>}
                          {user.role === 'veli' && <span>-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>
                            {openMenu === user.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                <div className="absolute right-0 top-10 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                                  <button
                                    onClick={() => openEdit(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Sil
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      {searchQuery || filterRole !== 'all' ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Yeni Kullanıcı Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Kullanıcı Ekle" size="lg" variant="light">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad *</label>
              <input
                type="text"
                value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Soyad *</label>
              <input
                type="text"
                value={form.soyad}
                onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ogretmen">Öğretmen</option>
              <option value="sekreter">Sekreter</option>
              <option value="ogrenci">Öğrenci</option>
              <option value="veli">Veli</option>
            </select>
          </div>

          {form.role === 'ogretmen' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branş</label>
              <input
                type="text"
                value={form.brans}
                onChange={(e) => setForm({ ...form, brans: e.target.value })}
                placeholder="Örn: Matematik"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {form.role === 'ogrenci' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
              <select
                value={form.sinifId}
                onChange={(e) => setForm({ ...form, sinifId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sınıf seçin</option>
                {siniflar.map((sinif) => (
                  <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Düzenle Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Kullanıcı Düzenle" size="lg" variant="light">
        <form onSubmit={handleUpdate} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad *</label>
              <input
                type="text"
                value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Soyad *</label>
              <input
                type="text"
                value={form.soyad}
                onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {selectedUser?.role === 'ogretmen' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branş</label>
              <input
                type="text"
                value={form.brans}
                onChange={(e) => setForm({ ...form, brans: e.target.value })}
                placeholder="Örn: Matematik"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {selectedUser?.role === 'ogrenci' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
              <select
                value={form.sinifId}
                onChange={(e) => setForm({ ...form, sinifId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sınıf seçin</option>
                {siniflar.map((sinif) => (
                  <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toplu Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Toplu Kullanıcı Import" size="lg" variant="light">
        <div className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* Bilgi Kutusu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">JSON Formatı</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Her satırda email, ad, soyad ve role alanları zorunludur. Öğrenciler için sinifAd, öğretmenler için brans ekleyebilirsiniz.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Örnek şablon indir
                </button>
              </div>
            </div>
          </div>

          {/* JSON Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kullanıcı Verileri (JSON)
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={`[
  { "email": "ogrenci@ornek.com", "ad": "Ali", "soyad": "Yılmaz", "role": "ogrenci", "sinifAd": "8-A" },
  { "email": "ogretmen@ornek.com", "ad": "Ayşe", "soyad": "Demir", "role": "ogretmen", "brans": "Matematik" }
]`}
              className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
            />
          </div>

          {/* Import Sonucu */}
          {importResult && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-slate-900">Import Sonucu</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{importResult.toplam}</p>
                  <p className="text-xs text-slate-500">Toplam</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.basarili}</p>
                  <p className="text-xs text-green-600">Başarılı</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.basarisiz}</p>
                  <p className="text-xs text-red-600">Başarısız</p>
                </div>
              </div>

              {importResult.basarisizlar.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Başarısız Olanlar
                  </h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.basarisizlar.map((item, idx) => (
                      <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded flex items-center gap-2">
                        <XCircle className="w-3 h-3" />
                        <span>{item.user.email} - {item.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowImportModal(false);
                setImportData('');
                setImportResult(null);
                setMessage(null);
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={handleBulkImport}
              disabled={importLoading || !importData.trim()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {importLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Import ediliyor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Et
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function KullanicilarPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <KullanicilarContent />
    </RoleGuard>
  );
}

