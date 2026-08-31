import { PrismaClient } from '@prisma/client';
import env from './env.js';

let prisma;

if (env.nodeEnv === 'production') {
  prisma = new PrismaClient();
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = globalThis.__prisma;
}

async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { prisma, testConnection };
export default prisma;
