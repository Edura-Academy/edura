'use client';

import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useEffect, useState, useCallback } from 'react';
import { AccessibilityPanel } from './AccessibilityPanel';

export function AccessibilityToggle() {
  const {
    ttsEnabled,
    setTtsEnabled,
    isSpeaking,
    speak,
    isPanelOpen,
    setIsPanelOpen,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
  } = useAccessibility();

  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Klavye kısayolları
  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Alt tuşu ile kombinasyonlar
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case 's': // Alt + S: Sesli okuma toggle
          e.preventDefault();
          const newTtsState = !ttsEnabled;
          setTtsEnabled(newTtsState);
          if (newTtsState) {
            setTimeout(() => speak('Sesli okuma açıldı', true), 100);
          }
          break;

        case 'a': // Alt + A: Panel toggle
          e.preventDefault();
          setIsPanelOpen(!isPanelOpen);
          break;

        case 'c': // Alt + C: Yüksek kontrast toggle
          e.preventDefault();
          setHighContrast(!highContrast);
          speak(highContrast ? 'Yüksek kontrast kapatıldı' : 'Yüksek kontrast açıldı');
          break;

        case '+':
        case '=': // Alt + +: Yazı büyüt (2px artır)
          e.preventDefault();
          const currentSizePlus = typeof fontSize === 'number' ? fontSize : 16;
          const newSizePlus = Math.min(currentSizePlus + 2, 28);
          setFontSize(newSizePlus);
          speak(`Yazı boyutu: ${newSizePlus} piksel`);
          break;

        case '-': // Alt + -: Yazı küçült (2px azalt)
          e.preventDefault();
          const currentSizeMinus = typeof fontSize === 'number' ? fontSize : 16;
          const newSizeMinus = Math.max(currentSizeMinus - 2, 12);
          setFontSize(newSizeMinus);
          speak(`Yazı boyutu: ${newSizeMinus} piksel`);
          break;
      }
    }
  }, [ttsEnabled, setTtsEnabled, speak, isPanelOpen, setIsPanelOpen, highContrast, setHighContrast, fontSize, setFontSize]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Toggle değiştiğinde sesli bildirim
  const handleTtsToggle = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    
    if (newState) {
      setTimeout(() => {
        speak('Sesli okuma açıldı. Artık ekrandaki öğeleri sesli dinleyebilirsiniz.', true);
      }, 100);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Sağ alt köşe - Dikey düzende erişilebilirlik butonları */}
      <div 
        className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-3"
        onMouseEnter={() => {
          setIsExpanded(true);
          if (ttsEnabled) {
            speak('Erişilebilirlik kontrolleri. Sesli okuma ' + (ttsEnabled ? 'açık' : 'kapalı'));
          }
        }}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Sesli okuma toggle butonu */}
        <div className="relative group">
          <button
            onClick={handleTtsToggle}
            onFocus={() => {
              if (ttsEnabled) {
                speak('Sesli okuma düğmesi. ' + (ttsEnabled ? 'Açık' : 'Kapalı') + '. Değiştirmek için Enter tuşuna basın.');
              }
            }}
            className={`
              relative flex items-center justify-center
              w-12 h-12 rounded-full
              transition-all duration-300 ease-in-out
              shadow-lg hover:shadow-xl hover:scale-110
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${ttsEnabled 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 focus:ring-green-500 text-white' 
                : 'bg-white dark:bg-slate-800 focus:ring-gray-400 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'
              }
            `}
            aria-label={ttsEnabled ? 'Sesli okumayı kapat' : 'Sesli okumayı aç'}
            aria-pressed={ttsEnabled}
            tabIndex={0}
            title="Alt + S"
          >
            {/* Ses ikonu */}
            {ttsEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}

            {/* Konuşuyor animasyonu */}
            {isSpeaking && ttsEnabled && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </button>

          {/* Tooltip - Sesli Okuma */}
          <div className={`
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            transition-all duration-200
            ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
            ${ttsEnabled 
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }
          `}>
            {ttsEnabled ? '🔊 Sesli Okuma Açık' : '🔇 Sesli Okuma Kapalı'}
          </div>
        </div>

        {/* Erişilebilirlik panel butonu */}
        <div className="relative group">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            onFocus={() => {
              if (ttsEnabled) {
                speak('Erişilebilirlik ayarları panelini açmak için Enter tuşuna basın');
              }
            }}
            className="
              relative flex items-center justify-center
              w-12 h-12 rounded-full
              transition-all duration-300 ease-in-out
              shadow-lg hover:shadow-xl hover:scale-110
              focus:outline-none focus:ring-2 focus:ring-offset-2
              bg-gradient-to-br from-purple-500 to-indigo-600 
              focus:ring-purple-500 text-white
            "
            aria-label="Erişilebilirlik ayarlarını aç"
            aria-haspopup="dialog"
            aria-expanded={isPanelOpen}
            tabIndex={0}
            title="Alt + A"
          >
            {/* Erişilebilirlik ikonu */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
            </svg>
          </button>

          {/* Tooltip - Erişilebilirlik */}
          <div className={`
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300
            transition-all duration-200
            ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
          `}>
            ♿ Erişilebilirlik Ayarları
          </div>
        </div>
      </div>

      {/* Erişilebilirlik Paneli */}
      <AccessibilityPanel />
    </>
  );
}

export default AccessibilityToggle;
