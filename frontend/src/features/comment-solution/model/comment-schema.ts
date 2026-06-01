import { z } from 'zod';
import { COMMENT_CATEGORY, COMMENT_SEVERITY } from '@/entities/review';

export const commentFormSchema = z.object({
  text: z.string().trim().min(1, 'Введите текст комментария'),
  category: z
    .enum([
      '',
      COMMENT_CATEGORY.BUG,
      COMMENT_CATEGORY.PERFORMANCE,
      COMMENT_CATEGORY.SECURITY,
      COMMENT_CATEGORY.ARCHITECTURE,
      COMMENT_CATEGORY.CODE_STYLE,
      COMMENT_CATEGORY.BEST_PRACTICES,
      COMMENT_CATEGORY.REFACTORING,
      COMMENT_CATEGORY.OTHER,
    ])
    .default(''),
  severity: z.enum(['', COMMENT_SEVERITY.LOW, COMMENT_SEVERITY.MEDIUM, COMMENT_SEVERITY.HIGH]).default(''),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;
export type CommentFormInput = z.input<typeof commentFormSchema>;
