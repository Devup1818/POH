import { z } from 'zod';

// Work item status update
export const updateWorkItemStatusSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']),
});

// Must change item replacement
export const replaceMustChangeItemSchema = z.object({
  itemId: z.string().uuid(),
  oldPartDetail: z.string().min(1, 'Old part detail is required'),
  newPartDetail: z.string().min(1, 'New part detail is required'),
});

// Test result recording
export const recordTestResultSchema = z.object({
  testId: z.string().uuid(),
  measuredValues: z.string().min(1, 'Measured values required'),
  passed: z.boolean(),
  notes: z.string().optional(),
});

// M4 coordination entry
export const addM4CoordinationSchema = z.object({
  coachId: z.string().uuid(),
  activityType: z.enum(['Lifting', 'Lowering', 'Shifting', 'Crane Operation', 'Other']),
  supportedSection: z.string().min(1),
  notes: z.string().optional(),
});

// Section completion validation
export const completeSectionSchema = z.object({
  coachId: z.string().uuid(),
  sectionCode: z.enum(['M5', 'M6', 'M8', 'E2', 'E3', 'E5', 'M2', 'M3', 'Painting', 'M4']),
});

export type UpdateWorkItemStatusInput = z.infer<typeof updateWorkItemStatusSchema>;
export type ReplaceMustChangeItemInput = z.infer<typeof replaceMustChangeItemSchema>;
export type RecordTestResultInput = z.infer<typeof recordTestResultSchema>;
export type AddM4CoordinationInput = z.infer<typeof addM4CoordinationSchema>;
export type CompleteSectionInput = z.infer<typeof completeSectionSchema>;
