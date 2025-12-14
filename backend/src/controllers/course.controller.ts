import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

// Tüm branşları getir
export const getAllBranslar = async (req: Request, res: Response): Promise<void> => {
  try {
    const branslar = await prisma.brans.findMany();
    res.json({ success: true, data: { branslar } });
  } catch (error) {
    console.error('GetAllBranslar error:', error);
    res.status(500).json({ success: false, error: 'Branşlar alınamadı' });
  }
};

// Tüm sınıfları getir (kursa göre)
export const getSiniflarByKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;
    const siniflar = await prisma.sinif.findMany({
      where: { KursID: parseInt(kursId) },
    });
    res.json({ success: true, data: { siniflar } });
  } catch (error) {
    console.error('GetSiniflarByKurs error:', error);
    res.status(500).json({ success: false, error: 'Sınıflar alınamadı' });
  }
};

// Tüm dersleri getir
export const getAllDersler = async (req: Request, res: Response): Promise<void> => {
  try {
    const dersler = await prisma.ders.findMany();
    res.json({ success: true, data: { dersler } });
  } catch (error) {
    console.error('GetAllDersler error:', error);
    res.status(500).json({ success: false, error: 'Dersler alınamadı' });
  }
};

// Ders programı getir (kursa göre)
export const getDersProgrami = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;
    const program = await prisma.dersprogrami.findMany({
      where: { KursID: parseInt(kursId) },
    });
    res.json({ success: true, data: { program } });
  } catch (error) {
    console.error('GetDersProgrami error:', error);
    res.status(500).json({ success: false, error: 'Ders programı alınamadı' });
  }
};

// Denemeleri getir (kursa göre)
export const getDenemelerByKurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { kursId } = req.params;
    const denemeler = await prisma.deneme.findMany({
      where: { KursID: parseInt(kursId) },
      orderBy: { Tarih: 'desc' },
    });
    res.json({ success: true, data: { denemeler } });
  } catch (error) {
    console.error('GetDenemelerByKurs error:', error);
    res.status(500).json({ success: false, error: 'Denemeler alınamadı' });
  }
};

// Deneme sonuçları getir
export const getDenemeSonuclari = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { denemeId } = req.params;
    const sonuclar = await prisma.denemesonuc.findMany({
      where: { DenemeID: parseInt(denemeId) },
      orderBy: { Siralama: 'asc' },
    });
    res.json({ success: true, data: { sonuclar } });
  } catch (error) {
    console.error('GetDenemeSonuclari error:', error);
    res.status(500).json({ success: false, error: 'Deneme sonuçları alınamadı' });
  }
};

// Placeholder fonksiyonlar (eski route'lar için)
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor', data: { courses: [] } });
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Bu endpoint güncelleniyor' });
};
