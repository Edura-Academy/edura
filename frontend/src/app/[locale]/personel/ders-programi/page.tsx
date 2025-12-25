'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  ArrowLeft, Plus, Calendar, Users, Clock, 
  XCircle, Loader2, BookOpen, ChevronDown
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    dersAd: string;
    sinifAd?: string;
    ogretmenAd?: string;
    aciklama?: string;
  };
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
}

interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  brans?: string;
}

export default function PersonelDersProgrami() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([]);
  const [selectedSinif, setSelectedSinif] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Yeni ders form
  const [newDers, setNewDers] = useState({
    ad: '',
    aciklama: '',
    sinifId: '',
    ogretmenId: '',
    gun: 'Pazartesi',
    baslangicSaati: '09:00',
    bitisSaati: '10:00'
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    
    fetchSiniflar();
    fetchOgretmenler();
    
    // Öğretmen ise kendi programını, değilse ilk sınıfın programını getir
    if (user.role === 'ogretmen') {
      fetchOgretmenProgrami();
    }
  }, []);

  useEffect(() => {
    if (selectedSinif && userRole !== 'ogretmen') {
      fetchSinifProgrami(selectedSinif);
    }
  }, [selectedSinif]);

  const fetchSiniflar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/siniflar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSiniflar(result.data || []);
        if (result.data?.length > 0 && userRole !== 'ogretmen') {
          setSelectedSinif(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Sınıflar yüklenemedi:', error);
    }
  };

  const fetchOgretmenler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/ogretmenler`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setOgretmenler(result.data || []);
      }
    } catch (error) {
      console.error('Öğretmenler yüklenemedi:', error);
    }
  };

  const fetchOgretmenProgrami = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/ogretmen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Program yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSinifProgrami = async (sinifId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/sinif/${sinifId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Program yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDers = async () => {
    if (!newDers.ad || !newDers.sinifId || !newDers.ogretmenId) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/ders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDers)
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewDers({
          ad: '', aciklama: '', sinifId: '', ogretmenId: '',
          gun: 'Pazartesi', baslangicSaati: '09:00', bitisSaati: '10:00'
        });
        
        // Programı yenile
        if (userRole === 'ogretmen') {
          fetchOgretmenProgrami();
        } else if (selectedSinif) {
          fetchSinifProgrami(selectedSinif);
        }
      } else {
        const result = await response.json();
        alert(result.message);
      }
    } catch (error) {
      console.error('Ders ekleme hatası:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event._def);
  };

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const canEdit = userRole === 'mudur' || userRole === 'sekreter';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/personel')} className="p-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Ders Programı</h1>
                <p className="text-xs text-slate-400">
                  {userRole === 'ogretmen' ? 'Haftalık programınız' : 'Sınıf bazlı program'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sınıf Seçici (Öğretmen değilse) */}
              {userRole !== 'ogretmen' && siniflar.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSinif}
                    onChange={(e) => setSelectedSinif(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {siniflar.map(sinif => (
                      <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
              
              {/* Ders Ekle (Müdür/Sekreter) */}
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ders Ekle
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Takvim */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="fc-custom">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                locale="tr"
                firstDay={1}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                dayHeaderFormat={{ weekday: 'long' }}
                weekends={true}
                hiddenDays={[0]} // Pazar gizle
                events={events}
                eventClick={handleEventClick}
                height="auto"
                expandRows={true}
                nowIndicator={true}
                eventContent={(eventInfo) => (
                  <div className="p-1 overflow-hidden h-full">
                    <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
                    <div className="text-[10px] opacity-80 truncate">
                      {eventInfo.timeText}
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Toplam Ders</span>
            </div>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Gün</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {new Set(events.flatMap(e => e.daysOfWeek)).size}
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Haftalık Saat</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {events.reduce((sum, e) => {
                const start = e.startTime.split(':').map(Number);
                const end = e.endTime.split(':').map(Number);
                return sum + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60;
              }, 0).toFixed(0)}
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Sınıf</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {siniflar.find(s => s.id === selectedSinif)?.ad || 'Tüm'}
            </p>
          </div>
        </div>
      </main>

      {/* Ders Ekleme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Yeni Ders Ekle</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ders Adı</label>
                <input
                  type="text"
                  value={newDers.ad}
                  onChange={(e) => setNewDers({...newDers, ad: e.target.value})}
                  placeholder="Örn: Matematik"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Sınıf</label>
                  <select
                    value={newDers.sinifId}
                    onChange={(e) => setNewDers({...newDers, sinifId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seçin</option>
                    {siniflar.map(sinif => (
                      <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Öğretmen</label>
                  <select
                    value={newDers.ogretmenId}
                    onChange={(e) => setNewDers({...newDers, ogretmenId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seçin</option>
                    {ogretmenler.map(o => (
                      <option key={o.id} value={o.id}>{o.ad} {o.soyad}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Gün</label>
                <select
                  value={newDers.gun}
                  onChange={(e) => setNewDers({...newDers, gun: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {gunler.map(gun => (
                    <option key={gun} value={gun}>{gun}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={newDers.baslangicSaati}
                    onChange={(e) => setNewDers({...newDers, baslangicSaati: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={newDers.bitisSaati}
                    onChange={(e) => setNewDers({...newDers, bitisSaati: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  value={newDers.aciklama}
                  onChange={(e) => setNewDers({...newDers, aciklama: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-700">
              <button
                onClick={handleAddDers}
                disabled={processing || !newDers.ad || !newDers.sinifId || !newDers.ogretmenId}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-medium transition-colors"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Ders Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detay Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedEvent.ui?.backgroundColor || '#6366f1' }}
              />
              <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
            </div>
            
            {selectedEvent.extendedProps?.sinifAd && (
              <p className="text-sm text-slate-300 mb-2">
                <Users className="w-4 h-4 inline mr-2 text-slate-400" />
                {selectedEvent.extendedProps.sinifAd}
              </p>
            )}
            
            {selectedEvent.extendedProps?.ogretmenAd && (
              <p className="text-sm text-slate-300 mb-2">
                👨‍🏫 {selectedEvent.extendedProps.ogretmenAd}
              </p>
            )}
            
            {selectedEvent.extendedProps?.aciklama && (
              <p className="text-sm text-slate-400 mt-3 p-3 bg-slate-700/50 rounded-lg">
                {selectedEvent.extendedProps.aciklama}
              </p>
            )}
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* FullCalendar Custom Styles */}
      <style jsx global>{`
        .fc-custom .fc {
          --fc-border-color: rgb(51 65 85 / 0.5);
          --fc-today-bg-color: rgb(99 102 241 / 0.1);
          --fc-now-indicator-color: rgb(99 102 241);
          --fc-page-bg-color: transparent;
        }
        .fc-custom .fc-col-header-cell {
          background: rgb(51 65 85 / 0.3);
          padding: 12px 0;
        }
        .fc-custom .fc-col-header-cell-cushion {
          color: white;
          font-weight: 500;
        }
        .fc-custom .fc-timegrid-slot-label-cushion {
          color: rgb(148 163 184);
          font-size: 12px;
        }
        .fc-custom .fc-timegrid-event {
          border-radius: 8px;
          border-width: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .fc-custom .fc-timegrid-event:hover {
          filter: brightness(1.1);
        }
        .fc-custom .fc-timegrid-event .fc-event-main {
          padding: 4px;
        }
        .fc-custom .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

