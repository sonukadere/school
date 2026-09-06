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
    // Ensure local replica set instance is active if pointing to localhost
    await ensureMongoRunning();

    await prisma.setting.findFirst();
    return true;
  } catch (err) {
    console.error('[database] Connection test failed:', err.message || err);
    if (err.message && err.message.includes('replica set')) {
      console.error(
        '[database] Prisma requires MongoDB to run as a replica set.\n' +
        'Please ensure mongod is running with --replSet rs0.'
      );
    }
    return false;
  }
}

export { prisma, testConnection, ensureMongoRunning };
export default prisma;

