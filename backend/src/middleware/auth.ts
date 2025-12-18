// Authentication Middleware
// Bu dosya JWT token doğrulama ve yetkilendirme için kullanılacak

import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci';
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

// Sadece Müdür
export const mudurOnly = authorize('mudur');

// Müdür ve Sekreter
export const mudurVeSekreter = authorize('mudur', 'sekreter');

// Öğretmen, Müdür ve Sekreter
export const ogretmenVeYukarisi = authorize('mudur', 'sekreter', 'ogretmen');

// Admin
export const adminOnly = authorize('admin');

export {};
