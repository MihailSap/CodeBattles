import { z } from 'zod';
import { REPORT_REASON } from '@/entities/review';

export const reportFormSchema = z
  .object({
    selectedReason: z.string().min(1, 'Выберите причину жалобы'),
    customText: z.string().default(''),
  })
  .superRefine((values, context) => {
    if (values.selectedReason === REPORT_REASON.OTHER && values.customText.trim().length < 10) {
      context.addIssue({
        code: 'custom',
        path: ['customText'],
        message: 'Опишите причину минимум 10 символами',
      });
    }
  });
