'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ArrowLeft, Calendar, Clock, BookOpen, User } from 'lucide-react';

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

export default function OgrenciDersProgrami() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ders-programi/ogrenci`, {
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

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event._def);
  };

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  
  // Günlere göre grupla (liste görünümü için)
  const grupluDersler = gunler.map(gun => ({
    gun,
    gunNo: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].indexOf(gun),
    dersler: events
      .filter(e => e.daysOfWeek.includes(['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].indexOf(gun)))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  })).filter(g => g.dersler.length > 0);

  // Bugünün dersleri
  const bugun = new Date().getDay();
  const bugunDersler = events.filter(e => e.daysOfWeek.includes(bugun));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/ogrenci')} className="p-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Ders Programım</h1>
                <p className="text-xs text-slate-400">Haftalık program</p>
              </div>
            </div>
            
            {/* Görünüm Seçici */}
            <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Takvim
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bugünün Dersleri */}
        {bugunDersler.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
            <h2 className="text-white font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Bugünün Dersleri
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {bugunDersler.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(ders => (
                <div 
                  key={ders.id}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-sm"
                  style={{ backgroundColor: ders.backgroundColor }}
                >
                  <p className="font-medium">{ders.title}</p>
                  <p className="text-xs opacity-80">{ders.startTime} - {ders.endTime}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Takvim Görünümü */}
        {viewMode === 'calendar' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
            <div className="fc-ogrenci">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                locale="tr"
                firstDay={1}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                dayHeaderFormat={{ weekday: 'short' }}
                weekends={true}
                hiddenDays={[0]}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                nowIndicator={true}
                eventContent={(eventInfo) => (
                  <div className="p-1 overflow-hidden h-full">
                    <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Liste Görünümü */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {grupluDersler.map(grup => (
              <div key={grup.gun} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-700/30 border-b border-slate-700/50">
                  <h3 className="text-white font-medium">{grup.gun}</h3>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {grup.dersler.map(ders => (
                    <div key={ders.id} className="p-4 flex items-center gap-4">
                      <div 
                        className="w-2 h-12 rounded-full"
                        style={{ backgroundColor: ders.backgroundColor }}
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{ders.title}</p>
                        {ders.extendedProps.ogretmenAd && (
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ders.extendedProps.ogretmenAd}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{ders.startTime}</p>
                        <p className="text-sm text-slate-400">{ders.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {grupluDersler.length === 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Henüz ders kaydınız bulunmuyor</p>
              </div>
            )}
          </div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
            <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{events.length}</p>
            <p className="text-xs text-slate-400">Ders</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
            <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{grupluDersler.length}</p>
            <p className="text-xs text-slate-400">Gün</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">
              {events.reduce((sum, e) => {
                const start = e.startTime.split(':').map(Number);
                const end = e.endTime.split(':').map(Number);
                return sum + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60;
              }, 0).toFixed(0)}
            </p>
            <p className="text-xs text-slate-400">Saat/Hafta</p>
          </div>
        </div>
      </main>

      {/* Event Detay Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedEvent.ui?.backgroundColor || '#3b82f6' }}
              />
              <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
            </div>
            
            {selectedEvent.extendedProps?.ogretmenAd && (
              <p className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {selectedEvent.extendedProps.ogretmenAd}
              </p>
            )}
            
            {selectedEvent.extendedProps?.aciklama && (
              <p className="text-sm text-slate-400 mt-3 p-3 bg-slate-700/50 rounded-lg">
                {selectedEvent.extendedProps.aciklama}
              </p>
            )}
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .fc-ogrenci .fc {
          --fc-border-color: rgb(51 65 85 / 0.5);
          --fc-today-bg-color: rgb(59 130 246 / 0.1);
          --fc-now-indicator-color: rgb(59 130 246);
          --fc-page-bg-color: transparent;
        }
        .fc-ogrenci .fc-col-header-cell {
          background: rgb(51 65 85 / 0.3);
          padding: 8px 0;
        }
        .fc-ogrenci .fc-col-header-cell-cushion {
          color: white;
          font-weight: 500;
          font-size: 12px;
        }
        .fc-ogrenci .fc-timegrid-slot-label-cushion {
          color: rgb(148 163 184);
          font-size: 11px;
        }
        .fc-ogrenci .fc-timegrid-event {
          border-radius: 6px;
          border-width: 0;
        }
        .fc-ogrenci .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

