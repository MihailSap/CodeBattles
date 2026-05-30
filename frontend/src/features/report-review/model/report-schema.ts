import { z } from 'zod';
import { REPORT_REASONS } from '@/entities/review';

export const reportFormSchema = z.object({
  selectedReason: z.union([z.literal(''), z.enum(REPORT_REASONS)]).refine((value) => value !== '', {
    message: 'Выберите причину жалобы',
  }),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
export type ReportFormInput = z.input<typeof reportFormSchema>;
