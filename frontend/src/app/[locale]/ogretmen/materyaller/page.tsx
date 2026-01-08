'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  File,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  Plus,
  X,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Course {
  id: string;
  ad: string;
  sinif?: { id?: string; ad?: string; seviye?: number };
  ogretmen?: { id?: string; ad?: string; soyad?: string; brans?: string };
}

interface Materyal {
  id: string;
  baslik: string;
  aciklama?: string;
  courseId: string;
  course?: {
    ad?: string;
    sinif?: { ad?: string };
  };
  tip: 'PDF' | 'VIDEO' | 'RESIM' | 'BELGE' | 'SUNUM' | 'DIGER';
  dosyaUrl: string;
  dosyaAdi: string;
  dosyaBoyutu?: number;
  indirmeSayisi: number;
  aktif: boolean;
  createdAt: string;
}

const tipIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="w-5 h-5 text-red-500" />,
  VIDEO: <Video className="w-5 h-5 text-purple-500" />,
  RESIM: <Image className="w-5 h-5 text-green-500" />,
  BELGE: <File className="w-5 h-5 text-blue-500" />,
  SUNUM: <Presentation className="w-5 h-5 text-orange-500" />,
  DIGER: <FileSpreadsheet className="w-5 h-5 text-gray-500" />
};

const tipLabels: Record<string, string> = {
  PDF: 'PDF',
  VIDEO: 'Video',
  RESIM: 'Resim',
  BELGE: 'Belge',
  SUNUM: 'Sunum',
  DIGER: 'Diğer'
};

function OgretmenMateryallerContent() {
  const [materyaller, setMateryaller] = useState<Materyal[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTip, setFilterTip] = useState('');

  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    tip: 'PDF' as Materyal['tip'],
    dosyaUrl: '',
    dosyaAdi: '',
    dosyaBoyutu: 0
  });

  const [uploading, setUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMateryaller();
    fetchCourses();
  }, []);

  const fetchMateryaller = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/materyaller/ogretmen/liste`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error('Materyal API hatası:', res.status);
        setMateryaller([]);
        return;
      }
      
      const data = await res.json();
      setMateryaller(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Materyaller alınamadı:', error);
      setMateryaller([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      // Öğretmenin derslerini al - odevler/ogretmen/dersler endpoint'ini kullan
      const res = await fetch(`${API_URL}/odevler/ogretmen/dersler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error('Dersler API hatası:', res.status);
        setCourses([]);
        return;
      }
      
      const data = await res.json();
      // API { success: true, data: [...] } formatında dönüyor
      if (data.success && Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Dersler alınamadı:', error);
      setCourses([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Boyut kontrolü (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Dosya boyutu 50MB\'dan küçük olmalıdır.');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch(`${API_URL}/upload/materyal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Dosya yüklenirken bir hata oluştu.');
        return;
      }

      const data = await res.json();

      if (data.success || data.url) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        let tip: Materyal['tip'] = 'DIGER';
        if (ext === 'pdf') tip = 'PDF';
        else if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) tip = 'VIDEO';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) tip = 'RESIM';
        else if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) tip = 'BELGE';
        else if (['ppt', 'pptx', 'key'].includes(ext || '')) tip = 'SUNUM';

        setFormData({
          ...formData,
          dosyaUrl: data.url || data.data?.url,
          dosyaAdi: file.name,
          dosyaBoyutu: file.size,
          tip
        });
      } else {
        alert(data.error || 'Dosya yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken bir bağlantı hatası oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/materyaller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchMateryaller();
      }
    } catch (error) {
      console.error('Materyal ekleme hatası:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Materyali silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/materyaller/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMateryaller();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      baslik: '',
      aciklama: '',
      courseId: '',
      tip: 'PDF',
      dosyaUrl: '',
      dosyaAdi: '',
      dosyaBoyutu: 0
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMateryaller = materyaller.filter(m => {
    const matchesSearch = m.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.dosyaAdi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || m.courseId === filterCourse;
    const matchesTip = !filterTip || m.tip === filterTip;
    return matchesSearch && matchesCourse && matchesTip;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Materyaller</h1>
                <p className="text-cyan-100 text-sm">Ders materyallerinizi yönetin</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Materyal Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Materyal ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Tüm Dersler</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.sinif?.ad ? `${c.sinif.ad} - ` : ''}{c.ad}</option>
            ))}
          </select>
          <select
            value={filterTip}
            onChange={e => setFilterTip(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Tüm Tipler</option>
            {Object.entries(tipLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-slate-800">{materyaller.length}</div>
            <div className="text-slate-500 text-sm">Toplam Materyal</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-cyan-600">
              {materyaller.reduce((acc, m) => acc + m.indirmeSayisi, 0)}
            </div>
            <div className="text-slate-500 text-sm">Toplam İndirme</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">
              {materyaller.filter(m => m.tip === 'PDF').length}
            </div>
            <div className="text-slate-500 text-sm">PDF</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">
              {materyaller.filter(m => m.tip === 'VIDEO').length}
            </div>
            <div className="text-slate-500 text-sm">Video</div>
          </div>
        </div>

        {/* Materyal Listesi */}
        {filteredMateryaller.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Henüz materyal yok</h3>
            <p className="text-slate-500">Yeni materyal ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMateryaller.map(materyal => (
              <div
                key={materyal.id}
                className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 hover:border-cyan-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl">
                      {tipIcons[materyal.tip]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{materyal.baslik}</h3>
                      <p className="text-slate-500 text-sm">
                        {materyal.course?.sinif?.ad ? `${materyal.course.sinif.ad} - ` : ''}{materyal.course?.ad || 'Ders bilgisi yok'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span>{materyal.dosyaAdi}</span>
                        {materyal.dosyaBoyutu && <span>{formatBytes(materyal.dosyaBoyutu)}</span>}
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {materyal.indirmeSayisi} indirme
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      materyal.tip === 'PDF' ? 'bg-red-100 text-red-700' :
                      materyal.tip === 'VIDEO' ? 'bg-purple-100 text-purple-700' :
                      materyal.tip === 'RESIM' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {tipLabels[materyal.tip]}
                    </span>
                    <a
                      href={materyal.dosyaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(materyal.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {materyal.aciklama && (
                  <p className="text-slate-600 text-sm mt-3 ml-16">{materyal.aciklama}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">Yeni Materyal</h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Dosya Yükleme */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dosya
                  </label>
                  {formData.dosyaUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      {tipIcons[formData.tip]}
                      <span className="text-green-700 flex-1">{formData.dosyaAdi}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dosyaUrl: '', dosyaAdi: '' })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors">
                      <Upload className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-slate-500 text-sm">
                        {uploading ? 'Yükleniyor...' : 'Dosya seçin veya sürükleyin'}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.baslik}
                    onChange={e => setFormData({ ...formData, baslik: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Materyal başlığı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    rows={2}
                    placeholder="Materyal hakkında kısa açıklama"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ders
                  </label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Ders Seçin</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.sinif?.ad ? `${c.sinif.ad} - ` : ''}{c.ad}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.dosyaUrl}
                    className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OgretmenMateryallerPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenMateryallerContent />
    </RoleGuard>
  );
}
