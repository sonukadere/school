import { z } from 'zod';
import { dateSchema } from './common.js';

export const examCreateSchema = z.object({
  name: z.string().trim().min(2, 'Exam name must be at least 2 characters.').max(150),
  classId: z.string().min(1, 'Class is required.'),
  startDate: dateSchema,
  endDate: dateSchema,
});

export const examUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    classId: z.string().min(1).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
  })
  .strict();

export const examQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  classId: z.string().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
