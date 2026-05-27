import { z } from 'zod';

export const solutionUploadFormSchema = z
  .object({
    activeTab: z.enum(['manual', 'files', 'archive', 'github']),
    code: z.string().default(''),
    language: z.string().min(1, 'Выберите язык'),
    files: z.array(z.instanceof(File)).default([]),
    archive: z.instanceof(File).nullable().default(null),
    sourceBranch: z.string().default(''),
    targetBranch: z.string().default(''),
    repositoryName: z.string().default(''),
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

    if (values.activeTab === 'github') {
      if (!z.string().url().safeParse(values.repositoryName).success) {
        context.addIssue({
          code: 'custom',
          path: ['repositoryName'],
          message: 'Укажите корректную ссылку на репозиторий',
        });
      }

      if (!values.sourceBranch.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['sourceBranch'],
          message: 'Укажите исходную ветку',
        });
      }

      if (!values.targetBranch.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['targetBranch'],
          message: 'Укажите целевую ветку',
        });
      }
    }
  });

export type SolutionUploadFormValues = z.infer<typeof solutionUploadFormSchema>;
export type SolutionUploadFormInput = z.input<typeof solutionUploadFormSchema>;

export interface UploadedFileSummary {
  name: string;
  isFileObj?: boolean;
  isDiff?: boolean;
  content?: string;
}

export interface ManualSolutionUploadPayload {
  type: 'manual';
  uploadType: 'MANUAL_TEXT';
  manualCode: {
    fileName: string;
    language: string;
    content: string;
  };
  files: UploadedFileSummary[];
}

export interface FileSolutionUploadPayload {
  type: 'files' | 'archive';
  files: UploadedFileSummary[];
}

export interface GitSolutionUploadPayload {
  type: 'git';
  uploadType: 'GIT_PULL_REQUEST';
  git: {
    sourceBranch: string;
    targetBranch: string;
    repositoryName: string;
  };
}

export type SolutionUploadPayload = ManualSolutionUploadPayload | FileSolutionUploadPayload | GitSolutionUploadPayload;
