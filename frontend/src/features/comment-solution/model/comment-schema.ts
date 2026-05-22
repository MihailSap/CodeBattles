import { z } from 'zod';

export const commentFormSchema = z.object({
  text: z.string().trim().min(15, 'Комментарий должен быть не короче 15 символов'),
  category: z.string().default(''),
  severity: z.string().default(''),
});
