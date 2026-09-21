import { z } from 'zod';

export const settingUpsertSchema = z.object({
  schoolName: z.string().trim().min(2, 'School name is required.').max(200),
  schoolLogo: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z
    .string()
    .trim()
    .url('Invalid URL.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  academicYear: z.string().trim().max(30).optional().nullable(),
  timetableStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format.').optional().nullable(),
  timetableEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format.').optional().nullable(),
  periodDuration: z.coerce.number().int().min(15).max(180).optional().nullable(),
  totalPeriods: z.coerce.number().int().min(1).max(20).optional().nullable(),
  breakStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Break start time must be in HH:mm format.').optional().nullable(),
  breakEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Break end time must be in HH:mm format.').optional().nullable(),
  workingDays: z.array(z.string()).optional(),
});

export const smtpUpdateSchema = z.object({
  host: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  port: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  secure: z.boolean().optional(),
  user: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  pass: z.string().optional().nullable().or(z.literal('')),
  fromName: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  fromEmail: z.string().trim().email('Invalid sender email').optional().nullable().or(z.literal('')),
});

export const smtpTestSchema = z.object({
  recipientEmail: z.string().trim().email('Valid recipient email address is required.'),
  host: z.string().trim().optional(),
  port: z.coerce.number().int().optional(),
  secure: z.boolean().optional(),
  user: z.string().trim().optional(),
  pass: z.string().optional(),
  fromName: z.string().trim().optional(),
  fromEmail: z.string().trim().optional(),
});
