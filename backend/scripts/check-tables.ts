import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRaw<Array<{ Tables_in_edura: string }>>`SHOW TABLES`;
  console.log('📋 Veritabanı Tabloları:');
  tables.forEach(t => {
    const tableName = Object.values(t)[0];
    console.log(`  - ${tableName}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

