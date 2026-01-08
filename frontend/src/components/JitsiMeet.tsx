'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, MessageSquare, Share2, Maximize, Minimize } from 'lucide-react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: JitsiOptions) => JitsiAPI;
  }
}

interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: {
    displayName: string;
    email?: string;
  };
  jwt?: string;
  onload?: () => void;
}

interface JitsiAPI {
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
  getNumberOfParticipants: () => number;
  dispose: () => void;
}

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  email?: string;
  isTeacher?: boolean;
  password?: string;
  onParticipantJoined?: (participant: { id: string; displayName: string }) => void;
  onParticipantLeft?: (participant: { id: string }) => void;
  onMeetingEnd?: () => void;
  onError?: (error: Error) => void;
  // Ayarlar
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  enableChat?: boolean;
}

export default function JitsiMeet({
  roomName,
  displayName,
  email,
  isTeacher = false,
  password,
  onParticipantJoined,
  onParticipantLeft,
  onMeetingEnd,
  onError,
  startWithAudioMuted = true,
  startWithVideoMuted = true,
  enableChat = true,
}: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(startWithAudioMuted);
  const [isVideoOff, setIsVideoOff] = useState(startWithVideoMuted);
  const [participantCount, setParticipantCount] = useState(1);

  // Jitsi API yükle
  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Jitsi API yüklenemedi'));
        document.head.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        await loadJitsiScript();
        
        if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

        const options: JitsiOptions = {
          roomName: roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted,
            startWithVideoMuted,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            // Öğretmen ayarları
            ...(isTeacher && {
              disableModeratorIndicator: false,
              moderator: true,
            }),
            // Sohbet ayarı
            ...(!enableChat && {
              chat: {
                enabled: false,
              },
            }),
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'recording',
              'raisehand',
              'videoquality',
              'tileview',
              'settings',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DEFAULT_BACKGROUND: '#1a1a2e',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
          },
          userInfo: {
            displayName: displayName,
            email: email,
          },
        };

        const api = new window.JitsiMeetExternalAPI('meet.jit.si', options);
        apiRef.current = api;

        // Şifre varsa ayarla
        if (password && isTeacher) {
          api.addListener('participantRoleChanged', (event: { role: string }) => {
            if (event.role === 'moderator') {
              api.executeCommand('password', password);
            }
          });
        } else if (password && !isTeacher) {
          api.addListener('passwordRequired', () => {
            api.executeCommand('password', password);
          });
        }

        // Event listeners
        api.addListener('videoConferenceJoined', () => {
          setIsLoading(false);
        });

        api.addListener('participantJoined', (participant: { id: string; displayName: string }) => {
          setParticipantCount(api.getNumberOfParticipants());
          onParticipantJoined?.(participant);
        });

        api.addListener('participantLeft', (participant: { id: string }) => {
          setParticipantCount(api.getNumberOfParticipants());
          onParticipantLeft?.(participant);
        });

        api.addListener('videoConferenceLeft', () => {
          onMeetingEnd?.();
        });

        api.addListener('audioMuteStatusChanged', (status: { muted: boolean }) => {
          setIsMuted(status.muted);
        });

        api.addListener('videoMuteStatusChanged', (status: { muted: boolean }) => {
          setIsVideoOff(status.muted);
        });

        api.addListener('readyToClose', () => {
          onMeetingEnd?.();
        });

      } catch (error) {
        console.error('Jitsi başlatma hatası:', error);
        onError?.(error as Error);
        setIsLoading(false);
      }
    };

    initJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, email, isTeacher, password, startWithAudioMuted, startWithVideoMuted, enableChat, onParticipantJoined, onParticipantLeft, onMeetingEnd, onError]);

  // Kontrol butonları
  const toggleAudio = () => {
    apiRef.current?.executeCommand('toggleAudio');
  };

  const toggleVideo = () => {
    apiRef.current?.executeCommand('toggleVideo');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const shareScreen = () => {
    apiRef.current?.executeCommand('toggleShareScreen');
  };

  const hangUp = () => {
    apiRef.current?.executeCommand('hangup');
  };

  const toggleChat = () => {
    apiRef.current?.executeCommand('toggleChat');
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-white text-lg">Derse bağlanılıyor...</p>
          <p className="mt-2 text-slate-400 text-sm">Lütfen bekleyin</p>
        </div>
      )}

      {/* Jitsi Container */}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '500px' }} />

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Sol - Katılımcı sayısı */}
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <span>{participantCount} katılımcı</span>
          </div>

          {/* Orta - Kontroller */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-all ${
                isVideoOff 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title={isVideoOff ? 'Kamerayı Aç' : 'Kamerayı Kapat'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {isTeacher && (
              <button
                onClick={shareScreen}
                className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
                title="Ekran Paylaş"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}

            {enableChat && (
              <button
                onClick={toggleChat}
                className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
                title="Sohbet"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={hangUp}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
              title="Dersten Ayrıl"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Sağ - Tam ekran */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Öğretmen Badge */}
      {isTeacher && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
          Öğretmen
        </div>
      )}
    </div>
  );
}

