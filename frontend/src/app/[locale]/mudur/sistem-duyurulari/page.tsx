'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Megaphone, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  yayinTarihi: string;
  bitisTarihi?: string;
  okundu: boolean;
}

function SistemDuyurulariContent() {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDuyurular();
  }, []);

  const fetchDuyurular = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/duyurular/mudur`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDuyurular(data.data.duyurular);
      }
    } catch (error) {
      console.error('Duyurular alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin-system/duyurular/${id}/okundu`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDuyurular(prev => prev.map(d => d.id === id ? { ...d, okundu: true } : d));
    } catch (error) {
      console.error('Okundu işaretlenemedi:', error);
    }
  };

  const handleExpand = (duyuru: Duyuru) => {
    if (expandedId === duyuru.id) {
      setExpandedId(null);
    } else {
      setExpandedId(duyuru.id);
      if (!duyuru.okundu) {
        markAsRead(duyuru.id);
      }
    }
  };

  const getOncelikConfig = (oncelik: string) => {
    switch (oncelik) {
      case 'ACIL':
        return { 
          bg: 'bg-red-50 border-red-200', 
          badge: 'bg-red-100 text-red-700',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      case 'ONEMLI':
        return { 
          bg: 'bg-amber-50 border-amber-200', 
          badge: 'bg-amber-100 text-amber-700',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      default:
        return { 
          bg: 'bg-white border-slate-200', 
          badge: 'bg-slate-100 text-slate-700',
          icon: Megaphone,
          iconColor: 'text-slate-600'
        };
    }
  };

  const okunmamisSayisi = duyurular.filter(d => !d.okundu).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Sistem Duyuruları</h1>
                <p className="text-xs text-slate-500">Edura&apos;dan önemli bildirimler</p>
              </div>
            </div>
            {okunmamisSayisi > 0 && (
              <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {okunmamisSayisi} okunmamış
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {duyurular.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">Henüz duyuru yok</h3>
            <p className="text-slate-500 text-sm">Sistem duyuruları burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {duyurular.map((duyuru) => {
              const config = getOncelikConfig(duyuru.oncelik);
              const Icon = config.icon;
              const isExpanded = expandedId === duyuru.id;

              return (
                <div
                  key={duyuru.id}
                  className={`rounded-xl border transition-all ${config.bg} ${!duyuru.okundu ? 'ring-2 ring-purple-300' : ''}`}
                >
                  <div
                    onClick={() => handleExpand(duyuru)}
                    className="p-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${duyuru.oncelik === 'ACIL' ? 'bg-red-100' : duyuru.oncelik === 'ONEMLI' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                            {duyuru.oncelik}
                          </span>
                          {!duyuru.okundu && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          )}
                          {duyuru.okundu && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900">{duyuru.baslik}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(duyuru.yayinTarihi).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="pl-14">
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <p className="text-slate-700 whitespace-pre-wrap">{duyuru.icerik}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SistemDuyurulariPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <SistemDuyurulariContent />
    </RoleGuard>
  );
}

