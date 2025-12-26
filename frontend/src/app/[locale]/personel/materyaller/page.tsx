'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  File,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  Plus,
  X,
  Eye,
  BarChart3
} from 'lucide-react';

interface Course {
  id: string;
  ad: string;
  sinif: { ad: string };
}

interface Materyal {
  id: string;
  baslik: string;
  aciklama?: string;
  courseId: string;
  course: {
    ad: string;
    sinif: { ad: string };
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

export default function PersonelMateryallerPage() {
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
      const data = await res.json();
      setMateryaller(data);
    } catch (error) {
      console.error('Materyaller alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/courses/ogretmen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error('Dersler alınamadı:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      const data = await res.json();

      if (res.ok) {
        // Dosya tipini belirle
        const ext = file.name.split('.').pop()?.toLowerCase();
        let tip: Materyal['tip'] = 'DIGER';
        if (ext === 'pdf') tip = 'PDF';
        else if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) tip = 'VIDEO';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) tip = 'RESIM';
        else if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) tip = 'BELGE';
        else if (['ppt', 'pptx', 'key'].includes(ext || '')) tip = 'SUNUM';

        setFormData({
          ...formData,
          dosyaUrl: data.url,
          dosyaAdi: file.name,
          dosyaBoyutu: file.size,
          tip
        });
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Materyaller</h1>
              <p className="text-gray-400">Ders materyallerinizi yönetin</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Materyal Ekle
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Materyal ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Tüm Dersler</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.sinif.ad} - {c.ad}</option>
            ))}
          </select>
          <select
            value={filterTip}
            onChange={e => setFilterTip(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Tüm Tipler</option>
            {Object.entries(tipLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{materyaller.length}</div>
            <div className="text-gray-400 text-sm">Toplam Materyal</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">
              {materyaller.reduce((acc, m) => acc + m.indirmeSayisi, 0)}
            </div>
            <div className="text-gray-400 text-sm">Toplam İndirme</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">
              {materyaller.filter(m => m.tip === 'PDF').length}
            </div>
            <div className="text-gray-400 text-sm">PDF</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">
              {materyaller.filter(m => m.tip === 'VIDEO').length}
            </div>
            <div className="text-gray-400 text-sm">Video</div>
          </div>
        </div>

        {/* Materyal Listesi */}
        {filteredMateryaller.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz materyal yok</h3>
            <p className="text-gray-400">Yeni materyal ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMateryaller.map(materyal => (
              <div
                key={materyal.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      {tipIcons[materyal.tip]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{materyal.baslik}</h3>
                      <p className="text-gray-400 text-sm">
                        {materyal.course.sinif.ad} - {materyal.course.ad}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
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
                      materyal.tip === 'PDF' ? 'bg-red-500/20 text-red-400' :
                      materyal.tip === 'VIDEO' ? 'bg-purple-500/20 text-purple-400' :
                      materyal.tip === 'RESIM' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {tipLabels[materyal.tip]}
                    </span>
                    <a
                      href={materyal.dosyaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(materyal.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {materyal.aciklama && (
                  <p className="text-gray-300 text-sm mt-3 ml-16">{materyal.aciklama}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Yeni Materyal</h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Dosya Yükleme */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dosya
                  </label>
                  {formData.dosyaUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-500/20 rounded-xl">
                      {tipIcons[formData.tip]}
                      <span className="text-green-400 flex-1">{formData.dosyaAdi}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dosyaUrl: '', dosyaAdi: '' })}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-500/50 transition-all">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-gray-400 text-sm">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.baslik}
                    onChange={e => setFormData({ ...formData, baslik: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Materyal başlığı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    rows={2}
                    placeholder="Materyal hakkında kısa açıklama"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ders
                  </label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ders Seçin</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.sinif.ad} - {c.ad}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-6 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.dosyaUrl}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50"
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

