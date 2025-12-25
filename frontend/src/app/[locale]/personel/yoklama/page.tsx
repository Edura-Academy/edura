'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  QrCode,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowLeft,
  BookOpen,
  UserCheck,
  UserX,
  Timer
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Ogrenci {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string | null;
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  ogrenciler: Ogrenci[];
}

interface Course {
  id: string;
  ad: string;
  gun: string;
  baslangicSaati: string;
  bitisSaati: string;
  sinif: Sinif;
}

interface OgrenciYoklama {
  ogrenciId: string;
  ogrenciAd: string;
  ogrenciNo: string | null;
  durum: 'KATILDI' | 'KATILMADI' | 'GEC_KALDI' | 'IZINLI' | null;
  aciklama: string | null;
  yoklamaId: string | null;
}

interface YoklamaData {
  course: {
    id: string;
    ad: string;
    sinif: string;
    gun: string;
    saat: string;
  };
  tarih: string;
  ogrenciler: OgrenciYoklama[];
  istatistik: {
    toplam: number;
    katildi: number;
    katilmadi: number;
    gecKaldi: number;
    izinli: number;
    bekleyen: number;
  };
}

type YoklamaDurum = 'KATILDI' | 'KATILMADI' | 'GEC_KALDI' | 'IZINLI';

const durumlar: { value: YoklamaDurum; label: string; icon: any; color: string; bgColor: string }[] = [
  { value: 'KATILDI', label: 'Katıldı', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'KATILMADI', label: 'Katılmadı', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'GEC_KALDI', label: 'Geç Kaldı', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'IZINLI', label: 'İzinli', icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
];

export default function YoklamaPage() {
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [yoklamaData, setYoklamaData] = useState<YoklamaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Yerel yoklama değişiklikleri
  const [localChanges, setLocalChanges] = useState<Record<string, { durum: YoklamaDurum; aciklama?: string }>>({});

  // Token al
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Dersleri getir
  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/yoklama/ogretmen/dersler`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Yoklama verisi getir
  const fetchYoklama = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/yoklama/ogretmen/ders/${courseId}?tarih=${selectedDate}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setYoklamaData(data.data);
        setLocalChanges({}); // Yerel değişiklikleri sıfırla
      }
    } catch (error) {
      console.error('Yoklama yüklenemedi:', error);
    }
  }, [getAuthHeaders, selectedDate]);

  // İlk yükleme
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Ders seçildiğinde yoklamayı getir
  useEffect(() => {
    if (selectedCourse) {
      fetchYoklama(selectedCourse.id);
    }
  }, [selectedCourse, selectedDate, fetchYoklama]);

  // Yoklama durumunu güncelle (yerel)
  const handleDurumChange = (ogrenciId: string, durum: YoklamaDurum) => {
    setLocalChanges(prev => ({
      ...prev,
      [ogrenciId]: { ...prev[ogrenciId], durum }
    }));
  };

  // Tümünü işaretle
  const handleMarkAll = (durum: YoklamaDurum) => {
    if (!yoklamaData) return;
    const changes: Record<string, { durum: YoklamaDurum }> = {};
    yoklamaData.ogrenciler.forEach(o => {
      changes[o.ogrenciId] = { durum };
    });
    setLocalChanges(changes);
  };

  // Yoklamayı kaydet
  const handleSave = async () => {
    if (!selectedCourse || !yoklamaData) return;

    setSaving(true);
    try {
      // Yerel değişiklikleri ve mevcut verileri birleştir
      const yoklamalar = yoklamaData.ogrenciler.map(o => ({
        ogrenciId: o.ogrenciId,
        durum: localChanges[o.ogrenciId]?.durum || o.durum || 'KATILDI',
        aciklama: localChanges[o.ogrenciId]?.aciklama || o.aciklama
      }));

      const response = await fetch(
        `${API_URL}/yoklama/ogretmen/ders/${selectedCourse.id}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ yoklamalar, tarih: selectedDate })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Yoklama kaydedildi! ${data.data.devamsizSayisi} devamsız öğrenci için bildirim gönderildi.`);
        fetchYoklama(selectedCourse.id);
      } else {
        alert(data.error || 'Yoklama kaydedilemedi');
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // QR kod oluştur
  const handleGenerateQR = async () => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(
        `${API_URL}/yoklama/qr/olustur/${selectedCourse.id}`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();
      if (data.success) {
        setQrToken(data.data.token);
        setQrExpiry(Date.now() + data.data.expiresIn * 1000);
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('QR oluşturma hatası:', error);
    }
  };

  // QR süre sayacı
  useEffect(() => {
    if (qrExpiry <= 0) return;
    const interval = setInterval(() => {
      if (Date.now() >= qrExpiry) {
        setQrToken(null);
        setQrExpiry(0);
        setShowQRModal(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrExpiry]);

  // Filtreleme
  const filteredOgrenciler = yoklamaData?.ogrenciler.filter(o => {
    if (!searchQuery) return true;
    return o.ogrenciAd.toLowerCase().includes(searchQuery.toLowerCase()) ||
           o.ogrenciNo?.includes(searchQuery);
  }) || [];

  // Güncel durum al (yerel değişiklik varsa onu, yoksa mevcut veriyi)
  const getOgrenciDurum = (ogrenci: OgrenciYoklama) => {
    return localChanges[ogrenci.ogrenciId]?.durum || ogrenci.durum;
  };

  // Tarih değiştir
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/personel" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Yoklama</h1>
              <p className="text-white/70 text-sm mt-0.5">Ders yoklaması al ve takip et</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {!selectedCourse ? (
          // Ders Seçimi
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Ders Seçin</h2>
            
            {courses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <BookOpen size={64} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-600">Henüz ders atanmamış</h3>
                <p className="text-slate-400 mt-1">Size atanmış bir ders bulunmuyor</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-all hover:scale-[1.02] border-2 border-transparent hover:border-[#00A884]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{course.ad}</h3>
                        <p className="text-sm text-slate-500 mt-1">{course.sinif.ad}</p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                          <Calendar size={14} />
                          <span>{course.gun}</span>
                          <span className="text-slate-400">•</span>
                          <Clock size={14} />
                          <span>{course.baslangicSaati} - {course.bitisSaati}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[#00A884]">
                        <Users size={16} />
                        <span className="text-sm font-medium">{course.sinif.ogrenciler.length}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Yoklama Alma
          <div className="space-y-4">
            {/* Üst Kontroller */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h2 className="font-semibold text-slate-800">{yoklamaData?.course.ad}</h2>
                    <p className="text-sm text-slate-500">{yoklamaData?.course.sinif} • {yoklamaData?.course.saat}</p>
                  </div>
                </div>

                {/* Tarih Seçimi */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeDate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => changeDate(1)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* İstatistikler */}
            {yoklamaData && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-slate-800">{yoklamaData.istatistik.toplam}</div>
                  <div className="text-sm text-slate-500">Toplam</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{yoklamaData.istatistik.katildi}</div>
                  <div className="text-sm text-green-600">Katıldı</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{yoklamaData.istatistik.katilmadi}</div>
                  <div className="text-sm text-red-600">Katılmadı</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{yoklamaData.istatistik.gecKaldi}</div>
                  <div className="text-sm text-yellow-600">Geç Kaldı</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 col-span-2 sm:col-span-1">
                  <div className="text-2xl font-bold text-blue-600">{yoklamaData.istatistik.izinli}</div>
                  <div className="text-sm text-blue-600">İzinli</div>
                </div>
              </div>
            )}

            {/* Hızlı İşlemler */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 mr-2">Hızlı İşlem:</span>
                {durumlar.map(d => (
                  <button
                    key={d.value}
                    onClick={() => handleMarkAll(d.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${d.bgColor} ${d.color} hover:opacity-80 transition-opacity`}
                  >
                    <d.icon size={14} />
                    Tümü {d.label}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={handleGenerateQR}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                >
                  <QrCode size={18} />
                  QR Kod ile Yoklama
                </button>
              </div>
            </div>

            {/* Arama */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A884]"
              />
            </div>

            {/* Öğrenci Listesi */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredOgrenciler.map((ogrenci, index) => {
                  const currentDurum = getOgrenciDurum(ogrenci);
                  const durumInfo = durumlar.find(d => d.value === currentDurum);

                  return (
                    <div key={ogrenci.ogrenciId} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        {/* Sıra No */}
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          {index + 1}
                        </div>

                        {/* Öğrenci Bilgisi */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{ogrenci.ogrenciAd}</p>
                          {ogrenci.ogrenciNo && (
                            <p className="text-sm text-slate-500">No: {ogrenci.ogrenciNo}</p>
                          )}
                        </div>

                        {/* Durum Seçimi */}
                        <div className="flex items-center gap-1">
                          {durumlar.map(d => (
                            <button
                              key={d.value}
                              onClick={() => handleDurumChange(ogrenci.ogrenciId, d.value)}
                              className={`p-2 rounded-lg transition-all ${
                                currentDurum === d.value
                                  ? `${d.bgColor} ${d.color} ring-2 ring-offset-1 ring-current`
                                  : 'hover:bg-slate-100 text-slate-400'
                              }`}
                              title={d.label}
                            >
                              <d.icon size={20} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="sticky bottom-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#00A884] text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-[#008069] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Yoklamayı Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && qrToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-purple-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold">QR Kod ile Yoklama</h3>
              <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <p className="text-slate-600 mb-4">
                Öğrenciler bu QR kodu okutarak yoklamaya katılabilir
              </p>

              {/* QR Kod - Basit metin gösterimi (gerçek QR için qrcode kütüphanesi kullanılabilir) */}
              <div className="bg-slate-100 rounded-xl p-8 mb-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-4 border-slate-200">
                  <QrCode size={120} className="text-slate-800" />
                </div>
                <p className="text-xs text-slate-500 mt-4 font-mono break-all">
                  {qrToken.substring(0, 30)}...
                </p>
              </div>

              {/* Süre Sayacı */}
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Timer size={18} />
                <span className="font-medium">
                  {Math.max(0, Math.floor((qrExpiry - Date.now()) / 1000))} saniye kaldı
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                QR kod 10 dakika geçerlidir. Süre dolduğunda yeni kod oluşturabilirsiniz.
              </p>

              <button
                onClick={handleGenerateQR}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200"
              >
                <RefreshCw size={18} />
                Yeni Kod Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

