const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API Hata Türleri
export class ApiError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Hata Mesajları (Türkçe)
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Geçersiz istek',
  401: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
  403: 'Bu işlem için yetkiniz yok.',
  404: 'İstenen kaynak bulunamadı.',
  409: 'Bu kayıt zaten mevcut.',
  422: 'Girilen bilgiler geçersiz.',
  429: 'Çok fazla istek gönderildi. Lütfen bekleyin.',
  500: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  502: 'Sunucu şu an erişilemez.',
  503: 'Servis geçici olarak kullanılamıyor.',
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  showErrorToast?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || ERROR_MESSAGES[response.status] || 'Bir hata oluştu';
      
      // 401 durumunda token'ı temizle ve login'e yönlendir
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Login sayfasına yönlendirme (optional)
        // window.location.href = '/login';
      }
      
      throw new ApiError(errorMessage, response.status, errorData.code);
    }

    // 204 No Content durumunda boş response döndür
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network hatası
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError('İnternet bağlantınızı kontrol edin.', 0, 'NETWORK_ERROR');
    }
    throw new ApiError('Beklenmeyen bir hata oluştu.', 0, 'UNKNOWN_ERROR');
  }
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiRequest<{ token: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: data,
    }),

  me: () => apiRequest<{ user: unknown }>('/auth/me'),
};

// Course endpoints
export const courseApi = {
  getAll: () => apiRequest<{ courses: unknown[] }>('/courses'),
  getById: (id: string) => apiRequest<{ course: unknown }>(`/courses/${id}`),
  create: (data: unknown) =>
    apiRequest<{ course: unknown }>('/courses', { method: 'POST', body: data }),
  update: (id: string, data: unknown) =>
    apiRequest<{ course: unknown }>(`/courses/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiRequest<void>(`/courses/${id}`, { method: 'DELETE' }),
};

// Upload endpoints - Profil fotoğrafı yükleme
export const uploadApi = {
  /**
   * Profil fotoğrafı yükle
   * @param userType - admin, mudur, sekreter, ogretmen, ogrenci, kurs
   * @param userId - Kullanıcı ID'si
   * @param file - Yüklenecek dosya (JPG/PNG, max 2MB)
   */
  uploadPhoto: async (userType: string, userId: number, file: File) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(
      `${API_URL}/upload/profile/${userType}/${userId}`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Bir hata oluştu' }));
      throw new Error(error.error || 'Fotoğraf yüklenemedi');
    }
    
    return response.json() as Promise<{ success: boolean; data: { url: string } }>;
  },

  /**
   * Profil fotoğrafını sil
   */
  deletePhoto: (userType: string, userId: number) =>
    apiRequest<{ success: boolean; message: string }>(
      `/upload/profile/${userType}/${userId}`,
      { method: 'DELETE' }
    ),

  /**
   * Profil fotoğrafını getir
   */
  getPhoto: (userType: string, userId: number) =>
    apiRequest<{ success: boolean; data: { url: string | null } }>(
      `/upload/profile/${userType}/${userId}`
    ),
};

// Ders Programı API
export const dersProgramiApi = {
  // Sınıf listesi
  getSiniflar: () =>
    apiRequest<{ success: boolean; data: { id: string; ad: string; seviye: number }[] }>(
      '/ders-programi/siniflar'
    ),

  // Öğretmen listesi
  getOgretmenler: () =>
    apiRequest<{ success: boolean; data: { id: string; ad: string; soyad: string; brans?: string }[] }>(
      '/ders-programi/ogretmenler'
    ),

  // Sınıf bazlı ders programı
  getSinifProgrami: (sinifId: string) =>
    apiRequest<{ success: boolean; data: DersProgramiEvent[] }>(
      `/ders-programi/sinif/${sinifId}`
    ),

  // Öğretmen programı
  getOgretmenProgrami: () =>
    apiRequest<{ success: boolean; data: DersProgramiEvent[] }>(
      '/ders-programi/ogretmen'
    ),

  // Yeni ders ekle
  createDers: (data: {
    ad: string;
    aciklama?: string;
    sinifId: string;
    ogretmenId: string;
    gun: string;
    baslangicSaati: string;
    bitisSaati: string;
  }) =>
    apiRequest<{ success: boolean; data: unknown }>('/ders-programi/ders', {
      method: 'POST',
      body: data,
    }),

  // Ders güncelle
  updateDers: (dersId: string, data: Partial<{
    ad: string;
    aciklama: string;
    gun: string;
    baslangicSaati: string;
    bitisSaati: string;
    ogretmenId: string;
  }>) =>
    apiRequest<{ success: boolean; data: unknown }>(`/ders-programi/ders/${dersId}`, {
      method: 'PUT',
      body: data,
    }),

  // Ders sil
  deleteDers: (dersId: string) =>
    apiRequest<{ success: boolean; message: string }>(`/ders-programi/ders/${dersId}`, {
      method: 'DELETE',
    }),
};

// Ders Programı Event tipi
export interface DersProgramiEvent {
  id: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  extendedProps: {
    dersAd: string;
    sinifAd?: string;
    sinifId?: string;
    ogretmenAd?: string;
    aciklama?: string;
  };
  backgroundColor: string;
  borderColor: string;
}

