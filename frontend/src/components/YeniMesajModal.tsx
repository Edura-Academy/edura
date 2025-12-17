'use client';

import { useState } from 'react';
import { mockOgretmenler } from '../lib/mockData';

interface YeniMesajModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function YeniMesajModal({ isOpen, onClose }: YeniMesajModalProps) {
  const [aliciId, setAliciId] = useState('');
  const [baslik, setBaslik] = useState('');
  const [mesaj, setMesaj] = useState('');

  if (!isOpen) return null;

  const handleGonder = () => {
    if (!aliciId || !baslik || !mesaj) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    // TODO: API'ye mesaj gönder
    console.log('Mesaj gönderiliyor:', { aliciId, baslik, mesaj });
    
    // Modal'ı kapat ve formu temizle
    setAliciId('');
    setBaslik('');
    setMesaj('');
    onClose();
    
    alert('Mesajınız başarıyla gönderildi!');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div 
          className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span>✉️</span> Yeni Mesaj
            </h2>
            <button
              onClick={onClose}
              className="text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5">
            {/* Alıcı Seçimi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alıcı <span className="text-red-500">*</span>
              </label>
              <select
                value={aliciId}
                onChange={(e) => setAliciId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Öğretmen seçin...</option>
                {mockOgretmenler.map((ogretmen) => (
                  <option key={ogretmen.id} value={ogretmen.id}>
                    {ogretmen.ad} {ogretmen.soyad} - {ogretmen.brans}
                  </option>
                ))}
              </select>
            </div>

            {/* Konu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Konu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Mesaj konusu..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Mesaj İçeriği */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mesaj <span className="text-red-500">*</span>
              </label>
              <textarea
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>

            {/* Bilgi Notu */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>💡 İpucu:</strong> Öğretmeninize soru sormak, ödev hakkında bilgi almak veya 
                herhangi bir konuda iletişime geçmek için bu formu kullanabilirsiniz.
              </p>
            </div>
          </div>

          {/* Butonlar */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleGonder}
              disabled={!aliciId || !baslik || !mesaj}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              📤 Gönder
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors active:scale-95"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
