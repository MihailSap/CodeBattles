import { z } from 'zod';

const MAX_FILES = 100;
const MAX_FILE_BYTES = 1_000_000;
const MAX_TOTAL_BYTES = 5_000_000;
const MAX_ARCHIVE_BYTES = 10_000_000;
const GITHUB_PULL_REQUEST_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+\/?$/;

export const solutionUploadFormSchema = z
  .object({
    activeTab: z.enum(['manual', 'files', 'archive', 'github']),
    code: z.string().default(''),
    language: z.string().min(1, 'Выберите язык'),
    files: z.array(z.instanceof(File)).default([]),
    archive: z.instanceof(File).nullable().default(null),
    pullRequestUrl: z.string().default(''),
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

    if (values.activeTab === 'files') {
      if (values.files.length > MAX_FILES) {
        context.addIssue({
          code: 'custom',
          path: ['files'],
          message: 'Можно добавить не больше 100 файлов',
        });
      }

      if (values.files.some((file) => file.size > MAX_FILE_BYTES)) {
        context.addIssue({
          code: 'custom',
          path: ['files'],
          message: 'Размер одного файла не должен превышать 1 МБ',
        });
      }

      if (values.files.reduce((size, file) => size + file.size, 0) > MAX_TOTAL_BYTES) {
        context.addIssue({
          code: 'custom',
          path: ['files'],
          message: 'Общий размер файлов не должен превышать 5 МБ',
        });
      }
    }

    if (values.activeTab === 'archive' && !values.archive) {
      context.addIssue({
        code: 'custom',
        path: ['archive'],
        message: 'Добавьте архив',
      });
    }

    if (values.activeTab === 'archive' && values.archive) {
      if (!values.archive.name.toLowerCase().endsWith('.zip')) {
        context.addIssue({
          code: 'custom',
          path: ['archive'],
          message: 'Поддерживаются только ZIP-архивы',
        });
      }

      if (values.archive.size > MAX_ARCHIVE_BYTES) {
        context.addIssue({
          code: 'custom',
          path: ['archive'],
          message: 'Размер ZIP-архива не должен превышать 10 МБ',
        });
      }
    }

    if (values.activeTab === 'github') {
      if (!GITHUB_PULL_REQUEST_URL.test(values.pullRequestUrl.trim())) {
        context.addIssue({
          code: 'custom',
          path: ['pullRequestUrl'],
          message: 'Вставьте ссылку вида https://github.com/owner/repo/pull/123',
        });
      }
    }
  });

export type SolutionUploadFormValues = z.infer<typeof solutionUploadFormSchema>;
export type SolutionUploadFormInput = z.input<typeof solutionUploadFormSchema>;

export interface ManualSolutionUploadPayload {
  type: 'manual';
  uploadType: 'MANUAL_TEXT';
  manualCode: {
    fileName: string;
    language: string;
    content: string;
  };
}

export interface FileSolutionUploadPayload {
  type: 'files';
  uploadType: 'FILES';
  files: File[];
}

export interface ArchiveSolutionUploadPayload {
  type: 'archive';
  uploadType: 'ARCHIVE';
  archive: File;
}

export interface GitSolutionUploadPayload {
  type: 'git';
  uploadType: 'GIT_PULL_REQUEST';
  git: {
    url: string;
  };
}

export type SolutionUploadPayload =
  | ManualSolutionUploadPayload
  | FileSolutionUploadPayload
  | ArchiveSolutionUploadPayload
  | GitSolutionUploadPayload;
