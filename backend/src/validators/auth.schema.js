import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(3, 'Email or username is required.').max(255),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF']).optional(),
});
