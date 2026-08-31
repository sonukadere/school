import { z } from 'zod';
import { dateSchema, genderSchema, studentStatusSchema } from './common.js';

const baseStudentSchema = {
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.').max(100),
  lastName: z.string().trim().min(1, 'Last name is required.').max(100),
  gender: genderSchema.optional(),
  dob: dateSchema.nullish(),
  fatherName: z.string().trim().max(100).optional().nullable(),
  motherName: z.string().trim().max(100).optional().nullable(),
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
  address: z.string().trim().max(500).optional().nullable(),
  classId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  section: z.string().trim().max(20).optional().nullable(),
  rollNumber: z.number().int().nonnegative().optional().nullable(),
  admissionDate: dateSchema.nullish(),
  status: studentStatusSchema.optional(),
};

export const studentCreateSchema = z.object({
  ...baseStudentSchema,
  firstName: baseStudentSchema.firstName,
  lastName: baseStudentSchema.lastName,
});

export const studentUpdateSchema = z.object({
  ...baseStudentSchema,
  studentId: z.string().trim().min(1).optional(),
});

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  classId: z.string().optional(),
  section: z.string().trim().optional(),
  status: studentStatusSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
