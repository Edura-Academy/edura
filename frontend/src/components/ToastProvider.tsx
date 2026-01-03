'use client';

import { Toaster, toast } from 'sonner';

// Toast türleri için yardımcı fonksiyonlar
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4500,
    });
  },
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'inherit',
        },
        classNames: {
          toast: 'shadow-lg border',
          title: 'font-semibold',
          description: 'text-sm opacity-80',
          success: 'bg-green-50 border-green-200 text-green-800',
          error: 'bg-red-50 border-red-200 text-red-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
        },
      }}
    />
  );
}

export { toast };

