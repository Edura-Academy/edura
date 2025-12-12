import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, UserRole } from '../types';

const prisma = new PrismaClient();

// Tüm kullanıcıları getir
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    const where: Record<string, unknown> = {};
    
    if (role) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı' });
  }
};

// Kullanıcı detayı
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı bilgisi alınamadı' });
  }
};

// Kullanıcı güncelle
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;

    // Sadece kendi profilini veya admin/müdür güncelleyebilir
    if (
      req.user?.userId !== id &&
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.MUDUR
    ) {
      res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz yok' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.json({ success: true, data: { user }, message: 'Kullanıcı güncellendi' });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı güncellenemedi' });
  }
};

// Kullanıcı sil
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı silinemedi' });
  }
};

