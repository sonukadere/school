import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(2, 'Email, username, or Student ID is required.').max(255),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF']).optional(),
});

export const studentRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.').max(100),
  lastName: z.string().trim().min(1, 'Last name is required.').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address.').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().default('OTHER'),
  dob: z.string().optional().nullable().or(z.literal('')),
  className: z.string().trim().optional().nullable().or(z.literal('')),
  section: z.string().trim().optional().nullable().or(z.literal('')),
  fatherName: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  motherName: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  username: z.string().trim().min(3, 'Login ID / Username must be at least 3 characters.').max(50).optional().nullable().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
});
