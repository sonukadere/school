import { z } from 'zod';
import { dateSchema } from './common.js';

const baseTeacherSchema = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable(),
  qualification: z.string().trim().max(200).optional().nullable(),
  salary: z.coerce.number().nonnegative().max(99999999.99).optional().nullable(),
  joiningDate: dateSchema.nullish(),
  address: z.string().trim().max(500).optional().nullable(),
  subjectId: z.string().min(1).optional().nullable(),
};

export const teacherCreateSchema = z.object({
  ...baseTeacherSchema,
  createLoginAccount: z.boolean().optional().default(true),
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50).optional().nullable().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100).optional().nullable().or(z.literal('')),
});

export const teacherResetCredentialsSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
});

export const teacherUpdateSchema = z
  .object({
    ...baseTeacherSchema,
    teacherId: z.string().trim().min(1).optional(),
  });

export const teacherQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  subjectId: z.string().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
