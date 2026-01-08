'use client';

import { ReactNode, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface TTSWrapperProps {
  children: ReactNode;
  /** Okunacak metin */
  text: string;
  /** HTML element tipi */
  as?: keyof JSX.IntrinsicElements;
  /** Hover'da oku */
  onHover?: boolean;
  /** Focus'ta oku */
  onFocus?: boolean;
  /** Mouse çekildiğinde sesi kes (varsayılan: true) */
  stopOnLeave?: boolean;
  /** Ek className */
  className?: string;
  /** Diğer props */
  [key: string]: any;
}

/**
 * TTS (Text-to-Speech) Wrapper Komponenti
 * 
 * Herhangi bir elementi sararak hover veya focus'ta sesli okuma özelliği ekler.
 * Mouse çekildiğinde ses otomatik kesilir (stopOnLeave).
 * 
 * @example
 * <TTSWrapper text="Devamsızlık: 2 gün" as="div" onHover onFocus>
 *   <DevamsizlikCard count={2} />
 * </TTSWrapper>
 */
export function TTSWrapper({
  children,
  text,
  as: Component = 'div',
  onHover = true,
  onFocus = true,
  stopOnLeave = true,
  className = '',
  ...props
}: TTSWrapperProps) {
  const { speak, stop, ttsEnabled } = useAccessibility();

  const handleMouseEnter = useCallback(() => {
    if (onHover && ttsEnabled && text) {
      speak(text, true); // priority: true - önceki sesi kes ve bu metni oku
    }
  }, [onHover, ttsEnabled, text, speak]);

  const handleMouseLeave = useCallback(() => {
    if (stopOnLeave) {
      stop(); // Mouse çekildiğinde sesi hemen kes
    }
  }, [stopOnLeave, stop]);

  const handleFocus = useCallback(() => {
    if (onFocus && ttsEnabled && text) {
      speak(text, true);
    }
  }, [onFocus, ttsEnabled, text, speak]);

  const handleBlur = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  // tabIndex ekle (focus için)
  const tabIndexProp = onFocus ? { tabIndex: 0 } : {};

  return (
    <Component
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={text}
      className={className}
      role="region"
      {...tabIndexProp}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * TTS Button - Sesli okuma özellikli buton
 * Mouse hover ve focus'ta okur, çekilince durur.
 */
interface TTSButtonProps {
  children: ReactNode;
  text: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSButton({
  children,
  text,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  stopOnLeave = true,
  ...props
}: TTSButtonProps) {
  const { speak, stop, ttsEnabled } = useAccessibility();

  const handleMouseEnter = useCallback(() => {
    if (ttsEnabled && text) {
      speak(text, true);
    }
  }, [ttsEnabled, text, speak]);

  const handleMouseLeave = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  const handleFocus = useCallback(() => {
    if (ttsEnabled && text) {
      speak(text, true);
    }
  }, [ttsEnabled, text, speak]);

  const handleBlur = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={text}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * TTS Link - Sesli okuma özellikli link
 * Mouse hover ve focus'ta okur, çekilince durur.
 */
interface TTSLinkProps {
  children: ReactNode;
  text: string;
  href: string;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSLink({
  children,
  text,
  href,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSLinkProps) {
  const { speak, stop, ttsEnabled } = useAccessibility();

  const handleMouseEnter = useCallback(() => {
    if (ttsEnabled && text) {
      speak(text, true);
    }
  }, [ttsEnabled, text, speak]);

  const handleMouseLeave = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  const handleFocus = useCallback(() => {
    if (ttsEnabled && text) {
      speak(text, true);
    }
  }, [ttsEnabled, text, speak]);

  const handleBlur = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={text}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * TTS Card - Kart komponenti için sesli okuma wrapper'ı
 * Mouse hover'da başlık ve açıklamayı okur, çekilince durur.
 */
interface TTSCardProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSCard({
  children,
  title,
  description,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSCardProps) {
  const text = description ? `${title}. ${description}` : title;
  
  return (
    <TTSWrapper text={text} className={className} stopOnLeave={stopOnLeave} {...props}>
      {children}
    </TTSWrapper>
  );
}

/**
 * TTS Stat Card - İstatistik kartı için sesli okuma
 * Örn: "Devamsızlık: 2 gün", "Ortalama: 85.5 puan"
 * Mouse üzerindeyken okur, çekilince durur.
 * 
 * @example
 * <TTSStatCard label="Devamsızlık" value={2} unit="gün">
 *   <div className="stat-card">...</div>
 * </TTSStatCard>
 */
interface TTSStatCardProps {
  children: ReactNode;
  /** İstatistik etiketi (örn: "Devamsızlık", "Ortalama") */
  label: string;
  /** İstatistik değeri */
  value: string | number;
  /** Birim (örn: "gün", "puan", "adet") */
  unit?: string;
  /** Ek açıklama */
  description?: string;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSStatCard({
  children,
  label,
  value,
  unit,
  description,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSStatCardProps) {
  // Mantıklı okunabilir metin oluştur
  let text = `${label}: ${value}`;
  if (unit) {
    text += ` ${unit}`;
  }
  if (description) {
    text += `. ${description}`;
  }
  
  return (
    <TTSWrapper text={text} className={className} stopOnLeave={stopOnLeave} {...props}>
      {children}
    </TTSWrapper>
  );
}

/**
 * TTS Menu Item - Menü öğesi için sesli okuma
 * Sidebar veya navigation menü öğeleri için kullanılır.
 * 
 * @example
 * <TTSMenuItem text="Online Sınavlar sayfasına git" href="/ogrenci/sinavlar">
 *   <span>📝 Online Sınavlar</span>
 * </TTSMenuItem>
 */
interface TTSMenuItemProps {
  children: ReactNode;
  /** Okunacak metin */
  text: string;
  /** Link hedefi (opsiyonel) */
  href?: string;
  /** Tıklama işlevi (opsiyonel) */
  onClick?: () => void;
  /** Aktif mi? */
  isActive?: boolean;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSMenuItem({
  children,
  text,
  href,
  onClick,
  isActive,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSMenuItemProps) {
  const { speak, stop, ttsEnabled } = useAccessibility();

  const handleMouseEnter = useCallback(() => {
    if (ttsEnabled && text) {
      const fullText = isActive ? `${text}, şu an bu sayfadasınız` : text;
      speak(fullText, true);
    }
  }, [ttsEnabled, text, isActive, speak]);

  const handleMouseLeave = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  const handleFocus = useCallback(() => {
    if (ttsEnabled && text) {
      const fullText = isActive ? `${text}, şu an bu sayfadasınız` : text;
      speak(fullText, true);
    }
  }, [ttsEnabled, text, isActive, speak]);

  const handleBlur = useCallback(() => {
    if (stopOnLeave) {
      stop();
    }
  }, [stopOnLeave, stop]);

  const commonProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-label': text,
    'aria-current': isActive ? 'page' as const : undefined,
    className,
    role: 'menuitem',
    tabIndex: 0,
    ...props,
  };

  if (href) {
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  }

  return (
    <div onClick={onClick} {...commonProps}>
      {children}
    </div>
  );
}

/**
 * TTS Table Cell - Tablo hücresi için sesli okuma
 * Hover'da hücre içeriğini mantıklı şekilde okur.
 * 
 * @example
 * <TTSTableCell label="Öğrenci Adı" value="Ahmet Yılmaz">
 *   Ahmet Yılmaz
 * </TTSTableCell>
 */
interface TTSTableCellProps {
  children: ReactNode;
  /** Sütun başlığı/etiketi */
  label?: string;
  /** Hücre değeri */
  value: string | number;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSTableCell({
  children,
  label,
  value,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSTableCellProps) {
  const text = label ? `${label}: ${value}` : String(value);
  
  return (
    <TTSWrapper 
      text={text} 
      as="td" 
      className={className} 
      stopOnLeave={stopOnLeave} 
      {...props}
    >
      {children}
    </TTSWrapper>
  );
}

/**
 * TTS List Item - Liste öğesi için sesli okuma
 * 
 * @example
 * <TTSListItem text="Matematik ödevi: Son teslim 15 Ocak" index={1}>
 *   <OdevItem odev={odev} />
 * </TTSListItem>
 */
interface TTSListItemProps {
  children: ReactNode;
  text: string;
  /** Liste sırası (opsiyonel - "1. öğe" gibi okur) */
  index?: number;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSListItem({
  children,
  text,
  index,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSListItemProps) {
  const fullText = index !== undefined ? `${index}. öğe: ${text}` : text;
  
  return (
    <TTSWrapper 
      text={fullText} 
      as="li" 
      className={className} 
      stopOnLeave={stopOnLeave}
      role="listitem"
      {...props}
    >
      {children}
    </TTSWrapper>
  );
}

/**
 * TTS Notification - Bildirim/Alert için sesli okuma
 * 
 * @example
 * <TTSNotification type="warning" title="Dikkat" message="Ödeme tarihiniz yaklaşıyor">
 *   <AlertBox />
 * </TTSNotification>
 */
interface TTSNotificationProps {
  children: ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
  stopOnLeave?: boolean;
  [key: string]: any;
}

export function TTSNotification({
  children,
  type = 'info',
  title,
  message,
  className = '',
  stopOnLeave = true,
  ...props
}: TTSNotificationProps) {
  const typeLabels = {
    info: 'Bilgi',
    success: 'Başarılı',
    warning: 'Uyarı',
    error: 'Hata',
  };
  
  let text = `${typeLabels[type]}`;
  if (title) {
    text += `: ${title}`;
  }
  text += `. ${message}`;
  
  return (
    <TTSWrapper 
      text={text} 
      className={className} 
      stopOnLeave={stopOnLeave}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {children}
    </TTSWrapper>
  );
}

export default TTSWrapper;

