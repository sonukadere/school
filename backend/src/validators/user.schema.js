import { z } from 'zod';
import { emailSchema } from './common.js';
import { USER_ROLES } from '../constants/index.js';

const baseUserSchema = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: emailSchema,
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
  // Prisma record id of the teacher/student/parent/staff this account is
  // linked to. The role field determines which model is linked.
  linkedToId: z.string().min(1).optional().nullable(),
};

export const userCreateSchema = z.object({
  ...baseUserSchema,
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
});

export const userUpdateSchema = z.object({
  ...baseUserSchema,
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100).optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
