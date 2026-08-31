import { z } from 'zod';
import { audienceSchema, dateSchema } from './common.js';

export const noticeCreateSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  audience: audienceSchema.default('ALL'),
  publishDate: dateSchema.optional(),
  expiryDate: dateSchema.nullish(),
});

export const noticeUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    audience: audienceSchema.optional(),
    publishDate: dateSchema.optional(),
    expiryDate: dateSchema.nullish(),
  });

export const noticeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  audience: audienceSchema.optional(),
  active: z.coerce.boolean().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
