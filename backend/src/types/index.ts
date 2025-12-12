import { Request } from 'express';

// Kullanıcı Rolleri
export enum UserRole {
  ADMIN = 'ADMIN',
  MUDUR = 'MUDUR',
  OGRETMEN = 'OGRETMEN',
  OGRENCI = 'OGRENCI',
}

// Okul Türü
export enum SchoolType {
  ORTAOKUL = 'ORTAOKUL',
  LISE = 'LISE',
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
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

