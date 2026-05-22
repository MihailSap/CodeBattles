import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CrossIcon, CheckIcon, FileIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import CodeEditor from '@/shared/ui/code-editor';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { solutionUploadFormSchema } from '../../model/upload-schemas';
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
};

const SolutionUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LegacyValue) => {
  const fileInputRef = useRef<LegacyValue>(null);
  const archiveInputRef = useRef<LegacyValue>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid },
  } = useForm<LegacyValue>({
    resolver: zodResolver(solutionUploadFormSchema) as LegacyValue,
    defaultValues: {
      activeTab: 'manual',
      code: '',
      language: 'javascript',
      files: [],
      archive: null,
    },
    mode: 'onChange',
  });

  const [activeTab = 'manual', files = [], archive = null] = useWatch({
    control,
    name: ['activeTab', 'files', 'archive'],
  }) as [string, File[], File | null];

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCodeChange = (onChange: LegacyValue) => (value: LegacyValue) => {
    if (value.length <= MAX_CODE_LENGTH) {
      onChange(value);
    }
  };

  const handleFileChange = (e: LegacyValue) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);

    setValue('files', [...files, ...incoming].slice(0, MAX_FILES), {
      shouldDirty: true,
      shouldValidate: true,
    });

    e.target.value = '';
  };

  const handleArchiveChange = (e: LegacyValue) => {
    if (e.target.files && e.target.files.length > 0) {
      setValue('archive', e.target.files[0], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    e.target.value = '';
  };

  const removeFile = (index: LegacyValue) => {
    setValue(
      'files',
      files.filter((_: LegacyValue, i: LegacyValue) => i !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const isSubmitDisabled = () => {
    return isSubmitting || !isValid;
  };

  const submit = async ({ activeTab, code, language, files, archive }: LegacyValue) => {
    if (isSubmitDisabled()) return;
    let payload: LegacyValue = {};

    if (activeTab === 'manual') {
      payload = {
        type: 'manual',
        files: [
          {
            name: `solution.${(LANGUAGE_EXTENSION_MAP as LegacyValue)[language] || 'txt'}`,
            content: code,
          },
        ],
      };
    } else if (activeTab === 'files') {
      payload = {
        type: 'files',
        files: files.map((f: LegacyValue) => ({
          name: f.name,
          isFileObj: true,
        })),
      };
    } else {
      payload = {
        type: 'archive',
        files: [
          {
            name: archive.name,
            isFileObj: true,
          },
        ],
      };
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
          render={({ field }: LegacyValue) => (
            <EntityTabs tabs={TABS} activeKey={field.value} onChange={field.onChange} />
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
                render={({ field }: LegacyValue) => (
                  <Controller
                    control={control}
                    name="language"
                    render={({ field: languageField }: LegacyValue) => (
                      <CodeEditor
                        value={field.value}
                        onChange={handleCodeChange(field.onChange)}
                        language={languageField.value}
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
                    {files.map((file: LegacyValue, idx: LegacyValue) => (
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
