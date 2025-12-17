const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
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

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Bir hata oluştu' }));
    throw new Error(error.message || 'API isteği başarısız');
  }

  return response.json();
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

