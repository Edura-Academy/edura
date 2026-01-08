'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useLocale } from 'next-intl';

// Yazı boyutu tipleri - Artık sayısal değer (12-28 arası)
type FontSizePreset = 'small' | 'medium' | 'large';

// Renk körlüğü modları
type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';

// Satır aralığı
type LineHeight = 'normal' | 'medium' | 'large';

// Yazı boyutu limitleri
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_DEFAULT = 16;

interface AccessibilitySettings {
  // TTS
  ttsEnabled: boolean;
  
  // Görsel ayarlar
  fontSize: number; // Artık sayısal değer (12-28)
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  lineHeight: LineHeight;
  largeCursor: boolean;
  reducedMotion: boolean; // Hareket azaltma
  dyslexiaFont: boolean; // Disleksi dostu font
  
  // Sesli asistan
  voiceAssistantEnabled: boolean;
  ttsRate: number; // Konuşma hızı (0.5 - 2)
  ttsPitch: number; // Konuşma tonu (0.5 - 2)
}

interface AccessibilityContextType extends AccessibilitySettings {
  // TTS fonksiyonları
  setTtsEnabled: (enabled: boolean) => void;
  speak: (text: string, priority?: boolean) => void;
  stop: () => void;
  isSpeaking: boolean;
  
  // Görsel ayar fonksiyonları
  setFontSize: (size: number) => void;
  setFontSizePreset: (preset: FontSizePreset) => void;
  getFontSizePreset: () => FontSizePreset;
  setHighContrast: (enabled: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setLineHeight: (height: LineHeight) => void;
  setLargeCursor: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setDyslexiaFont: (enabled: boolean) => void;
  
  // Sesli asistan
  setVoiceAssistantEnabled: (enabled: boolean) => void;
  setTtsRate: (rate: number) => void;
  setTtsPitch: (pitch: number) => void;
  
  // Panel kontrolü
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  
  // Tüm ayarları sıfırla
  resetSettings: () => void;
  
  // Dil bilgisi
  currentLocale: string;
  
  // Sabitler
  FONT_SIZE_MIN: number;
  FONT_SIZE_MAX: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'edura-accessibility-settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  ttsEnabled: true,
  fontSize: FONT_SIZE_DEFAULT,
  highContrast: false,
  colorBlindMode: 'none',
  lineHeight: 'normal',
  largeCursor: false,
  reducedMotion: false,
  dyslexiaFont: false,
  voiceAssistantEnabled: false,
  ttsRate: 0.9,
  ttsPitch: 1,
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const currentLocale = useLocale();
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // İlk yükleme - localStorage'dan ayarları al
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        
        // Eski string fontSize değerlerini number'a çevir
        let fontSize = parsed.fontSize;
        if (typeof fontSize === 'string') {
          // Eski format: 'small' | 'medium' | 'large'
          const fontSizeMap: Record<string, number> = {
            'small': 14,
            'medium': 16,
            'large': 22
          };
          fontSize = fontSizeMap[fontSize] || FONT_SIZE_DEFAULT;
        } else if (typeof fontSize !== 'number' || isNaN(fontSize)) {
          fontSize = FONT_SIZE_DEFAULT;
        }
        
        // Yeni alanlar için varsayılan değerler
        const migratedSettings: AccessibilitySettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          fontSize: Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, fontSize)),
          ttsRate: typeof parsed.ttsRate === 'number' ? parsed.ttsRate : DEFAULT_SETTINGS.ttsRate,
          ttsPitch: typeof parsed.ttsPitch === 'number' ? parsed.ttsPitch : DEFAULT_SETTINGS.ttsPitch,
          reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
          dyslexiaFont: typeof parsed.dyslexiaFont === 'boolean' ? parsed.dyslexiaFont : DEFAULT_SETTINGS.dyslexiaFont,
        };
        
        setSettings(migratedSettings);
        
        // Migrated ayarları kaydet
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedSettings));
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
      // Hata durumunda localStorage'ı temizle
      localStorage.removeItem(STORAGE_KEY);
    }
    
    setMounted(true);
  }, []);

  // Ayarları kaydet
  const saveSettings = useCallback((newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  }, []);

  // CSS değişkenlerini uygula
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Yazı boyutu - Dinamik slider değeri
    root.style.setProperty('--a11y-font-size', `${settings.fontSize}px`);
    
    // Font size preset class'ları için
    root.classList.remove('a11y-font-small', 'a11y-font-medium', 'a11y-font-large');
    if (settings.fontSize <= 14) {
      root.classList.add('a11y-font-small');
    } else if (settings.fontSize <= 18) {
      root.classList.add('a11y-font-medium');
    } else {
      root.classList.add('a11y-font-large');
    }
    
    // Satır aralığı
    const lineHeights = { normal: '1.5', medium: '1.75', large: '2' };
    root.style.setProperty('--a11y-line-height', lineHeights[settings.lineHeight]);
    root.classList.remove('a11y-line-normal', 'a11y-line-medium', 'a11y-line-large');
    root.classList.add(`a11y-line-${settings.lineHeight}`);
    
    // Yüksek kontrast
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    
    // Renk körlüğü modu
    root.classList.remove('a11y-colorblind-protanopia', 'a11y-colorblind-deuteranopia', 'a11y-colorblind-tritanopia', 'a11y-colorblind-monochromacy');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(`a11y-colorblind-${settings.colorBlindMode}`);
    }
    
    // Büyük imleç
    root.classList.toggle('a11y-large-cursor', settings.largeCursor);
    
    // Hareket azaltma
    root.classList.toggle('a11y-reduced-motion', settings.reducedMotion);
    
    // Disleksi dostu font
    root.classList.toggle('a11y-dyslexia-font', settings.dyslexiaFont);
    
  }, [mounted, settings]);

  // TTS toggle
  const setTtsEnabled = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, ttsEnabled: enabled });
    if (!enabled && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [settings, saveSettings]);

  // Görsel ayar fonksiyonları
  const setFontSize = useCallback((size: number) => {
    // Limitleri kontrol et
    const clampedSize = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size));
    saveSettings({ ...settings, fontSize: clampedSize });
  }, [settings, saveSettings]);

  // Preset fonksiyonu (küçük, orta, büyük butonları için)
  const setFontSizePreset = useCallback((preset: FontSizePreset) => {
    const presetValues = { small: 14, medium: 16, large: 22 };
    saveSettings({ ...settings, fontSize: presetValues[preset] });
  }, [settings, saveSettings]);

  // Mevcut font boyutundan preset hesapla
  const getFontSizePreset = useCallback((): FontSizePreset => {
    if (settings.fontSize <= 14) return 'small';
    if (settings.fontSize <= 18) return 'medium';
    return 'large';
  }, [settings.fontSize]);

  const setHighContrast = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, highContrast: enabled });
  }, [settings, saveSettings]);

  const setColorBlindMode = useCallback((mode: ColorBlindMode) => {
    saveSettings({ ...settings, colorBlindMode: mode });
  }, [settings, saveSettings]);

  const setLineHeight = useCallback((height: LineHeight) => {
    saveSettings({ ...settings, lineHeight: height });
  }, [settings, saveSettings]);

  const setLargeCursor = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, largeCursor: enabled });
  }, [settings, saveSettings]);

  const setReducedMotion = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, reducedMotion: enabled });
  }, [settings, saveSettings]);

  const setDyslexiaFont = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, dyslexiaFont: enabled });
  }, [settings, saveSettings]);

  const setVoiceAssistantEnabled = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, voiceAssistantEnabled: enabled });
  }, [settings, saveSettings]);

  const setTtsRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, rate));
    saveSettings({ ...settings, ttsRate: clampedRate });
  }, [settings, saveSettings]);

  const setTtsPitch = useCallback((pitch: number) => {
    const clampedPitch = Math.max(0.5, Math.min(2, pitch));
    saveSettings({ ...settings, ttsPitch: clampedPitch });
  }, [settings, saveSettings]);

  // Tüm ayarları sıfırla
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Dil kodunu tarayıcı TTS formatına çevir
  const getLanguageCode = useCallback((locale: string): string => {
    const languageMap: Record<string, string> = {
      'tr': 'tr-TR',
      'en': 'en-US',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'ar': 'ar-SA',
    };
    return languageMap[locale] || 'tr-TR';
  }, []);

  // Metin okuma fonksiyonu - Seçilen dile göre okuma yapar
  const speak = useCallback((text: string, priority: boolean = false) => {
    if (!settings.ttsEnabled || !text || typeof window === 'undefined') return;
    
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn('Web Speech API desteklenmiyor');
      return;
    }

    if (priority) {
      synth.cancel();
    } else if (synth.speaking && synth.pending) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = getLanguageCode(currentLocale);
    utterance.lang = langCode;
    utterance.rate = settings.ttsRate;
    utterance.pitch = settings.ttsPitch;
    utterance.volume = 1;

    // Seçilen dile uygun ses bul
    const voices = synth.getVoices();
    const langPrefix = currentLocale.substring(0, 2);
    const matchingVoice = voices.find(voice => voice.lang.startsWith(langPrefix));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [settings.ttsEnabled, settings.ttsRate, settings.ttsPitch, currentLocale, getLanguageCode]);

  // Konuşmayı durdur
  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const contextValue: AccessibilityContextType = {
    ...settings,
    setTtsEnabled,
    speak,
    stop,
    isSpeaking,
    setFontSize,
    setFontSizePreset,
    getFontSizePreset,
    setHighContrast,
    setColorBlindMode,
    setLineHeight,
    setLargeCursor,
    setReducedMotion,
    setDyslexiaFont,
    setVoiceAssistantEnabled,
    setTtsRate,
    setTtsPitch,
    isPanelOpen,
    setIsPanelOpen,
    resetSettings,
    currentLocale,
    FONT_SIZE_MIN,
    FONT_SIZE_MAX,
  };

  // SSR için boş provider
  if (!mounted) {
    return (
      <AccessibilityContext.Provider
        value={{
          ...DEFAULT_SETTINGS,
          setTtsEnabled: () => {},
          speak: () => {},
          stop: () => {},
          isSpeaking: false,
          setFontSize: () => {},
          setFontSizePreset: () => {},
          getFontSizePreset: () => 'medium',
          setHighContrast: () => {},
          setColorBlindMode: () => {},
          setLineHeight: () => {},
          setLargeCursor: () => {},
          setReducedMotion: () => {},
          setDyslexiaFont: () => {},
          setVoiceAssistantEnabled: () => {},
          setTtsRate: () => {},
          setTtsPitch: () => {},
          isPanelOpen: false,
          setIsPanelOpen: () => {},
          resetSettings: () => {},
          currentLocale,
          FONT_SIZE_MIN,
          FONT_SIZE_MAX,
        }}
      >
        {children}
      </AccessibilityContext.Provider>
    );
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Yardımcı hook - element için TTS event handlers
export function useTTSHandlers(text: string) {
  const { speak, stop, ttsEnabled } = useAccessibility();

  const handlers = {
    onFocus: () => {
      if (ttsEnabled && text) {
        speak(text);
      }
    },
    onBlur: () => {
      stop();
    },
    onMouseEnter: () => {
      if (ttsEnabled && text) {
        speak(text);
      }
    },
    onMouseLeave: () => {
      stop();
    },
  };

  return handlers;
}

/**
 * Hover TTS Hook - Mouse üzerindeyken okur, çekilince durur
 * 
 * @example
 * const ttsProps = useHoverTTS("Devamsızlık: 2 gün");
 * return <div {...ttsProps}>Devamsızlık: 2</div>
 */
export function useHoverTTS(text: string, options?: { readOnFocus?: boolean }) {
  const { speak, stop, ttsEnabled, isSpeaking } = useAccessibility();
  const { readOnFocus = true } = options || {};
  const isHoveringRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    if (ttsEnabled && text) {
      speak(text, true); // priority: true - önceki sesi kes ve bu metni oku
    }
  }, [ttsEnabled, text, speak]);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    stop(); // Mouse çekildiğinde sesi hemen kes
  }, [stop]);

  const handleFocus = useCallback(() => {
    if (readOnFocus && ttsEnabled && text) {
      speak(text, true);
    }
  }, [readOnFocus, ttsEnabled, text, speak]);

  const handleBlur = useCallback(() => {
    if (!isHoveringRef.current) {
      stop();
    }
  }, [stop]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-label': text,
    tabIndex: readOnFocus ? 0 : undefined,
    role: 'region',
  };
}
