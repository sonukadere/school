import { z } from 'zod';
import { dateSchema } from './common.js';

export const eventCreateSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  date: dateSchema,
  startTime: z.string().trim().max(10).optional().nullable(),
  endTime: z.string().trim().max(10).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
});

export const eventUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    date: dateSchema.optional(),
    startTime: z.string().trim().max(10).optional().nullable(),
    endTime: z.string().trim().max(10).optional().nullable(),
    location: z.string().trim().max(200).optional().nullable(),
  });

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  upcoming: z.coerce.boolean().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
