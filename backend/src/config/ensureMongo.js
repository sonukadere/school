import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if a TCP port is open and accepting connections.
 */
export function isPortOpen(port, host = '127.0.0.1', timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Finds mongod executable on the system.
 */
function findMongodExecutable() {
  const commonPaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\5.0\\bin\\mongod.exe',
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to searching PATH
  return 'mongod';
}

/**
 * Checks if DATABASE_URL refers to a local host (127.0.0.1 or localhost)
 * and returns the parsed port and replicaSet name if present.
 */
function parseLocalMongoUrl(urlStr) {
  if (!urlStr) return null;
  try {
    // Handle mongodb+srv:// - Remote MongoDB Atlas
    if (urlStr.startsWith('mongodb+srv://')) {
      return null;
    }

    const match = urlStr.match(/mongodb:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:\/?]+)(?::(\d+))?/i);
    if (!match) return null;

    const host = match[3];
    const port = parseInt(match[4] || '27017', 10);

    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal) return null;

    const replSetMatch = urlStr.match(/[?&]replicaSet=([^&]+)/i);
    const replicaSet = replSetMatch ? replSetMatch[1] : 'rs0';

    return { host, port, replicaSet };
  } catch {
    return null;
  }
}

/**
 * Ensures that MongoDB is reachable.
 * IMPORTANT: In production or when using MongoDB Atlas, this NEVER attempts to start local mongod.
 */
export async function ensureMongoRunning() {
  // Never attempt to start local MongoDB in production
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || env.databaseUrl || '';

  // If using MongoDB Atlas (mongodb+srv://) or non-local database, skip local mongod launch
  if (
    dbUrl.startsWith('mongodb+srv://') ||
    (!dbUrl.includes('127.0.0.1') && !dbUrl.includes('localhost'))
  ) {
    return true;
  }

  const localConfig = parseLocalMongoUrl(dbUrl);
  if (!localConfig) {
    // Remote database or unable to parse; let Prisma handle it directly
    return true;
  }

  const { host, port, replicaSet } = localConfig;

  // Check if MongoDB is already listening on this port
  const running = await isPortOpen(port, host, 1200);
  if (running) {
    return true;
  }

  console.log(`[database] Local MongoDB is not running on ${host}:${port}. Attempting to start local replica set...`);

  const mongodPath = findMongodExecutable();
  const mongoDataDir = path.resolve(__dirname, '../../.mongo_data');

  if (!fs.existsSync(mongoDataDir)) {
    fs.mkdirSync(mongoDataDir, { recursive: true });
  }

  const args = [
    '--dbpath',
    mongoDataDir,
    '--port',
    String(port),
    '--replSet',
    replicaSet || 'rs0',
  ];

  try {
    const child = spawn(mongodPath, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();

    // Poll until port becomes open (wait up to 15 seconds)
    const startTime = Date.now();
    const timeout = 15000;

    while (Date.now() - startTime < timeout) {
      await new Promise((r) => setTimeout(r, 600));
      const isOpen = await isPortOpen(port, host, 800);
      if (isOpen) {
        console.log(`[database] Local MongoDB replica set started successfully on port ${port}.`);
        return true;
      }
    }

    console.warn(`[database] Timed out waiting for MongoDB to open port ${port}.`);
    return false;
  } catch (err) {
    console.error(`[database] Failed to launch MongoDB executable at "${mongodPath}":`, err.message);
    console.error(`[database] Please start MongoDB manually or use MongoDB Atlas (process.env.MONGODB_URI)`);
    return false;
  }
}

// Allow direct CLI execution: node src/config/ensureMongo.js
if (process.argv[1] && (process.argv[1].endsWith('ensureMongo.js') || process.argv[1].endsWith('ensureMongo'))) {
  ensureMongoRunning().then((success) => {
    if (success) {
      console.log('[database] MongoDB readiness check: OK');
      process.exit(0);
    } else {
      console.error('[database] MongoDB readiness check: FAILED');
      process.exit(1);
    }
  });
}

export default ensureMongoRunning;
