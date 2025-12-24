'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadApi } from '@/lib/api';

interface ProfilePhotoUploadProps {
  userType: 'admin' | 'mudur' | 'sekreter' | 'ogretmen' | 'ogrenci' | 'kurs';
  userId: number;
  currentPhotoUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
};

export default function ProfilePhotoUpload({
  userType,
  userId,
  currentPhotoUrl,
  onUploadSuccess,
  onDeleteSuccess,
  size = 'md',
  className = '',
}: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mevcut fotoğrafı yükle
  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const response = await uploadApi.getPhoto(userType, userId);
        if (response.success && response.data.url) {
          setPhotoUrl(response.data.url);
        }
      } catch (err) {
        // Fotoğraf yoksa sessizce geç
        console.log('Mevcut fotoğraf bulunamadı');
      }
    };

    if (!currentPhotoUrl) {
      fetchPhoto();
    }
  }, [userType, userId, currentPhotoUrl]);

  const handleFileSelect = async (file: File) => {
    // Dosya validasyonu
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError('Sadece JPG ve PNG dosyaları yüklenebilir');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Dosya boyutu 8MB\'dan küçük olmalı');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadApi.uploadPhoto(userType, userId, file);
      if (response.success) {
        setPhotoUrl(response.data.url);
        onUploadSuccess?.(response.data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!photoUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      await uploadApi.deletePhoto(userType, userId);
      setPhotoUrl(null);
      onDeleteSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fotoğraf silinirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Fotoğraf Alanı */}
      <div
        className={`
          ${sizeClasses[size]}
          relative rounded-full overflow-hidden
          border-4 border-dashed transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'}
          ${isLoading ? 'opacity-50' : ''}
          cursor-pointer hover:border-blue-400
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profil Fotoğrafı"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg
              className="w-8 h-8 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs text-center px-2">Fotoğraf Ekle</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Gizli File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Butonlar */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {photoUrl ? 'Değiştir' : 'Yükle'}
        </button>

        {photoUrl && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sil
          </button>
        )}
      </div>

      {/* Hata Mesajı */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Bilgi */}
      <p className="text-xs text-gray-500 text-center">
        JPG veya PNG • Maks 2MB
      </p>
    </div>
  );
}
