import { z } from 'zod';
import { dateSchema, paymentMethodSchema, paymentStatusSchema } from './common.js';

export const saveSalaryStructureSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required.'),
  designation: z.string().trim().max(100).optional().default('Teacher'),
  basicSalary: z.coerce.number().nonnegative('Basic salary must be 0 or greater.'),
  allowances: z.coerce.number().nonnegative().optional().default(0),
  bonus: z.coerce.number().nonnegative().optional().default(0),
  deductions: z.coerce.number().nonnegative().optional().default(0),
  advance: z.coerce.number().nonnegative().optional().default(0),
  paymentMethod: paymentMethodSchema.optional().default('BANK_TRANSFER'),
  bankAccount: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
  ifscCode: z.string().trim().max(30).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  schoolId: z.string().trim().optional(),
});

export const generatePayrollSchema = z.object({
  salaryMonth: z.coerce.number().int().min(1).max(12, 'Month must be between 1 and 12.'),
  salaryYear: z.coerce.number().int().min(2000).max(2100, 'Invalid year.'),
  schoolId: z.string().trim().optional(),
});

export const markSalaryPaidSchema = z.object({
  paymentDate: dateSchema.optional(),
  paymentMethod: paymentMethodSchema.default('BANK_TRANSFER'),
  transactionId: z.string().trim().optional().nullable(),
  referenceNumber: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const payrollQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  search: z.string().trim().optional(),
  teacherId: z.string().trim().optional(),
  salaryMonth: z.coerce.number().int().min(1).max(12).optional(),
  salaryYear: z.coerce.number().int().min(2000).max(2100).optional(),
  paymentStatus: paymentStatusSchema.optional(),
  schoolId: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
