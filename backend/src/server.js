import app from './app.js';
import env from './config/env.js';
import { prisma, testConnection } from './config/database.js';

let server;

async function start() {
  const connected = await testConnection();
  if (!connected) {
    console.error(
      '[server] Could not connect to MongoDB. Check DATABASE_URL and that the database is running.'
    );
    process.exit(1);
  }
  console.log('[server] MongoDB connection established.');

  server = app.listen(env.port, () => {
    console.log(`[server] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

async function shutdown(signal) {
  console.log(`[server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[server] Shut down complete.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }

  // Force exit if graceful shutdown takes too long.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start();
