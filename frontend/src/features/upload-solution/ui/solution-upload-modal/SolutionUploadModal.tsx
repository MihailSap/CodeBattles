import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { CrossIcon, CheckIcon, FileIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import CodeEditor from '@/shared/ui/code-editor';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { githubLinkStatusApi, type GithubPullRequestOption } from '../../api/github-link-status-api';
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

const ARCHIVE_EXTENSIONS = '.zip';

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
      pullRequestUrl: '',
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
  const [githubLogin, setGithubLogin] = useState('');
  const [githubPullRequests, setGithubPullRequests] = useState<GithubPullRequestOption[]>([]);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);
  const [hasGithubPullRequestsError, setHasGithubPullRequestsError] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setIsGithubStatusLoading(true);
        setHasGithubPullRequestsError(false);
      }
    });

    githubLinkStatusApi
      .getLogin()
      .then(async (login) => {
        if (!isCancelled) {
          setGithubLogin(login);
          setGithubPullRequests([]);
        }

        if (!login) {
          return [];
        }

        try {
          return await githubLinkStatusApi.getOpenPullRequests();
        } catch {
          if (!isCancelled) {
            setHasGithubPullRequestsError(true);
          }

          return [];
        }
      })
      .then((pullRequests) => {
        if (!isCancelled) {
          setGithubPullRequests(pullRequests);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setGithubLogin('');
          setGithubPullRequests([]);
          setHasGithubPullRequestsError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsGithubStatusLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

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

    const deduplicatedFiles = new Map(
      [...files, ...incoming].map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])
    );

    setValue('files', [...deduplicatedFiles.values()].slice(0, MAX_FILES), {
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

  const refreshGithubPullRequests = async () => {
    if (!githubLogin || isGithubStatusLoading) {
      return;
    }

    setIsGithubStatusLoading(true);
    setHasGithubPullRequestsError(false);

    try {
      setGithubPullRequests(await githubLinkStatusApi.getOpenPullRequests());
    } catch {
      setGithubPullRequests([]);
      setHasGithubPullRequestsError(true);
    } finally {
      setIsGithubStatusLoading(false);
    }
  };

  const submit = async ({ activeTab, code, language, files, archive, pullRequestUrl }: SolutionUploadFormValues) => {
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
      };
    } else if (activeTab === 'files') {
      payload = {
        type: 'files',
        uploadType: 'FILES',
        files,
      };
    } else if (activeTab === 'archive' && archive) {
      payload = {
        type: 'archive',
        uploadType: 'ARCHIVE',
        archive,
      };
    } else if (activeTab === 'github') {
      payload = {
        type: 'git',
        uploadType: 'GIT_PULL_REQUEST',
        git: {
          url: pullRequestUrl.trim(),
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
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className={solutionUploadModalStyles.fileItem}
                      >
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
              {errors.files && <p className={solutionUploadModalStyles.error}>{errors.files.message}</p>}
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
              {errors.archive && <p className={solutionUploadModalStyles.error}>{errors.archive.message}</p>}
            </div>
          </div>

          <div
            className={solutionUploadModalStyles.tabPane}
            style={{
              display: activeTab === 'github' ? 'flex' : 'none',
            }}
          >
            <div className={solutionUploadModalStyles.gitFields}>
              <div className={solutionUploadModalStyles.githubStatus}>
                {isGithubStatusLoading ? (
                  <span>Проверяем привязку GitHub...</span>
                ) : githubLogin ? (
                  <span>
                    Подключён аккаунт <strong>@{githubLogin}</strong>. Выберите открытый public PR или вставьте ссылку
                    вручную.
                  </span>
                ) : (
                  <span>
                    GitHub не привязан. Public PR можно отправить сейчас или сначала{' '}
                    <Link to={ROUTES.profile}>привязать аккаунт в профиле</Link>.
                  </span>
                )}
              </div>
              {githubLogin && !isGithubStatusLoading && (
                <>
                  <div className={solutionUploadModalStyles.pullRequestsHeader}>
                    <span>Ваши открытые public pull request</span>
                    <button
                      className={solutionUploadModalStyles.refreshPullRequests}
                      type="button"
                      onClick={() => void refreshGithubPullRequests()}
                    >
                      Обновить
                    </button>
                  </div>
                  {hasGithubPullRequestsError ? (
                    <p className={solutionUploadModalStyles.pullRequestsState}>
                      Не удалось загрузить PR с GitHub. Проверьте соединение или вставьте ссылку вручную.
                    </p>
                  ) : githubPullRequests.length === 0 ? (
                    <p className={solutionUploadModalStyles.pullRequestsState}>
                      Не найдено открытых public PR, созданных аккаунтом @{githubLogin}. Private, закрытые и уже
                      смерженные PR в этом списке не показываются.
                    </p>
                  ) : (
                    <div className={solutionUploadModalStyles.pullRequests} aria-label="Ваши открытые pull request">
                      {githubPullRequests.map((pullRequest) => (
                        <button
                          key={pullRequest.url}
                          className={solutionUploadModalStyles.pullRequest}
                          type="button"
                          onClick={() =>
                            setValue('pullRequestUrl', pullRequest.url, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <span>{pullRequest.title}</span>
                          <small>#{pullRequest.number}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div className={solutionUploadModalStyles.field}>
                <input
                  className={[
                    solutionUploadModalStyles.input,
                    errors.pullRequestUrl ? solutionUploadModalStyles.isError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="url"
                  placeholder="https://github.com/owner/repository/pull/123"
                  aria-label="Ссылка на GitHub pull request"
                  {...register('pullRequestUrl')}
                />
                {errors.pullRequestUrl && (
                  <p className={solutionUploadModalStyles.error}>{errors.pullRequestUrl.message}</p>
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
