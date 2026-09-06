import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import routes from './routes/index.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy when running behind a reverse proxy (Render / Load Balancer)
app.set('trust proxy', 1);

// Configure CORS allowed origins
const allowedOrigins = new Set([
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
]);

// Support comma-separated CLIENT_URL values
if (env.clientUrl && env.clientUrl.includes(',')) {
  env.clientUrl.split(',').forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow explicitly specified origins
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Allow all localhost origins in non-production
      if (env.nodeEnv !== 'production') {
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      // Allow all Render and Vercel deployed frontend origins
      if (
        /^https:\/\/.*\.onrender\.com$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Default: allow origin to avoid blocking legitimate deployed web clients
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(logger);

// Static files (uploaded images etc.)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoints (available at both /api/health and /health)
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Management API is running',
    data: {
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// API routes
app.use('/api', routes);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
