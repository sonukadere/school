import { z } from 'zod';

export const tcCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required.'),
  tcNumber: z.string().trim().optional(),
  issueDate: z.string().or(z.date()).optional(),
  leavingDate: z.string().or(z.date()).optional(),
  lastClass: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
  conduct: z.string().trim().max(100).optional(),
  resultStatus: z.string().trim().max(50).optional(),
  remarks: z.string().trim().max(1000).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'GENERATED', 'CANCELLED']).optional(),
});

export const tcUpdateSchema = z.object({
  tcNumber: z.string().trim().optional(),
  issueDate: z.string().or(z.date()).optional(),
  leavingDate: z.string().or(z.date()).optional(),
  lastClass: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
  conduct: z.string().trim().max(100).optional(),
  resultStatus: z.string().trim().max(50).optional(),
  remarks: z.string().trim().max(1000).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'GENERATED', 'CANCELLED']).optional(),
});

export const tcQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'GENERATED', 'CANCELLED']).optional(),
  studentId: z.string().optional(),
  classId: z.string().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
