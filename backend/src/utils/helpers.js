import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from './ApiError.js';

/**
 * Parse pagination query params (page, limit).
 */
export function getPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a pagination meta block.
 */
export function getPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

/**
 * Filter a where object so only whitelisted keys are kept.
 */
export function pick(object = {}, keys = []) {
  const result = {};
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null && object[key] !== '') {
      result[key] = object[key];
    }
  }
  return result;
}

/**
 * Return a where clause fragment that excludes soft-deleted rows.
 */
export function notDeleted() {
  return {
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
  };
}

/**
 * Build a `contains` search filter for text fields.
 */
export function searchFilter(fields, search, extra = {}) {
  if (!search) return extra;
  return {
    ...extra,
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })),
  };
}

/**
 * Hash a plain-text password with bcrypt.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptSaltRounds);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT access token for the given user.
 */
export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Verify and decode a JWT access token.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from an Authorization header.
 */
export function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

/**
 * Serialize a user object for safe API responses (strip secrets).
 */
export function serializeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

/**
 * Normalize any date-like value to a UTC midnight Date (date-only).
 */
export function toDateOnly(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Add days to a Date (returns a new Date).
 */
export function addDays(value, days) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Map Prisma known unique-constraint errors to a friendly ApiError.
 */
export function handlePrismaError(error) {
  if (error && error.code === 'P2002') {
    const target = error.meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : target;
    return ApiError.conflict(`A record with the same value already exists${field ? ` (${field})` : ''}.`);
  }
  if (error && error.code === 'P2025') {
    return ApiError.notFound('Record not found.');
  }
  if (error && error.code === 'P2003') {
    return ApiError.badRequest('Referenced record does not exist.');
  }
  return null;
}
