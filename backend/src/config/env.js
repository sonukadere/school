import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Synchronize DATABASE_URL and MONGODB_URI for Prisma and MongoDB Atlas compatibility
const resolvedMongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (resolvedMongoUri) {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolvedMongoUri;
  }
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = resolvedMongoUri;
  }
}

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL || resolvedMongoUri,
  mongodbUri: process.env.MONGODB_URI || resolvedMongoUri,

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@school.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: process.env.ADMIN_NAME || 'System Administrator',
  },

  // Payment gateway secrets (Backend only - NEVER exposed to frontend)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
};

export default env;
