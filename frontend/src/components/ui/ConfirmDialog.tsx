'use client';

import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from './Button';

type DialogType = 'confirm' | 'danger' | 'info' | 'success';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (title: string, message: string, type?: DialogType) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

const iconMap = {
  confirm: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
  danger: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
};

const buttonVariantMap: Record<DialogType, 'primary' | 'danger' | 'success'> = {
  confirm: 'primary',
  danger: 'danger',
  info: 'primary',
  success: 'success',
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog(options);
      setResolveRef(() => resolve);
    });
  }, []);

  const alert = useCallback((title: string, message: string, type: DialogType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type,
        confirmText: 'Tamam',
        cancelText: undefined,
      });
      setResolveRef(() => () => resolve());
    });
  }, []);

  const handleConfirm = async () => {
    if (dialog?.onConfirm) {
      setIsLoading(true);
      try {
        await dialog.onConfirm();
      } finally {
        setIsLoading(false);
      }
    }
    resolveRef?.(true);
    setDialog(null);
    setResolveRef(null);
  };

  const handleCancel = () => {
    dialog?.onCancel?.();
    resolveRef?.(false);
    setDialog(null);
    setResolveRef(null);
  };

  const type = dialog?.type || 'confirm';
  const { icon: Icon, color, bg } = iconMap[type];

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      
      {/* Dialog Overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity animate-fadeIn"
              onClick={handleCancel}
            />
            
            {/* Dialog */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleIn">
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {dialog.title}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {dialog.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                {dialog.cancelText !== undefined && (
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    {dialog.cancelText || 'İptal'}
                  </Button>
                )}
                <Button
                  variant={buttonVariantMap[type]}
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  loadingText="İşleniyor..."
                >
                  {dialog.confirmText || 'Onayla'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Standalone Confirm Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const { icon: Icon, color, bg } = iconMap[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity animate-fadeIn"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleIn">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={buttonVariantMap[type]}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

