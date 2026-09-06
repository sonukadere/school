import app from './app.js';
import env from './config/env.js';
import { prisma, testConnection } from './config/database.js';

let server;

async function start() {
  const connected = await testConnection();
  if (!connected) {
    console.error(
      '[server] Could not connect to MongoDB Atlas. Check MONGODB_URI or DATABASE_URL.'
    );
    process.exit(1);
  }
  console.log('[server] MongoDB Atlas connection established successfully.');

  const PORT = process.env.PORT || 5000;
  const HOST = '0.0.0.0';

  server = app.listen(PORT, HOST, () => {
    console.log(`[server] School Management API listening on http://${HOST}:${PORT} (${env.nodeEnv})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already in use by another process.`);
      console.error(`[server] Free port ${PORT} or change PORT in backend/.env to another port.`);
    } else {
      console.error('[server] Server error:', err.message);
    }
    process.exit(1);
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
