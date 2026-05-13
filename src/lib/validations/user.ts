import { z } from 'zod';

const ROLES = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer', 'Technician', 'Viewer'] as const;

const sectionAssignmentSchema = z.object({
  shed_id: z.string().uuid(),
  section_name: z.string().min(1, 'Section name is required'),
  sub_section: z.string().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(100, 'Username must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be 200 characters or less'),
  role: z.enum(ROLES, { message: 'Select a role' }),
  shed_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one shed'),
  section_assignments: z
    .array(sectionAssignmentSchema)
    .default([]),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be 200 characters or less'),
  role: z.enum(ROLES, { message: 'Select a role' }),
  shed_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one shed'),
  section_assignments: z
    .array(sectionAssignmentSchema)
    .default([]),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;
