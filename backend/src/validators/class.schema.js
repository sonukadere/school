import { z } from 'zod';

export const classCreateSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required.').max(100),
  section: z.string().trim().min(1, 'Section is required.').max(20),
  roomNumber: z.string().trim().max(30).optional().nullable(),
  classTeacherId: z.string().min(1).optional().nullable(),
});

export const classUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  section: z.string().trim().min(1).max(20).optional(),
  roomNumber: z.string().trim().max(30).optional().nullable(),
  classTeacherId: z.string().min(1).optional().nullable(),
});

export const classQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  classTeacherId: z.string().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
