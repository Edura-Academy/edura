// Authentication Middleware
// Bu dosya JWT token doğrulama ve yetkilendirme için kullanılacak

import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'kursSahibi' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci' | 'veli';
    kursId?: string | null;
    sinifId?: string | null;
  };
}

// JWT token doğrulama middleware'i
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: JWT token'ı header'dan al ve doğrula
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Yetkisiz erişim' });
  }
};

// Role bazlı yetkilendirme
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
  };
};

// Sadece Admin
export const adminOnly = authorize('admin');

// Sadece Kurs Sahibi
export const kursSahibiOnly = authorize('kursSahibi');

// Admin ve Kurs Sahibi
export const adminVeKursSahibi = authorize('admin', 'kursSahibi');

// Sadece Müdür
export const mudurOnly = authorize('mudur');

// Kurs Sahibi ve Müdür
export const kursSahibiVeMudur = authorize('kursSahibi', 'mudur');

// Müdür ve Sekreter
export const mudurVeSekreter = authorize('mudur', 'sekreter');

// Öğretmen, Müdür ve Sekreter
export const ogretmenVeYukarisi = authorize('mudur', 'sekreter', 'ogretmen');

// Kurs yönetimi (Kurs Sahibi, Müdür, Sekreter)
export const kursYonetimi = authorize('kursSahibi', 'mudur', 'sekreter');

export {};
