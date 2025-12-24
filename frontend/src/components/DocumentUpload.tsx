'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface DocumentUploadProps {
  onUploadSuccess?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  documentType?: 'odev' | 'sinav' | 'rapor' | 'diger';
  acceptedFormats?: string[];
  maxSize?: number; // MB cinsinden
  buttonText?: string;
  buttonClassName?: string;
}

interface UploadedDocument {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export default function DocumentUpload({
  onUploadSuccess,
  onUploadError,
  documentType = 'diger',
  acceptedFormats = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  maxSize = 10,
  buttonText = 'Belge Yükle',
  buttonClassName = '',
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);

    // Dosya boyutu kontrolü
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `Dosya boyutu ${maxSize}MB'dan küçük olmalı`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Dosya türü kontrolü
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Sadece PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX dosyaları yüklenebilir';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Belge yüklenirken bir hata oluştu');
      }

      const docData: UploadedDocument = data.data;
      setUploadedDoc(docData);
      setSuccess(true);

      if (onUploadSuccess) {
        onUploadSuccess(docData.url, docData.originalName);
      }

      // 3 saniye sonra success mesajını kaldır
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setUploadedDoc(null);
    setSuccess(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    return '📁';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      {!uploadedDoc && (
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${
              uploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${buttonClassName}
          `}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Yükleniyor...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      )}

      {/* Uploaded Document Display */}
      {uploadedDoc && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{getFileIcon(uploadedDoc.mimeType)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedDoc.originalName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(uploadedDoc.size)}
              </p>
              <a
                href={uploadedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
              >
                Belgeyi görüntüle →
              </a>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Belge başarıyla yüklendi!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Info Text */}
      <p className="mt-2 text-xs text-gray-500">
        Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Maks: {maxSize}MB)
      </p>
    </div>
  );
}

