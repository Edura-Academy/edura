'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function AccessibilityPanel() {
  const {
    // Değerler
    ttsEnabled,
    fontSize,
    highContrast,
    colorBlindMode,
    lineHeight,
    largeCursor,
    reducedMotion,
    dyslexiaFont,
    ttsRate,
    ttsPitch,
    isPanelOpen,
    isSpeaking,
    FONT_SIZE_MIN,
    FONT_SIZE_MAX,
    // Fonksiyonlar
    setTtsEnabled,
    setFontSize,
    setHighContrast,
    setColorBlindMode,
    setLineHeight,
    setLargeCursor,
    setReducedMotion,
    setDyslexiaFont,
    setTtsRate,
    setTtsPitch,
    setIsPanelOpen,
    resetSettings,
    speak,
    stop,
  } = useAccessibility();

  const panelRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Backdrop'a tıklandığında kapat (panel içine değil)
  const handleBackdropClick = (event: React.MouseEvent) => {
    // Sadece backdrop'un kendisine tıklandıysa kapat
    if (event.target === event.currentTarget) {
      setIsPanelOpen(false);
    }
  };

  // Panel içindeki tıklamaların dışarı yayılmasını engelle
  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // ESC tuşu ile kapat
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
        speak('Erişilebilirlik paneli kapatıldı');
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isPanelOpen, setIsPanelOpen, speak]);

  // Panel açıldığında bildir
  useEffect(() => {
    if (isPanelOpen && ttsEnabled) {
      speak('Erişilebilirlik ayarları paneli açıldı. Ayarlarınızı düzenleyebilirsiniz.');
    }
  }, [isPanelOpen, ttsEnabled, speak]);

  if (!isPanelOpen) return null;

  // Slider'da mousedown olduğunda propagation'ı durdur
  const handleSliderInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
  };

  // Toggle switch component - DIV tabanlı (button değil)
  const ToggleSwitch = ({ 
    enabled, 
    onToggle, 
    label, 
    activeColor = 'bg-purple-500' 
  }: { 
    enabled: boolean; 
    onToggle: () => void; 
    label: string;
    activeColor?: string;
  }) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      onFocus={() => speak(`${label} ${enabled ? 'açık' : 'kapalı'}. Değiştirmek için Enter tuşuna basın.`)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${
        enabled ? activeColor : 'bg-gray-600'
      }`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      tabIndex={0}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
          enabled ? 'translate-x-6' : ''
        }`}
      />
    </div>
  );

  // Font boyutu için slider progress hesaplama
  const currentFontSize = typeof fontSize === 'number' ? fontSize : 16;
  const fontSizeProgress = ((currentFontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;
  const ttsRateProgress = ((ttsRate - 0.5) / 1.5) * 100;
  const ttsPitchProgress = ((ttsPitch - 0.5) / 1.5) * 100;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden border border-gray-700/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        onClick={handlePanelClick}
        onMouseDown={handlePanelClick}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] px-6 py-5 border-b border-gray-700/50">
          <div className="flex flex-col items-center w-full">
            {/* İkon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
              </svg>
            </div>
            {/* Başlık */}
            <h2 id="a11y-panel-title" className="text-lg font-semibold text-white">
              Erişilebilirlik Ayarları
            </h2>
            <p className="text-sm text-gray-400 mt-1">Görme, işitme ve motor desteği</p>
          </div>
          
          {/* Kapatma butonu */}
          <button
            onClick={() => setIsPanelOpen(false)}
            onFocus={() => speak('Paneli kapat butonu')}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Paneli kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5 pb-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          
          {/* 🔊 Sesli Okuma Bölümü */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-4">
            {/* Header - div kullanıyoruz, button değil */}
            <div 
              className="flex items-center justify-between w-full cursor-pointer"
              onClick={() => setActiveSection(activeSection === 'tts' ? null : 'tts')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSection(activeSection === 'tts' ? null : 'tts');
                }
              }}
            >
              <div className="flex items-center gap-3 text-gray-200 font-medium">
                <span className="text-xl">🔊</span>
                <span>Sesli Okuma</span>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  enabled={ttsEnabled}
                  onToggle={() => {
                    setTtsEnabled(!ttsEnabled);
                    if (!ttsEnabled) {
                      setTimeout(() => speak('Sesli okuma açıldı'), 100);
                    }
                  }}
                  label="Sesli okuma"
                />
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'tts' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {activeSection === 'tts' && ttsEnabled && (
              <div className="space-y-4 pt-2 border-t border-gray-700/50">
                {/* Konuşma Hızı */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Konuşma Hızı</span>
                    <span className="text-sm font-medium text-purple-400">{ttsRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    onFocus={() => speak(`Konuşma hızı: ${ttsRate.toFixed(1)} kat`)}
                    onMouseDown={handleSliderInteraction}
                    onTouchStart={handleSliderInteraction}
                    className="a11y-slider w-full"
                    style={{ '--slider-progress': `${ttsRateProgress}%` } as React.CSSProperties}
                    aria-label="Konuşma hızı"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Yavaş</span>
                    <span>Hızlı</span>
                  </div>
                </div>

                {/* Konuşma Tonu */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Konuşma Tonu</span>
                    <span className="text-sm font-medium text-purple-400">{ttsPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                    onFocus={() => speak(`Konuşma tonu: ${ttsPitch.toFixed(1)}`)}
                    onMouseDown={handleSliderInteraction}
                    onTouchStart={handleSliderInteraction}
                    className="a11y-slider w-full"
                    style={{ '--slider-progress': `${ttsPitchProgress}%` } as React.CSSProperties}
                    aria-label="Konuşma tonu"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Kalın</span>
                    <span>İnce</span>
                  </div>
                </div>

                {/* Test butonu */}
                <button
                  onClick={() => speak('Bu bir test mesajıdır. Ses ayarlarınızı kontrol edebilirsiniz.', true)}
                  className="w-full py-2 px-4 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-sm transition-colors"
                >
                  🔈 Sesi Test Et
                </button>
              </div>
            )}

            {isSpeaking && (
              <div className="flex items-center gap-2 text-sm text-purple-400 pt-2">
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-current rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                <span>Konuşuyor...</span>
                <button onClick={stop} className="text-red-400 hover:text-red-300 ml-auto text-xs">Durdur</button>
              </div>
            )}
          </div>

          {/* 🔍 Yazı Boyutu - Slider */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3 text-gray-200 font-medium">
              <span className="text-xl">🔍</span>
              <span>Yazı Boyutu</span>
            </div>
            
            {/* Slider ile hassas kontrol */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Boyut</span>
                <span className="text-lg font-bold text-purple-400">{currentFontSize}px</span>
              </div>
              <input
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                step="1"
                value={currentFontSize}
                onChange={(e) => {
                  setFontSize(parseInt(e.target.value));
                }}
                onMouseUp={() => speak(`Yazı boyutu ${currentFontSize} piksel`)}
                onMouseDown={handleSliderInteraction}
                onTouchStart={handleSliderInteraction}
                onFocus={() => speak(`Yazı boyutu slider'ı. Mevcut değer: ${currentFontSize} piksel`)}
                className="a11y-slider w-full"
                style={{ '--slider-progress': `${fontSizeProgress}%` } as React.CSSProperties}
                aria-label="Yazı boyutu"
                aria-valuemin={FONT_SIZE_MIN}
                aria-valuemax={FONT_SIZE_MAX}
                aria-valuenow={currentFontSize}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{FONT_SIZE_MIN}px</span>
                <span>{FONT_SIZE_MAX}px</span>
              </div>

              {/* Önizleme */}
              <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                <p className="text-gray-300" style={{ fontSize: `${currentFontSize}px` }}>
                  Örnek metin - Bu yazı {currentFontSize}px boyutunda görünüyor.
                </p>
              </div>
            </div>
          </div>

          {/* 👁️ Renk Körlüğü Modu */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-200 font-medium">
              <span className="text-xl">👁️</span>
              <span>Renk Körlüğü Modu</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'none', label: 'Normal', desc: 'Varsayılan görünüm', color: 'from-gray-500 to-gray-600' },
                { value: 'protanopia', label: 'Protanopi', desc: 'Kırmızı körlüğü', color: 'from-yellow-500 to-orange-500' },
                { value: 'deuteranopia', label: 'Deuteranopi', desc: 'Yeşil körlüğü', color: 'from-cyan-500 to-blue-500' },
                { value: 'tritanopia', label: 'Tritanopi', desc: 'Mavi-sarı körlüğü', color: 'from-pink-500 to-purple-500' },
                { value: 'monochromacy', label: 'Akromatopsi', desc: 'Tam renk körlüğü', color: 'from-gray-400 to-gray-500' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => {
                    setColorBlindMode(mode.value as typeof colorBlindMode);
                    speak(`Renk modu: ${mode.label}`);
                  }}
                  onFocus={() => speak(`${mode.label} - ${mode.desc}${colorBlindMode === mode.value ? ', seçili' : ''}`)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    colorBlindMode === mode.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                  aria-pressed={colorBlindMode === mode.value}
                >
                  <div className={`w-8 h-2 rounded-full bg-gradient-to-r ${mode.color} mb-2`} />
                  <span className={`block text-sm font-medium ${colorBlindMode === mode.value ? 'text-purple-300' : 'text-gray-300'}`}>
                    {mode.label}
                  </span>
                  <span className="block text-xs text-gray-500">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 🎨 Görsel Ayarlar */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-200 font-medium mb-2">
              <span className="text-xl">🎨</span>
              <span>Görsel Ayarlar</span>
            </div>

            {/* Yüksek Kontrast */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">◐</span>
                <span className="text-gray-300 text-sm">Yüksek Kontrast</span>
              </div>
              <ToggleSwitch
                enabled={highContrast}
                onToggle={() => {
                  setHighContrast(!highContrast);
                  speak(`Yüksek kontrast ${!highContrast ? 'açıldı' : 'kapatıldı'}`);
                }}
                label="Yüksek kontrast"
                activeColor="bg-yellow-500"
              />
            </div>

            {/* Büyük İmleç */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🖱️</span>
                <span className="text-gray-300 text-sm">Büyük İmleç</span>
              </div>
              <ToggleSwitch
                enabled={largeCursor}
                onToggle={() => {
                  setLargeCursor(!largeCursor);
                  speak(`Büyük imleç ${!largeCursor ? 'açıldı' : 'kapatıldı'}`);
                }}
                label="Büyük imleç"
                activeColor="bg-blue-500"
              />
            </div>

            {/* Hareket Azaltma */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-400">⏸️</span>
                <span className="text-gray-300 text-sm">Hareket Azaltma</span>
              </div>
              <ToggleSwitch
                enabled={reducedMotion}
                onToggle={() => {
                  setReducedMotion(!reducedMotion);
                  speak(`Hareket azaltma ${!reducedMotion ? 'açıldı' : 'kapatıldı'}`);
                }}
                label="Hareket azaltma"
                activeColor="bg-green-500"
              />
            </div>

            {/* Disleksi Dostu Font */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">Aa</span>
                <span className="text-gray-300 text-sm">Disleksi Dostu Font</span>
              </div>
              <ToggleSwitch
                enabled={dyslexiaFont}
                onToggle={() => {
                  setDyslexiaFont(!dyslexiaFont);
                  speak(`Disleksi dostu font ${!dyslexiaFont ? 'açıldı' : 'kapatıldı'}`);
                }}
                label="Disleksi dostu font"
                activeColor="bg-orange-500"
              />
            </div>
          </div>

          {/* 📏 Satır Aralığı */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-200 font-medium">
              <span className="text-xl">📏</span>
              <span>Satır Aralığı</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: 'normal', label: 'Normal', height: '1.5' },
                { value: 'medium', label: 'Geniş', height: '1.75' },
                { value: 'large', label: 'Çok Geniş', height: '2' }
              ] as const).map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setLineHeight(item.value);
                    speak(`Satır aralığı ${item.label} olarak ayarlandı`);
                  }}
                  onFocus={() => speak(`${item.label} satır aralığı${lineHeight === item.value ? ', seçili' : ''}`)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm transition-all ${
                    lineHeight === item.value
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  aria-pressed={lineHeight === item.value}
                >
                  <div className="flex flex-col items-center gap-0.5 mb-1">
                    <div className="w-8 h-0.5 bg-current rounded" />
                    <div className="w-8 h-0.5 bg-current rounded" style={{ marginTop: item.value === 'normal' ? '2px' : item.value === 'medium' ? '4px' : '6px' }} />
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ⌨️ Klavye Kısayolları */}
          <div className="bg-gray-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-200 font-medium">
              <span className="text-xl">⌨️</span>
              <span>Klavye Kısayolları</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { key: 'Alt + S', desc: 'Sesli okuma' },
                { key: 'Alt + A', desc: 'Bu panel' },
                { key: 'Alt + C', desc: 'Yüksek kontrast' },
                { key: 'Alt + +', desc: 'Yazı büyüt' },
                { key: 'Alt + -', desc: 'Yazı küçült' },
                { key: 'Esc', desc: 'Paneli kapat' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex justify-between items-center p-2 bg-gray-900/30 rounded-lg">
                  <span className="text-gray-400">{shortcut.desc}</span>
                  <kbd className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Sıfırla butonu */}
          <button
            onClick={() => {
              resetSettings();
              speak('Tüm erişilebilirlik ayarları varsayılana sıfırlandı');
            }}
            onFocus={() => speak('Tüm ayarları sıfırla butonu')}
            className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all font-medium border border-red-500/30 flex items-center justify-center gap-2 mb-2"
          >
            <span>🔄</span>
            <span>Varsayılana Sıfırla</span>
          </button>
        </div>
      </div>

      {/* SVG Filtreler - Renk Körlüğü için */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Protanopia filtresi */}
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          
          {/* Deuteranopia filtresi */}
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          
          {/* Tritanopia filtresi */}
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default AccessibilityPanel;
