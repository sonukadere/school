import { randomUUID } from 'crypto';
import { prisma } from '../config/database.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import {
  comparePassword,
  hashPassword,
  notDeleted,
  serializeUser,
  signToken,
} from '../utils/helpers.js';

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  password: true,
  name: true,
  role: true,
  avatar: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  teacher: { select: { id: true, teacherId: true, name: true } },
  student: {
    select: { id: true, studentId: true, firstName: true, lastName: true, classId: true, parentId: true },
  },
  parent: {
    select: {
      id: true,
      parentId: true,
      firstName: true,
      lastName: true,
      children: {
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  staff: { select: { id: true, staffId: true, name: true, position: true } },
};

const findActiveUser = async (identifier) => {
  const clean = (identifier || '').trim();
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();

  return prisma.user.findFirst({
    where: {
      ...notDeleted(),
      OR: [
        { email: cleanLower },
        { username: clean },
        { username: cleanLower },
        {
          student: {
            is: {
              OR: [
                { studentId: clean },
                { studentId: cleanUpper },
              ],
            },
          },
        },
        {
          teacher: {
            is: {
              OR: [
                { teacherId: clean },
                { teacherId: cleanUpper },
              ],
            },
          },
        },
        {
          parent: {
            is: {
              OR: [
                { parentId: clean },
                { parentId: cleanUpper },
              ],
            },
          },
        },
      ],
    },
    select: USER_SELECT,
  });
};

/**
 * Validate credentials and return the signed token + user profile.
 * Accepts either the account email or username.
 */
export async function login(identifier, password) {
  const user = await findActiveUser(identifier);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been disabled. Contact the administrator.');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    jti: randomUUID(),
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user: serializeUser(user),
  };
}

/**
 * Create a new user account (admin only).
 */
export async function register(data) {
  const existing = await prisma.user.findFirst({
    where: {
      ...notDeleted(),
      OR: [{ email: data.email }, { username: data.username }],
    },
  });
  if (existing) {
    throw ApiError.conflict('A user with this email or username already exists.');
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username: data.username,
      password: hashed,
      role: data.role || 'ADMIN',
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
      student: {
        select: { id: true, studentId: true, firstName: true, lastName: true, classId: true, parentId: true },
      },
      parent: { select: { id: true, parentId: true, firstName: true, lastName: true } },
      staff: { select: { id: true, staffId: true, name: true, position: true } },
    },
  });

  return serializeUser(user);
}

/**
 * Logout is stateless: the client discards the token and we
 * blacklist its jti so it can no longer be used.
 */
export async function logout(jti, expiresAtMs) {
  const { blacklistToken } = await import('../utils/tokenBlacklist.js');
  const remaining = Math.max(expiresAtMs - Date.now(), 0);
  blacklistToken(jti, remaining);
}

/**
 * Return the currently authenticated user's profile.
 */
export async function getProfile(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...notDeleted() },
    select: USER_SELECT,
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return serializeUser(user);
}

/**
 * Public self-registration for students.
 */
export async function registerStudent(data) {
  const { createStudent } = await import('./student.service.js');

  // Resolve classId if className & section provided
  let classId = data.classId;
  if (!classId && data.className) {
    const cls = await prisma.class.findFirst({
      where: {
        name: data.className,
        ...(data.section ? { section: data.section } : {}),
        ...notDeleted(),
      },
    });
    if (cls) classId = cls.id;
  }

  const studentResult = await createStudent({
    ...data,
    classId: classId || null,
    createLoginAccount: true,
  });

  if (!studentResult.userId) {
    throw ApiError.internal('Failed to create user account for student.');
  }

  const studentUser = await prisma.user.findFirst({
    where: { id: studentResult.userId, ...notDeleted() },
    select: USER_SELECT,
  });

  const token = signToken({
    sub: studentUser.id,
    role: studentUser.role,
    jti: randomUUID(),
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user: serializeUser(studentUser),
    student: studentResult,
    credentials: studentResult.credentials,
  };
}

/**
 * Change password for authenticated user and reset mustChangePassword flag.
 */
export async function changePassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters.');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...notDeleted() },
    select: { id: true, password: true, role: true },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const matches = await comparePassword(currentPassword, user.password);
  if (!matches) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
    select: USER_SELECT,
  });

  const token = signToken({
    sub: updatedUser.id,
    role: updatedUser.role,
    jti: randomUUID(),
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user: serializeUser(updatedUser),
    message: 'Password changed successfully.',
  };
}

