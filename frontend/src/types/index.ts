// Kullanıcı Rolleri
export type UserRole = 'admin' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci';

// Okul Türü
export type SchoolType = 'ORTAOKUL' | 'LISE';

// Temel Kullanıcı
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Öğrenci
export interface Student {
  id: string;
  userId: string;
  user: User;
  schoolType: SchoolType;
  grade: number; // Sınıf (5-12)
  parentPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Öğretmen
export interface Teacher {
  id: string;
  userId: string;
  user: User;
  isCoach: boolean; // Eğitim koçu mu?
  subjects: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Kurs
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacherId: string;
  teacher: Teacher;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

// Ders
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number; // dakika cinsinden
  order: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

// İlerleme
export interface Progress {
  id: string;
  studentId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz
export interface Quiz {
  id: string;
  title: string;
  lessonId: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

// Soru
export interface Question {
  id: string;
  text: string;
  quizId: string;
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

// Cevap
export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  questionId: string;
}

// Sertifika
export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  issuedAt: Date;
  certificateUrl?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

