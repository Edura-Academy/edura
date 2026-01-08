'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTranslations } from 'next-intl';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  isProcessing?: boolean;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceInput({ onResult, isProcessing = false }: VoiceInputProps) {
  const { speak, ttsEnabled, stop: stopTTS, ttsLangCode } = useAccessibility();
  const t = useTranslations('accessibility');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Tarayıcı desteği kontrolü
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // Recognition oluştur
  const createRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = ttsLangCode; // Seçili dile göre ses tanıma

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      
      // TTS'i durdur (çakışmasın)
      stopTTS();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        onResult(finalTranscript);
        setTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = t('networkError');
      switch (event.error) {
        case 'no-speech':
          errorMessage = t('noSpeechDetected');
          break;
        case 'audio-capture':
          errorMessage = t('microphoneAccessDenied');
          break;
        case 'not-allowed':
          errorMessage = t('microphoneAccessDenied');
          break;
        case 'network':
          errorMessage = t('networkError');
          break;
      }
      
      setError(errorMessage);
      if (ttsEnabled) {
        speak(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [onResult, speak, stopTTS, ttsEnabled, ttsLangCode, t]);

  // Dinlemeyi başlat
  const startListening = useCallback(() => {
    if (!isSupported || isProcessing) return;

    try {
      // Önceki recognition varsa durdur
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = createRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        
        if (ttsEnabled) {
          speak('Dinliyorum. Konuşabilirsiniz.');
        }
      }
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Ses tanıma başlatılamadı.');
    }
  }, [isSupported, isProcessing, createRecognition, speak, ttsEnabled]);

  // Dinlemeyi durdur
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">{t('browserNotSupported')}</p>
        <p className="text-xs mt-1">Chrome / Edge</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mikrofon Butonu */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        onFocus={() => ttsEnabled && speak('Mikrofon butonu. Konuşmak için tıklayın veya Enter tuşuna basın.')}
        className={`
          relative w-16 h-16 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-300'
          }
        `}
        aria-label={isListening ? 'Dinlemeyi durdur' : 'Konuşmaya başla'}
        aria-pressed={isListening}
      >
        {isListening ? (
          // Stop ikonu
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Mikrofon ikonu
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        )}

        {/* Dinleme animasyonu */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <span className="absolute -inset-2 rounded-full border-2 border-red-400 animate-pulse opacity-50" />
          </>
        )}
      </button>

      {/* Durum Metni */}
      <div className="text-center min-h-[60px]">
        {isListening ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center justify-center gap-2">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              Dinleniyor...
            </p>
            {transcript && (
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                "{transcript}"
              </p>
            )}
          </div>
        ) : isProcessing ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            İşleniyor...
          </p>
        ) : error ? (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Konuşmak için mikrofona tıklayın
          </p>
        )}
      </div>

      {/* Yardım Metni */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-[250px]">
        Örnek: "Bekleyen ödevlerim neler?" veya "Son denemede kaç yaptım?"
      </p>
    </div>
  );
}

export default VoiceInput;

