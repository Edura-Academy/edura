import { PrismaClient } from '@prisma/client';

// prisma.config.ts dosyası DATABASE_URL'i zaten yönetiyor
const prisma = new PrismaClient();

export default prisma;
