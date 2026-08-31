import { z } from 'zod';
import { dateSchema, holidayTypeSchema } from './common.js';

export const holidayCreateSchema = z.object({
  name: z.string().trim().min(2, 'Holiday name must be at least 2 characters.').max(200),
  date: dateSchema,
  type: holidayTypeSchema.default('PUBLIC'),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const holidayUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    date: dateSchema.optional(),
    type: holidayTypeSchema.optional(),
    description: z.string().trim().max(1000).optional().nullable(),
  });

export const holidayQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  type: holidayTypeSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
