import { z } from 'zod';
const scoreSchema = z.number().min(1, 'Поставьте оценку').max(5, 'Оценка должна быть от 1 до 5');
export const finalReviewFormSchema = z.object({
  architecture: scoreSchema,
  readability: scoreSchema,
  testability: scoreSchema,
  scalability: scoreSchema,
  comment: z.string().trim().min(20, 'Комментарий должен быть не короче 20 символов'),
  verdict: z.enum(['APPROVED', 'REWORK'], {
    message: 'Выберите вердикт',
  }),
  revealName: z.boolean().default(false),
});
