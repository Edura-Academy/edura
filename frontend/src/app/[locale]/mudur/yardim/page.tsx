'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Search, ThumbsUp, ChevronDown } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FAQ {
  id: string;
  soru: string;
  cevap: string;
  kategori: string;
  goruntulemeSayisi: number;
  faydaliSayisi: number;
}

interface GrupluFAQ {
  kategori: string;
  sorular: FAQ[];
}

const KATEGORI_CONFIG: Record<string, { label: string; icon: string }> = {
  GENEL: { label: 'Genel', icon: '📋' },
  HESAP: { label: 'Hesap', icon: '👤' },
  OGRENCI: { label: 'Öğrenci', icon: '🎓' },
  OGRETMEN: { label: 'Öğretmen', icon: '👨‍🏫' },
  DERS: { label: 'Ders', icon: '📚' },
  ODEME: { label: 'Ödeme', icon: '💳' },
  SINAV: { label: 'Sınav', icon: '📝' },
  CANLI_DERS: { label: 'Canlı Ders', icon: '🎥' },
  MESAJLASMA: { label: 'Mesajlaşma', icon: '💬' },
  TEKNIK: { label: 'Teknik', icon: '⚙️' },
};

function YardimContent() {
  const [grupluFaqs, setGrupluFaqs] = useState<GrupluFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/faq`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGrupluFaqs(data.data.grupluFaqs);
      }
    } catch (error) {
      console.error('FAQ alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (faq: FAQ) => {
    if (expandedId === faq.id) {
      setExpandedId(null);
    } else {
      setExpandedId(faq.id);
      // Görüntüleme sayısını artır
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/admin-system/faq/${faq.id}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // Sessizce geç
      }
    }
  };

  const handleHelpful = async (faqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (helpfulIds.has(faqId)) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin-system/faq/${faqId}/helpful`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setHelpfulIds(prev => new Set(prev).add(faqId));
    } catch (error) {
      // Sessizce geç
    }
  };

  const filteredGrupluFaqs = grupluFaqs.map(grup => ({
    ...grup,
    sorular: grup.sorular.filter(faq =>
      faq.soru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.cevap.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(grup => grup.sorular.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-rose-500 to-rose-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/mudur" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Yardım Merkezi</h1>
                <p className="text-xs text-rose-200">Sık sorulan sorular</p>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="pb-8 pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Soru ara..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {filteredGrupluFaqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz soru yok'}
            </h3>
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'Farklı bir arama terimi deneyin.' : 'Yardım soruları burada görünecek.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGrupluFaqs.map((grup) => {
              const config = KATEGORI_CONFIG[grup.kategori] || KATEGORI_CONFIG.GENEL;
              
              return (
                <div key={grup.kategori} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                    <span className="text-lg">{config.icon}</span>
                    <h2 className="font-semibold text-slate-900">{config.label}</h2>
                    <span className="text-xs text-slate-500">({grup.sorular.length})</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {grup.sorular.map((faq) => {
                      const isExpanded = expandedId === faq.id;
                      const isHelpful = helpfulIds.has(faq.id);

                      return (
                        <div key={faq.id}>
                          <div
                            onClick={() => handleExpand(faq)}
                            className="px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="font-medium text-slate-900">{faq.soru}</h3>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="px-4 pb-4 bg-slate-50">
                              <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <p className="text-slate-700 whitespace-pre-wrap">{faq.cevap}</p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                  <span className="text-xs text-slate-400">
                                    {faq.goruntulemeSayisi} görüntülenme • {faq.faydaliSayisi + (isHelpful ? 1 : 0)} kişi faydalı buldu
                                  </span>
                                  <button
                                    onClick={(e) => handleHelpful(faq.id, e)}
                                    disabled={isHelpful}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                      isHelpful 
                                        ? 'bg-green-100 text-green-700 cursor-default' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                                    }`}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                    {isHelpful ? 'Teşekkürler!' : 'Faydalı'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Destek Bağlantısı */}
        <div className="mt-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 text-white text-center">
          <h3 className="font-semibold text-lg mb-2">Aradığınızı bulamadınız mı?</h3>
          <p className="text-teal-100 text-sm mb-4">Destek ekibimiz size yardımcı olmaktan mutluluk duyar.</p>
          <Link
            href="/mudur/destek"
            className="inline-flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-50 transition-colors"
          >
            Destek Talebi Oluştur
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function YardimPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <YardimContent />
    </RoleGuard>
  );
}

