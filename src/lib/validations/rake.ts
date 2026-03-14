import { z } from 'zod';

export const rakeCategorySchema = z.enum(['EMU', 'MEMU'], {
  message: 'Select a rake category',
});

export const rakeDetailsSchema = z.object({
  rakeNumber: z
    .string()
    .min(1, 'Rake number is required')
    .max(50, 'Rake number must be 50 characters or less'),
  rakeCategory: rakeCategorySchema.optional(),
  rakeType: z.enum(['EMU', 'MEMU', '3-Phase Rake', 'Conventional Rake'], {
    message: 'Select a rake type',
  }),
  pohType: z.enum(['1st POH', '2nd POH', '3rd POH', '4th POH'], {
    message: 'Select a POH type',
  }),
  shedId: z.string().min(1, 'Select a shed'),
  totalCoaches: z
    .number({ message: 'Enter total coaches' })
    .int('Must be a whole number')
    .min(6, 'Minimum 6 coaches')
    .max(20, 'Maximum 20 coaches'),
});

export type RakeDetailsValues = z.infer<typeof rakeDetailsSchema>;

export const coachNumberSchema = z
  .string()
  .regex(/^\d{5,8}$/, 'Coach number must be 5-8 digits');

export const coachTypeSchema = z.enum(['MC', 'TC'], {
  message: 'Select coach type (MC/TC)',
});

export const intakeDateSchema = z.string().refine(
  (val) => {
    const selected = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selected <= today;
  },
  { message: 'Future dates are not allowed' },
);

export function coachNumbersSchema(totalCoaches: number) {
  return z
    .object({
      coachNumbers: z
        .array(coachNumberSchema)
        .length(totalCoaches, `Exactly ${totalCoaches} coach numbers required`),
      coachTypes: z
        .array(coachTypeSchema)
        .length(totalCoaches, `Exactly ${totalCoaches} coach types required`),
    })
    .refine(
      (data) => new Set(data.coachNumbers).size === data.coachNumbers.length,
      'All coach numbers must be unique within the rake',
    );
}

export const fullRegistrationSchema = rakeDetailsSchema.extend({
  coachNumbers: z.array(coachNumberSchema),
  coachTypes: z.array(coachTypeSchema),
});
export const editRakeSchema = rakeDetailsSchema.extend({
  rakeId: z.string().uuid(),
  intakeDate: intakeDateSchema,
});

export type EditRakeValues = z.infer<typeof editRakeSchema>;

// rakeCategory is inherited from rakeDetailsSchema

export type FullRegistrationValues = z.infer<typeof fullRegistrationSchema>;
