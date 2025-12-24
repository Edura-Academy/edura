'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GroupPhotoUploadProps {
  groupId: string;
  currentPhotoUrl?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function GroupPhotoUpload({
  groupId,
  currentPhotoUrl,
  onUploadSuccess,
  onUploadError,
  size = 'md',
}: GroupPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);

    // Dosya boyutu kontrolü (8MB)
    if (file.size > 8 * 1024 * 1024) {
      const errorMsg = 'Dosya boyutu 8MB\'dan küçük olmalı';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Sadece resim dosyaları yüklenebilir';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('photo', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/group/${groupId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fotoğraf yüklenirken bir hata oluştu');
      }

      setPhotoUrl(data.data.url);
      setSuccess(true);

      if (onUploadSuccess) {
        onUploadSuccess(data.data.url);
      }

      // 3 saniye sonra success mesajını kaldır
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMsg);
      setPreviewUrl(null);
      if (onUploadError) onUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || photoUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Display */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg`}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Grup fotoğrafı"
              fill
              className="object-cover"
            />
          ) : (
            <Camera size={size === 'sm' ? 24 : size === 'md' ? 32 : 40} className="text-white" />
          )}
        </div>

        {/* Upload Overlay */}
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center group"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          ) : (
            <Upload
              size={20}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle size={16} />
          <span>Fotoğraf güncellendi!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Grup fotoğrafını değiştirmek için tıklayın (Maks: 8MB)
      </p>
    </div>
  );
}

