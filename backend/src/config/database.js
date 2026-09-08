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

if (!globalThis.__prismaMiddlewareAttached) {
  prisma.$use(async (params, next) => {
    if (params.action === 'create' && params.args?.data) {
      if (params.args.data.deletedAt === undefined) {
        params.args.data.deletedAt = null;
      }
    } else if (params.action === 'createMany' && Array.isArray(params.args?.data)) {
      params.args.data.forEach((item) => {
        if (item && item.deletedAt === undefined) {
          item.deletedAt = null;
        }
      });
    }
    return next(params);
  });
  globalThis.__prismaMiddlewareAttached = true;
}

const SOFT_DELETE_MODELS = [
  'student',
  'teacher',
  'class',
  'subject',
  'parent',
  'user',
  'staff',
  'fee',
  'exam',
  'attendance',
  'teacherAttendance',
  'timetable',
  'notice',
  'event',
  'holiday',
];

export async function syncSoftDeleteFields() {
  for (const model of SOFT_DELETE_MODELS) {
    if (prisma[model]?.updateMany) {
      try {
        await prisma[model].updateMany({
          where: { deletedAt: { isSet: false } },
          data: { deletedAt: null },
        });
      } catch {
        // Model might not have deletedAt in schema or updateMany
      }
    }
  }
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
    await syncSoftDeleteFields();
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
