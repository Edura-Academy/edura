import { Request } from 'express';

// Kullanıcı Rolleri
export type UserRole = 'admin' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci';

// JWT Payload
export interface JwtPayload {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  kursId?: string | null;
}

// Express Request with User
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
