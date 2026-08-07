import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { extractBearerToken, notDeleted } from '../utils/helpers.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

/**
 * Verifies the JWT in the Authorization header, loads the user,
 * and attaches it to req.user. Rejects expired/blacklisted tokens
 * and inactive/deleted accounts.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw ApiError.unauthorized('No token provided. Please log in.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid token.');
  }

  if (isBlacklisted(payload.jti)) {
    throw ApiError.unauthorized('Token has been revoked. Please log in again.');
  }

  req.token = payload;

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      teacher: { select: { id: true, teacherId: true, name: true } },
      student: { select: { id: true, studentId: true, firstName: true, lastName: true, classId: true, parentId: true } },
      parent: { select: { id: true, parentId: true, firstName: true, lastName: true } },
      staff: { select: { id: true, staffId: true, name: true, position: true } },
    },
  });

  if (!user) {
    throw ApiError.unauthorized('User account no longer exists or is inactive.');
  }

  req.user = user;
  next();
});

export default authenticate;
