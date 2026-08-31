import { z } from 'zod';
import { dateSchema, paymentMethodSchema, paymentStatusSchema } from './common.js';

export const feeCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  totalFee: z.coerce.number().nonnegative('Total fee must be non-negative.'),
  paidAmount: z.coerce.number().nonnegative('Paid amount must be non-negative.').default(0),
  paymentDate: dateSchema.nullish(),
  paymentMethod: paymentMethodSchema.default('CASH'),
  paymentStatus: paymentStatusSchema.optional(),
});

export const feeUpdateSchema = z
  .object({
    totalFee: z.coerce.number().nonnegative().optional(),
    paidAmount: z.coerce.number().nonnegative().optional(),
    paymentDate: dateSchema.nullish(),
    paymentMethod: paymentMethodSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
  })
  .strict();

export const feeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  studentId: z.string().optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
