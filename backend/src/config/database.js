import { PrismaClient } from '@prisma/client';
import env from './env.js';
import { ensureMongoRunning } from './ensureMongo.js';

let prisma;

if (env.nodeEnv === 'production') {
  prisma = new PrismaClient();
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = globalThis.__prisma;
}

async function testConnection() {
  try {
    const isProduction = env.nodeEnv === 'production';
    const dbUrl = env.databaseUrl || process.env.MONGODB_URI || '';
    const isAtlas =
      dbUrl.startsWith('mongodb+srv://') ||
      (!dbUrl.includes('127.0.0.1') && !dbUrl.includes('localhost'));

    // NEVER attempt to spawn local MongoDB when in production or using MongoDB Atlas
    if (!isProduction && !isAtlas) {
      await ensureMongoRunning();
    }

    await prisma.setting.findFirst();
    return true;
  } catch (err) {
    console.error('[database] Connection test failed:', err.message || err);
    if (err.message && err.message.includes('replica set')) {
      console.error(
        '[database] Prisma requires MongoDB to run as a replica set.\n' +
        'For production, use MongoDB Atlas (process.env.MONGODB_URI) which is already configured as a replica set.'
      );
    }
    return false;
  }
}

export { prisma, testConnection, ensureMongoRunning };
export default prisma;
