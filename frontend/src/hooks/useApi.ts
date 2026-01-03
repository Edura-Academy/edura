'use client';

import { useState, useCallback } from 'react';
import { apiRequest, ApiError } from '@/lib/api';
import { showToast } from '@/components/ToastProvider';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useApi<T = unknown>(options: UseApiOptions = {}) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      endpoint: string,
      requestOptions: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        body?: unknown;
      } = {}
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiRequest<T>(endpoint, requestOptions);
        setState({ data, isLoading: false, error: null });

        if (showSuccessToast && successMessage) {
          showToast.success(successMessage);
        }

        onSuccess?.(data);
        return data;
      } catch (error) {
        const apiError = error instanceof ApiError 
          ? error 
          : new ApiError('Beklenmeyen bir hata oluştu', 0);
        
        setState({ data: null, isLoading: false, error: apiError });

        if (showErrorToast) {
          showToast.error('Hata', apiError.message);
        }

        onError?.(apiError);
        return null;
      }
    },
    [showSuccessToast, showErrorToast, successMessage, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Promise tabanlı mutasyon hook'u (POST, PUT, DELETE için)
export function useMutation<TData = unknown, TVariables = unknown>(
  endpoint: string | ((variables: TVariables) => string),
  options: UseApiOptions & {
    method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  } = {}
) {
  const { method = 'POST', ...apiOptions } = options;
  const { showSuccessToast = true, showErrorToast = true, successMessage } = apiOptions;

  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables?: TVariables): Promise<TData | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const finalEndpoint = typeof endpoint === 'function' 
          ? endpoint(variables as TVariables) 
          : endpoint;

        const data = await apiRequest<TData>(finalEndpoint, {
          method,
          body: variables,
        });

        setState({ data, isLoading: false, error: null });

        if (showSuccessToast && successMessage) {
          showToast.success(successMessage);
        }

        return data;
      } catch (error) {
        const apiError = error instanceof ApiError 
          ? error 
          : new ApiError('Beklenmeyen bir hata oluştu', 0);
        
        setState({ data: null, isLoading: false, error: apiError });

        if (showErrorToast) {
          showToast.error('Hata', apiError.message);
        }

        return null;
      }
    },
    [endpoint, method, showSuccessToast, showErrorToast, successMessage]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Fetch hook'u (GET için, otomatik yükleme ile)
export function useFetch<T = unknown>(
  endpoint: string | null,
  options: UseApiOptions & {
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) {
  const { enabled = true, ...apiOptions } = options;
  const api = useApi<T>(apiOptions);

  // İlk mount'ta fetch yap
  const [hasFetched, setHasFetched] = useState(false);

  const fetch = useCallback(async () => {
    if (!endpoint || !enabled) return null;
    setHasFetched(true);
    return api.execute(endpoint);
  }, [endpoint, enabled, api]);

  const refetch = useCallback(async () => {
    if (!endpoint) return null;
    return api.execute(endpoint);
  }, [endpoint, api]);

  // İlk yükleme
  if (!hasFetched && enabled && endpoint) {
    fetch();
  }

  return {
    ...api,
    refetch,
  };
}

