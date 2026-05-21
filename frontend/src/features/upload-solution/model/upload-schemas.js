import { z } from 'zod';
export const gitUploadFormSchema = z.object({
  repository: z.string().min(1, 'Выберите репозиторий'),
  targetBranch: z.string().min(1, 'Выберите целевую ветку'),
  pullRequest: z.string().min(1, 'Выберите Pull Request'),
});
export const solutionUploadFormSchema = z
  .object({
    activeTab: z.enum(['manual', 'files', 'archive']),
    code: z.string().default(''),
    language: z.string().min(1, 'Выберите язык'),
    files: z.array(z.instanceof(File)).default([]),
    archive: z.instanceof(File).nullable().default(null),
  })
  .superRefine((values, context) => {
    if (values.activeTab === 'manual' && values.code.trim() === '') {
      context.addIssue({
        code: 'custom',
        path: ['code'],
        message: 'Введите код решения',
      });
    }

    if (values.activeTab === 'files' && values.files.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['files'],
        message: 'Добавьте хотя бы один файл',
      });
    }

    if (values.activeTab === 'archive' && !values.archive) {
      context.addIssue({
        code: 'custom',
        path: ['archive'],
        message: 'Добавьте архив',
      });
    }
  });
