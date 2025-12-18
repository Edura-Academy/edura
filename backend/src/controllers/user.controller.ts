import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';

// Tüm kullanıcıları getir
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, kursId, aktif } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as Role }),
        ...(kursId && { kursId: kursId as string }),
        ...(aktif !== undefined && { aktif: aktif === 'true' }),
      },
      include: {
        kurs: true,
        sinif: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar getirilemedi' });
  }
};

// Tek kullanıcı getir
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı getirilemedi' });
  }
};

// Kullanıcı oluştur
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, ad, soyad, telefon, role, kursId, sinifId, brans } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Bu email zaten kullanılıyor' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ad,
        soyad,
        telefon,
        role,
        kursId,
        sinifId,
        brans,
      },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı oluşturulamadı' });
  }
};

// Kullanıcı güncelle
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ad, soyad, telefon, email, kursId, sinifId, brans, aktif } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(ad && { ad }),
        ...(soyad && { soyad }),
        ...(telefon && { telefon }),
        ...(email && { email }),
        ...(kursId && { kursId }),
        ...(sinifId && { sinifId }),
        ...(brans && { brans }),
        ...(aktif !== undefined && { aktif }),
      },
      include: {
        kurs: true,
        sinif: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı güncellenemedi' });
  }
};

// Kullanıcı sil (soft delete)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { aktif: false },
    });

    res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı silinemedi' });
  }
};

// Kursları getir
export const getKurslar = async (req: Request, res: Response): Promise<void> => {
  try {
    const kurslar = await prisma.kurs.findMany({
      where: { aktif: true },
      include: {
        siniflar: true,
        _count: {
          select: { users: true },
        },
      },
    });

    res.json({ success: true, data: kurslar });
  } catch (error) {
    console.error('Get kurslar error:', error);
    res.status(500).json({ success: false, error: 'Kurslar getirilemedi' });
  }
};

// Kurs oluştur
export const createKurs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ad, adres, telefon } = req.body;

    const kurs = await prisma.kurs.create({
      data: {
        ad,
        adres,
        telefon,
      },
    });

    res.status(201).json({ success: true, data: kurs });
  } catch (error) {
    console.error('Create kurs error:', error);
    res.status(500).json({ success: false, error: 'Kurs oluşturulamadı' });
  }
};

// Sınıfları getir
export const getSiniflar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kursId } = req.query;

    const siniflar = await prisma.sinif.findMany({
      where: {
        ...(kursId && { kursId: kursId as string }),
        aktif: true,
      },
      include: {
        kurs: true,
        _count: {
          select: { ogrenciler: true },
        },
      },
    });

    res.json({ success: true, data: siniflar });
  } catch (error) {
    console.error('Get siniflar error:', error);
    res.status(500).json({ success: false, error: 'Sınıflar getirilemedi' });
  }
};

// İstatistikler
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kursId = req.user?.kursId;

    const [
      toplamOgrenci,
      toplamOgretmen,
      toplamSinif,
      toplamKurs,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'ogrenci',
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.user.count({
        where: {
          role: 'ogretmen',
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.sinif.count({
        where: {
          aktif: true,
          ...(kursId && { kursId }),
        },
      }),
      prisma.kurs.count({
        where: { aktif: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        toplamOgrenci,
        toplamOgretmen,
        toplamSinif,
        toplamKurs,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'İstatistikler getirilemedi' });
  }
};
