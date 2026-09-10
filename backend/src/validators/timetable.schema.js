import { z } from 'zod';
import { dayOfWeekSchema } from './common.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const timeSchema = z.string().regex(TIME_PATTERN, 'Time must be in HH:mm format.');

export const timetableCreateSchema = z
  .object({
    classId: z.string().min(1, 'Class is required.'),
    subjectId: z.string().min(1, 'Subject is required.'),
    teacherId: z.string().min(1).optional().nullable(),
    periodId: z.string().min(1).optional().nullable(),
    roomNumber: z.string().trim().max(50).optional().nullable(),
    day: dayOfWeekSchema,
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      // If startTime/endTime not provided, periodId must be provided
      return !!data.periodId;
    },
    {
      message: 'Either valid periodId or startTime & endTime (with startTime < endTime) must be provided.',
      path: ['endTime'],
    }
  );

export const timetableUpdateSchema = z
  .object({
    classId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional().nullable(),
    periodId: z.string().min(1).optional().nullable(),
    roomNumber: z.string().trim().max(50).optional().nullable(),
    day: dayOfWeekSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
  })
  .refine(
    (data) => !data.startTime || !data.endTime || data.startTime < data.endTime,
    {
      message: 'Start time must be before end time.',
      path: ['endTime'],
    }
  );

export const timetableQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  periodId: z.string().optional(),
  day: dayOfWeekSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const periodCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'Period name is required.').max(50),
    periodNumber: z.coerce.number().int().positive().optional().nullable(),
    startTime: timeSchema,
    endTime: timeSchema,
    isBreak: z.boolean().optional().default(false),
    sortOrder: z.coerce.number().int().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time.',
    path: ['endTime'],
  });

export const periodUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    periodNumber: z.coerce.number().int().positive().optional().nullable(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    isBreak: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  })
  .refine((data) => !data.startTime || !data.endTime || data.startTime < data.endTime, {
    message: 'Start time must be before end time.',
    path: ['endTime'],
  });

export const periodGenerateSchema = z.object({
  schoolStartTime: timeSchema.optional().default('08:00'),
  periodDuration: z.coerce.number().int().min(15).max(120).optional().default(45),
  totalPeriods: z.coerce.number().int().min(1).max(15).optional().default(7),
  breakStartTime: timeSchema.optional().default('10:15'),
  breakEndTime: timeSchema.optional().default('10:30'),
});

