import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEvent, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CrossIcon, CheckIcon, FileIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import CodeEditor from '@/shared/ui/code-editor';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import {
  solutionUploadFormSchema,
  type SolutionUploadFormInput,
  type SolutionUploadFormValues,
  type SolutionUploadPayload,
} from '../../model/upload-schemas';
import solutionUploadModalStyles from './SolutionUploadModal.module.scss';

const TABS = [
  {
    key: 'manual',
    label: 'Ручной ввод',
  },
  {
    key: 'files',
    label: 'Загрузка файлов',
  },
  {
    key: 'archive',
    label: 'Загрузка архивом',
  },
  {
    key: 'github',
    label: 'GitHub',
  },
];

const MAX_FILES = 100;
const MAX_CODE_LENGTH = 100000;

const ALLOWED_FILE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.cs',
  '.cpp',
  '.c',
  '.h',
  '.hpp',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  '.md',
  '.txt',
  '.sql',
  '.rb',
  '.go',
  '.rs',
  '.swift',
  '.kt',
  '.php',
  '.sh',
  '.bash',
  '.vue',
  '.svelte',
];

const ARCHIVE_EXTENSIONS = '.zip,.rar,.tar,.gz,.7z,.bz2,.xz';

const LANGUAGE_EXTENSION_MAP = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  csharp: 'cs',
  cpp: 'cpp',
  go: 'go',
  rust: 'rs',
  swift: 'swift',
  kotlin: 'kt',
  php: 'php',
  ruby: 'rb',
  html: 'html',
  css: 'css',
  sql: 'sql',
  yaml: 'yaml',
  json: 'json',
  markdown: 'md',
  shell: 'sh',
  xml: 'xml',
  plaintext: 'txt',
} as const;

interface SolutionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SolutionUploadPayload) => void | Promise<void>;
  isSubmitting: boolean;
}

const getLanguageExtension = (language: string): string => {
  const matchedExtension = Object.entries(LANGUAGE_EXTENSION_MAP).find(([name]) => name === language)?.[1];

  return matchedExtension ?? 'txt';
};

const SolutionUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: SolutionUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    register,
    formState: { errors, isValid },
  } = useForm<SolutionUploadFormInput, unknown, SolutionUploadFormValues>({
    resolver: zodResolver(solutionUploadFormSchema),
    defaultValues: {
      activeTab: 'manual',
      code: '',
      language: 'javascript',
      files: [],
      archive: null,
      sourceBranch: '',
      targetBranch: '',
      repositoryName: '',
    },
    mode: 'onChange',
  });

  const [watchedActiveTab, watchedFiles, watchedArchive] = useWatch({
    control,
    name: ['activeTab', 'files', 'archive'],
  });

  const activeTab = watchedActiveTab ?? 'manual';
  const files = watchedFiles ?? [];
  const archive = watchedArchive ?? null;

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCodeChange = (onChange: (value: string) => void) => (value: string | undefined) => {
    const nextValue = value ?? '';

    if (nextValue.length <= MAX_CODE_LENGTH) {
      onChange(nextValue);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);

    setValue('files', [...files, ...incoming].slice(0, MAX_FILES), {
      shouldDirty: true,
      shouldValidate: true,
    });

    e.target.value = '';
  };

  const handleArchiveChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setValue('archive', e.target.files[0], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setValue(
      'files',
      files.filter((_, itemIndex) => itemIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const isSubmitDisabled = () => {
    return isSubmitting || !isValid;
  };

  const submit = async ({
    activeTab,
    code,
    language,
    files,
    archive,
    sourceBranch,
    targetBranch,
    repositoryName,
  }: SolutionUploadFormValues) => {
    if (isSubmitDisabled()) return;
    let payload: SolutionUploadPayload;

    if (activeTab === 'manual') {
      const fileName = `solution.${getLanguageExtension(language)}`;

      payload = {
        type: 'manual',
        uploadType: 'MANUAL_TEXT',
        manualCode: {
          fileName,
          language,
          content: code,
        },
        files: [
          {
            name: fileName,
            content: code,
          },
        ],
      };
    } else if (activeTab === 'files') {
      payload = {
        type: 'files',
        files: files.map((file) => ({
          name: file.name,
          isFileObj: true,
        })),
      };
    } else if (activeTab === 'archive' && archive) {
      payload = {
        type: 'archive',
        files: [
          {
            name: archive.name,
            isFileObj: true,
          },
        ],
      };
    } else if (activeTab === 'github') {
      payload = {
        type: 'git',
        uploadType: 'GIT_PULL_REQUEST',
        git: {
          sourceBranch,
          targetBranch,
          repositoryName,
        },
      };
    } else {
      return;
    }

    await onSubmit(payload);
  };

  const fileAccept = ALLOWED_FILE_EXTENSIONS.join(',');

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={solutionUploadModalStyles.backdrop}
      dialogClassName={solutionUploadModalStyles.root}
      ariaLabel="Загрузка решения"
      title="Загрузка решения"
      headerClassName={solutionUploadModalStyles.head}
      titleClassName={solutionUploadModalStyles.title}
      closeClassName={solutionUploadModalStyles.close}
    >
      <div className={solutionUploadModalStyles.tabsWrap}>
        <Controller
          control={control}
          name="activeTab"
          render={({ field }) => (
            <EntityTabs
              tabs={TABS}
              activeKey={field.value}
              onChange={field.onChange}
              wrapClassName={solutionUploadModalStyles.centeredTabs}
            />
          )}
        />
      </div>

      <form className={solutionUploadModalStyles.content} onSubmit={handleSubmit(submit)}>
        <div className={solutionUploadModalStyles.tabContent}>
          <div
            className={solutionUploadModalStyles.tabPane}
            style={{
              display: activeTab === 'manual' ? 'flex' : 'none',
            }}
          >
            <div className={solutionUploadModalStyles.manual}>
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <Controller
                    control={control}
                    name="language"
                    render={({ field: languageField }) => (
                      <CodeEditor
                        value={field.value ?? ''}
                        onChange={handleCodeChange(field.onChange)}
                        language={languageField.value ?? 'javascript'}
                        onLanguageChange={languageField.onChange}
                      />
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div
            className={solutionUploadModalStyles.tabPane}
            style={{
              display: activeTab === 'files' ? 'flex' : 'none',
            }}
          >
            <div className={solutionUploadModalStyles.files}>
              <input type="file" multiple accept={fileAccept} hidden ref={fileInputRef} onChange={handleFileChange} />

              {files.length === 0 ? (
                <div className={solutionUploadModalStyles.emptyState}>
                  <button
                    type="button"
                    className={solutionUploadModalStyles.addBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Добавить файлы +
                  </button>
                </div>
              ) : (
                <>
                  <div className={solutionUploadModalStyles.filesList}>
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className={solutionUploadModalStyles.fileItem}>
                        <div className={solutionUploadModalStyles.fileInfo}>
                          <span className={solutionUploadModalStyles.fileIcon}>
                            <FileIcon />
                          </span>
                          <span className={solutionUploadModalStyles.fileName}>{file.name}</span>
                        </div>
                        <button
                          type="button"
                          className={solutionUploadModalStyles.fileRemove}
                          onClick={() => removeFile(idx)}
                        >
                          <CrossIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                  {files.length < MAX_FILES && (
                    <button
                      type="button"
                      className={[solutionUploadModalStyles.addBtn, solutionUploadModalStyles.isBottom].join(' ')}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Добавить файлы +
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={solutionUploadModalStyles.tabPane}
            style={{
              display: activeTab === 'archive' ? 'flex' : 'none',
            }}
          >
            <div className={solutionUploadModalStyles.archive}>
              <input
                type="file"
                accept={ARCHIVE_EXTENSIONS}
                hidden
                ref={archiveInputRef}
                onChange={handleArchiveChange}
              />

              {!archive ? (
                <div className={solutionUploadModalStyles.emptyState}>
                  <button
                    type="button"
                    className={solutionUploadModalStyles.addBtn}
                    onClick={() => archiveInputRef.current?.click()}
                  >
                    Добавить архив +
                  </button>
                </div>
              ) : (
                <div className={solutionUploadModalStyles.emptyState}>
                  <div className={solutionUploadModalStyles.archiveItem}>
                    <span className={solutionUploadModalStyles.archiveName}>{archive.name}</span>
                    <button
                      type="button"
                      className={solutionUploadModalStyles.fileRemove}
                      onClick={() =>
                        setValue('archive', null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <CrossIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={solutionUploadModalStyles.tabPane}
            style={{
              display: activeTab === 'github' ? 'flex' : 'none',
            }}
          >
            <div className={solutionUploadModalStyles.gitFields}>
              <div className={solutionUploadModalStyles.field}>
                <input
                  className={[
                    solutionUploadModalStyles.input,
                    errors.repositoryName ? solutionUploadModalStyles.isError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="url"
                  placeholder="Ссылка на GitHub-репозиторий*"
                  aria-label="Ссылка на GitHub-репозиторий"
                  {...register('repositoryName')}
                />
                {errors.repositoryName && (
                  <p className={solutionUploadModalStyles.error}>{errors.repositoryName.message}</p>
                )}
              </div>
              <div className={solutionUploadModalStyles.field}>
                <input
                  className={[
                    solutionUploadModalStyles.input,
                    errors.sourceBranch ? solutionUploadModalStyles.isError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="text"
                  placeholder="Исходная ветка*"
                  aria-label="Исходная ветка"
                  {...register('sourceBranch')}
                />
                {errors.sourceBranch && (
                  <p className={solutionUploadModalStyles.error}>{errors.sourceBranch.message}</p>
                )}
              </div>
              <div className={solutionUploadModalStyles.field}>
                <input
                  className={[
                    solutionUploadModalStyles.input,
                    errors.targetBranch ? solutionUploadModalStyles.isError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="text"
                  placeholder="Целевая ветка*"
                  aria-label="Целевая ветка"
                  {...register('targetBranch')}
                />
                {errors.targetBranch && (
                  <p className={solutionUploadModalStyles.error}>{errors.targetBranch.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={solutionUploadModalStyles.footer}>
          <button type="submit" className={solutionUploadModalStyles.submitBtn} disabled={isSubmitDisabled()}>
            <span className={solutionUploadModalStyles.submitIcon}>
              <CheckIcon />
            </span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default SolutionUploadModal;
