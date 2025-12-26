'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  File,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  Eye,
  BookOpen,
  Filter
} from 'lucide-react';

interface Materyal {
  id: string;
  baslik: string;
  aciklama?: string;
  course: {
    ad: string;
    sinif: { ad: string };
  };
  yukleyen: {
    ad: string;
    soyad: string;
  };
  tip: 'PDF' | 'VIDEO' | 'RESIM' | 'BELGE' | 'SUNUM' | 'DIGER';
  dosyaUrl: string;
  dosyaAdi: string;
  dosyaBoyutu?: number;
  indirmeSayisi: number;
  createdAt: string;
}

const tipIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="w-6 h-6 text-red-500" />,
  VIDEO: <Video className="w-6 h-6 text-purple-500" />,
  RESIM: <Image className="w-6 h-6 text-green-500" />,
  BELGE: <File className="w-6 h-6 text-blue-500" />,
  SUNUM: <Presentation className="w-6 h-6 text-orange-500" />,
  DIGER: <FileSpreadsheet className="w-6 h-6 text-gray-500" />
};

const tipLabels: Record<string, string> = {
  PDF: 'PDF',
  VIDEO: 'Video',
  RESIM: 'Resim',
  BELGE: 'Belge',
  SUNUM: 'Sunum',
  DIGER: 'Diğer'
};

const tipColors: Record<string, string> = {
  PDF: 'from-red-500/20 to-red-600/20 border-red-500/30',
  VIDEO: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  RESIM: 'from-green-500/20 to-green-600/20 border-green-500/30',
  BELGE: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  SUNUM: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  DIGER: 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
};

export default function OgrenciMateryallerPage() {
  const [materyaller, setMateryaller] = useState<Materyal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMateryaller();
  }, []);

  const fetchMateryaller = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/materyaller/ogrenci/liste`, {
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

  const handleDownload = async (materyal: Materyal) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/materyaller/${materyal.id}/indir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Dosyayı aç
      window.open(materyal.dosyaUrl, '_blank');
    } catch (error) {
      console.error('İndirme hatası:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Unique dersler
  const uniqueCourses = Array.from(new Set(materyaller.map(m => m.course.ad)));

  const filteredMateryaller = materyaller.filter(m => {
    const matchesSearch = m.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.dosyaAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.course.ad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTip = !filterTip || m.tip === filterTip;
    const matchesCourse = !filterCourse || m.course.ad === filterCourse;
    return matchesSearch && matchesTip && matchesCourse;
  });

  // Derslere göre grupla
  const grupluMateryaller = filteredMateryaller.reduce((acc, m) => {
    const key = `${m.course.sinif.ad} - ${m.course.ad}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, Materyal[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Ders Materyalleri</h1>
            <p className="text-gray-400">Öğretmenlerinizin paylaştığı materyaller</p>
          </div>
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
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
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
          {Object.entries(tipLabels).slice(0, 4).map(([key, label]) => (
            <div key={key} className={`bg-gradient-to-br ${tipColors[key]} backdrop-blur-xl rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {materyaller.filter(m => m.tip === key).length}
                  </div>
                  <div className="text-gray-400 text-sm">{label}</div>
                </div>
                {tipIcons[key]}
              </div>
            </div>
          ))}
        </div>

        {/* Materyal Listesi */}
        {filteredMateryaller.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz materyal yok</h3>
            <p className="text-gray-400">Öğretmenleriniz materyal paylaştığında burada görünecek</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grupluMateryaller).map(([dersAdi, dersMateryalleri]) => (
              <div key={dersAdi}>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  {dersAdi}
                  <span className="text-sm text-gray-400 font-normal">
                    ({dersMateryalleri.length} materyal)
                  </span>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {dersMateryalleri.map(materyal => (
                    <div
                      key={materyal.id}
                      className={`bg-gradient-to-br ${tipColors[materyal.tip]} backdrop-blur-xl rounded-2xl p-5 border hover:scale-[1.02] transition-all cursor-pointer group`}
                      onClick={() => handleDownload(materyal)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                          {tipIcons[materyal.tip]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {materyal.baslik}
                          </h3>
                          <p className="text-gray-400 text-sm truncate">{materyal.dosyaAdi}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{materyal.yukleyen.ad} {materyal.yukleyen.soyad}</span>
                            <span>•</span>
                            <span>{formatDate(materyal.createdAt)}</span>
                            {materyal.dosyaBoyutu && (
                              <>
                                <span>•</span>
                                <span>{formatBytes(materyal.dosyaBoyutu)}</span>
                              </>
                            )}
                          </div>
                          {materyal.aciklama && (
                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">{materyal.aciklama}</p>
                          )}
                        </div>
                        <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all group-hover:bg-blue-500/20">
                          <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

