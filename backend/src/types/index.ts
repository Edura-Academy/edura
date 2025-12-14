import { Request } from 'express';

// Kullanıcı Rolleri
export type UserRole = 'ADMIN' | 'MUDUR' | 'OGRETMEN' | 'SEKRETER' | 'OGRENCI' | 'KURS';

// JWT Payload
export interface JwtPayload {
  userId: number;
  kullaniciAdi: string;
  role: UserRole;
  kursId?: number | null;
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
