'use client';

import { 
  FileX, 
  Search, 
  AlertCircle, 
  Inbox, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  Bell,
  FileText
} from 'lucide-react';
import { Button } from './Button';

type IconType = 'empty' | 'search' | 'error' | 'inbox' | 'users' | 'course' | 'calendar' | 'message' | 'notification' | 'document';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const icons: Record<IconType, typeof FileX> = {
  empty: Inbox,
  search: Search,
  error: AlertCircle,
  inbox: Inbox,
  users: Users,
  course: BookOpen,
  calendar: Calendar,
  message: MessageSquare,
  notification: Bell,
  document: FileText,
};

export function EmptyState({
  icon = 'empty',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const IconComponent = icons[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-built Empty States
export function NoDataFound({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="empty"
      title="Veri bulunamadı"
      description="Görüntülenecek veri bulunmuyor."
      action={onRetry ? { label: 'Yenile', onClick: onRetry } : undefined}
    />
  );
}

export function NoSearchResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="Sonuç bulunamadı"
      description={query ? `"${query}" için sonuç bulunamadı.` : 'Arama kriterlerinize uygun sonuç yok.'}
      action={onClear ? { label: 'Filtreleri Temizle', onClick: onClear, variant: 'secondary' } : undefined}
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="error"
      title="Bir hata oluştu"
      description={message || 'İçerik yüklenirken bir sorun oluştu.'}
      action={onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined}
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon="message"
      title="Mesaj yok"
      description="Henüz hiç mesajınız bulunmuyor."
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="notification"
      title="Bildirim yok"
      description="Yeni bildiriminiz bulunmuyor."
    />
  );
}

export function NoCourses({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="course"
      title="Ders bulunamadı"
      description="Henüz kayıtlı ders bulunmuyor."
      action={onAdd ? { label: 'Ders Ekle', onClick: onAdd } : undefined}
    />
  );
}

