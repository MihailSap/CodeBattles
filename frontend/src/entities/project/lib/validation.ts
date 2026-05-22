import { z } from 'zod';
import { TASK_REVIEW_TYPE } from '../model';

const URL_PATTERN = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, 'Ссылка должна быть не длиннее 500 символов')
  .refine((value: LegacyValue) => !value || URL_PATTERN.test(value), 'Введите корректную ссылку');

const isPastDateTime = (value: LegacyValue) => {
  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) || parsed < Date.now();
};

export const projectCreateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Название проекта не может быть пустым')
    .max(100, 'Название проекта должно быть не длиннее 100 символов'),
  description: z.string().max(3000, 'Описание должно быть не длиннее 3000 символов').default(''),
  repositoryUrl: optionalUrlSchema,
  stack: z.array(z.unknown()).default([]),
  privacy: z.string().min(1, 'Выберите приватность'),
});
export const projectSettingsFormSchema = projectCreateFormSchema.extend({
  aiReviewEnabled: z.boolean().default(false),
});
export const taskCreateFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Название задачи не может быть пустым')
      .max(100, 'Название задачи должно быть короче 100 символов'),
    description: z.string().max(4000, 'Описание должно быть не длиннее 4000 символов').default(''),
    requirements: z.string().max(4000, 'Требования должны быть не длиннее 4000 символов').default(''),
    evaluationCriteria: z.string().max(4000, 'Критерии должны быть не длиннее 4000 символов').default(''),
    deadline: z
      .string()
      .min(1, 'Выберите дедлайн')
      .refine((value: LegacyValue) => !isPastDateTime(value), 'Дедлайн не может быть в прошлом'),
    reviewType: z.string().min(1, 'Выберите тип ревью'),
    assigneeIds: z.array(z.union([z.string(), z.number()])).min(1, 'Выберите хотя бы одного исполнителя'),
    reviewerIds: z.array(z.union([z.string(), z.number()])).default([]),
  })
  .superRefine((values: LegacyValue, context: LegacyValue) => {
    if (values.reviewType === TASK_REVIEW_TYPE.MANUAL_ASSIGNEES && values.reviewerIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['reviewerIds'],
        message: 'Выберите хотя бы одного ревьюера',
      });
    }
  });
export const taskSettingsFormSchema = z
  .object({
    name: taskCreateFormSchema.shape.name,
    description: taskCreateFormSchema.shape.description,
    requirements: taskCreateFormSchema.shape.requirements,
    evaluationCriteria: taskCreateFormSchema.shape.evaluationCriteria,
    deadline: z.string().min(1, 'Выберите дедлайн'),
    reviewType: taskCreateFormSchema.shape.reviewType,
    assigneeIds: taskCreateFormSchema.shape.assigneeIds,
    reviewerIds: taskCreateFormSchema.shape.reviewerIds,
  })
  .superRefine((values: LegacyValue, context: LegacyValue) => {
    if (values.reviewType === TASK_REVIEW_TYPE.MANUAL_ASSIGNEES && values.reviewerIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['reviewerIds'],
        message: 'Выберите хотя бы одного ревьюера',
      });
    }
  });
