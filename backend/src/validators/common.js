import { z } from 'zod';
import {
  PAGINATION,
  GENDERS,
  ATTENDANCE_STATUSES,
  STUDENT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  DAYS_OF_WEEK,
  AUDIENCES,
  HOLIDAY_TYPES,
} from '../constants/index.js';

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required.'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const genderSchema = z.enum(GENDERS);
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export const studentStatusSchema = z.enum(STUDENT_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const dayOfWeekSchema = z.enum(DAYS_OF_WEEK);
export const audienceSchema = z.enum(AUDIENCES);
export const holidayTypeSchema = z.enum(HOLIDAY_TYPES);

export const dateSchema = z.preprocess((arg) => {
  if (arg === '' || arg === null || arg === undefined) return null;
  return arg;
}, z.union([z.date(), z.string()]).pipe(z.coerce.date()).nullable().optional());

export const dateOnlySchema = z.preprocess((arg) => {
  if (arg === '' || arg === null || arg === undefined) return null;
  return arg;
}, z.union([z.date(), z.string()]).pipe(z.coerce.date()).nullable().optional());

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address.')
  .max(255);
