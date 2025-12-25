'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, 
  Bell,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ArrowLeft,
  CheckCircle,
  FileText,
  Download,
  X,
  Eye
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  hedef: string;
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  dosyaUrl: string | null;
  dosyaAd: string | null;
  olusturan: string;
  olusturanRol: string;
  yayinTarihi: string;
  okundu: boolean;
  okunmaTarihi: string | null;
}

interface Istatistik {
  toplam: number;
  okunmamis: number;
  acil: number;
  onemli: number;
}

type FilterType = 'hepsi' | 'okunmamis' | 'acil' | 'onemli';

export default function DuyurularPage() {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [istatistik, setIstatistik] = useState<Istatistik>({ toplam: 0, okunmamis: 0, acil: 0, onemli: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDuyuru, setSelectedDuyuru] = useState<Duyuru | null>(null);
  const [filter, setFilter] = useState<FilterType>('hepsi');
  const [userRole, setUserRole] = useState<string>('');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Duyuruları getir
  const fetchDuyurular = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/duyurular/benim`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setDuyurular(data.data.duyurular);
        setIstatistik(data.data.istatistik);
      }
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Kullanıcı rolünü al
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserRole(userData.role);
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchDuyurular();
  }, [fetchDuyurular]);

  // Duyuruyu oku
  const handleRead = async (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    
    if (!duyuru.okundu) {
      try {
        await fetch(`${API_URL}/duyurular/${duyuru.id}/oku`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        
        // Listeyi güncelle
        setDuyurular(prev => prev.map(d => 
          d.id === duyuru.id ? { ...d, okundu: true, okunmaTarihi: new Date().toISOString() } : d
        ));
        setIstatistik(prev => ({ ...prev, okunmamis: Math.max(0, prev.okunmamis - 1) }));
      } catch (error) {
        console.error('Okundu işareti hatası:', error);
      }
    }
  };

  // Filtreleme
  const filteredDuyurular = duyurular.filter(d => {
    switch (filter) {
      case 'okunmamis': return !d.okundu;
      case 'acil': return d.oncelik === 'ACIL';
      case 'onemli': return d.oncelik === 'ONEMLI';
      default: return true;
    }
  });

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Öncelik badge
  const getOncelikStyle = (oncelik: string) => {
    switch (oncelik) {
      case 'ACIL':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'Acil' };
      case 'ONEMLI':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle, label: 'Önemli' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', icon: Bell, label: 'Normal' };
    }
  };

  // Geri dönüş linki
  const getBackLink = () => {
    if (userRole === 'ogrenci') return '/ogrenci';
    if (['mudur', 'ogretmen', 'sekreter'].includes(userRole)) return '/personel';
    return '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href={getBackLink()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold">Duyurular</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {istatistik.okunmamis > 0 ? `${istatistik.okunmamis} okunmamış duyuru` : 'Tüm duyuruları okudunuz'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Filtreler */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hepsi', label: 'Tümü', count: istatistik.toplam },
            { key: 'okunmamis', label: 'Okunmamış', count: istatistik.okunmamis },
            { key: 'acil', label: 'Acil', count: istatistik.acil },
            { key: 'onemli', label: 'Önemli', count: istatistik.onemli }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterType)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f.key
                  ? f.key === 'acil' ? 'bg-red-500 text-white'
                    : f.key === 'onemli' ? 'bg-yellow-500 text-white'
                    : 'bg-[#00A884] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === f.key ? 'bg-white/30' : 'bg-slate-200'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Duyuru Listesi */}
        <div className="space-y-3">
          {filteredDuyurular.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Bu kategoride duyuru yok</p>
            </div>
          ) : (
            filteredDuyurular.map(duyuru => {
              const style = getOncelikStyle(duyuru.oncelik);
              const Icon = style.icon;

              return (
                <button
                  key={duyuru.id}
                  onClick={() => handleRead(duyuru)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all ${
                    !duyuru.okundu ? 'border-l-4 border-[#00A884]' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* İkon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                        <Icon size={24} className={style.text} />
                      </div>

                      {/* İçerik */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          {!duyuru.okundu && (
                            <span className="w-2 h-2 bg-[#00A884] rounded-full"></span>
                          )}
                        </div>
                        <h3 className={`font-semibold ${!duyuru.okundu ? 'text-slate-900' : 'text-slate-700'}`}>
                          {duyuru.baslik}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{duyuru.icerik}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(duyuru.yayinTarihi)}
                          </span>
                          <span>{duyuru.olusturan}</span>
                          {duyuru.dosyaUrl && (
                            <span className="flex items-center gap-1 text-blue-500">
                              <FileText size={12} />
                              Ek dosya
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Duyuru Detay Modal */}
      {selectedDuyuru && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`p-4 flex items-center justify-between sticky top-0 ${
              selectedDuyuru.oncelik === 'ACIL' ? 'bg-red-500' :
              selectedDuyuru.oncelik === 'ONEMLI' ? 'bg-yellow-500' : 'bg-[#008069]'
            } text-white`}>
              <div className="flex items-center gap-2">
                {selectedDuyuru.oncelik === 'ACIL' ? <AlertTriangle size={20} /> :
                 selectedDuyuru.oncelik === 'ONEMLI' ? <AlertCircle size={20} /> : <Bell size={20} />}
                <span className="font-medium">
                  {selectedDuyuru.oncelik === 'ACIL' ? 'Acil Duyuru' :
                   selectedDuyuru.oncelik === 'ONEMLI' ? 'Önemli Duyuru' : 'Duyuru'}
                </span>
              </div>
              <button
                onClick={() => setSelectedDuyuru(null)}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* İçerik */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedDuyuru.baslik}</h2>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(selectedDuyuru.yayinTarihi)}
                </span>
                <span>{selectedDuyuru.olusturan}</span>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-600">{selectedDuyuru.icerik}</p>
              </div>

              {/* Dosya Eki */}
              {selectedDuyuru.dosyaUrl && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-2">Ek Dosya:</p>
                  <a
                    href={selectedDuyuru.dosyaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <FileText size={18} />
                    <span>{selectedDuyuru.dosyaAd || 'Dosyayı İndir'}</span>
                    <Download size={16} />
                  </a>
                </div>
              )}

              {/* Okundu Bilgisi */}
              {selectedDuyuru.okundu && selectedDuyuru.okunmaTarihi && (
                <div className="mt-6 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  <span>Okundu - {new Date(selectedDuyuru.okunmaTarihi).toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedDuyuru(null)}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

