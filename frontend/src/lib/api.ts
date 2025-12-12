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

