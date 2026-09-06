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
 * Validate that day, month, year form a valid calendar date.
 */
export function isValidDateParts(day, month, year) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return false;
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d >= 1 && d <= daysInMonth;
}

/**
 * Unambiguously parse any date string or Date object.
 * Strictly interprets "06/09/2026" as 6 September 2026 (never 9 June 2026).
 */
export function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // 1. DD/MM/YYYY or DD-MM-YYYY
    const dmMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) {
      const day = Number(dmMatch[1]);
      const month = Number(dmMatch[2]);
      const year = Number(dmMatch[3]);
      if (!isValidDateParts(day, month, year)) return null;
      return new Date(Date.UTC(year, month - 1, day));
    }
    // 2. YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      if (!isValidDateParts(day, month, year)) return null;
      return new Date(Date.UTC(year, month - 1, day));
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Normalize any date-like value to a UTC midnight Date (date-only).
 */
export function toDateOnly(value) {
  return parseDate(value);
}

/**
 * Returns today's date normalized to UTC date-only.
 */
export function today() {
  return toDateOnly(new Date());
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
 * Format a date strictly as DD/MM/YYYY.
 */
export function formatDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const dmMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) {
      return `${dmMatch[1].padStart(2, '0')}/${dmMatch[2].padStart(2, '0')}/${dmMatch[3]}`;
    }
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getUTCDate ? d.getUTCDate() : d.getDate()).padStart(2, '0');
  const month = String((d.getUTCMonth ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
  const year = d.getUTCFullYear ? d.getUTCFullYear() : d.getFullYear();
  return `${day}/${month}/${year}`;
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
