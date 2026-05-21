import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CrossIcon, CheckIcon, FileIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import CodeEditor from '@/shared/ui/code-editor';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { solutionUploadFormSchema } from '../../model/upload-schemas';
import './SolutionUploadModal.css';

const TABS = [
  { key: 'manual', label: 'Ручной ввод' },
  { key: 'files', label: 'Загрузка файлов' },
  { key: 'archive', label: 'Загрузка архивом' },
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

const SolutionUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const fileInputRef = useRef(null);
  const archiveInputRef = useRef(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(solutionUploadFormSchema),
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
  });

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCodeChange = (onChange) => (value) => {
    if (value.length <= MAX_CODE_LENGTH) {
      onChange(value);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    setValue('files', [...files, ...incoming].slice(0, MAX_FILES), { shouldDirty: true, shouldValidate: true });
    e.target.value = '';
  };

  const handleArchiveChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setValue('archive', e.target.files[0], { shouldDirty: true, shouldValidate: true });
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setValue(
      'files',
      files.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isSubmitDisabled = () => {
    return isSubmitting || !isValid;
  };

  const submit = async ({ activeTab, code, language, files, archive }) => {
    if (isSubmitDisabled()) return;

    let payload = {};
    if (activeTab === 'manual') {
      payload = {
        type: 'manual',
        files: [{ name: `solution.${LANGUAGE_EXTENSION_MAP[language] || 'txt'}`, content: code }],
      };
    } else if (activeTab === 'files') {
      payload = { type: 'files', files: files.map((f) => ({ name: f.name, isFileObj: true })) };
    } else {
      payload = { type: 'archive', files: [{ name: archive.name, isFileObj: true }] };
    }

    await onSubmit(payload);
  };

  const fileAccept = ALLOWED_FILE_EXTENSIONS.join(',');

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="solution-upload-modal__backdrop"
      dialogClassName="solution-upload-modal"
      ariaLabel="Загрузка решения"
      title="Загрузка решения"
      headerClassName="solution-upload-modal__head"
      titleClassName="solution-upload-modal__title"
      closeClassName="solution-upload-modal__close"
    >
      <div className="solution-upload-modal__tabs-wrap">
        <Controller
          control={control}
          name="activeTab"
          render={({ field }) => <EntityTabs tabs={TABS} activeKey={field.value} onChange={field.onChange} />}
        />
      </div>

      <form className="solution-upload-modal__content" onSubmit={handleSubmit(submit)}>
        <div className="solution-upload-modal__tab-content">
          <div
            className="solution-upload-modal__tab-pane"
            style={{ display: activeTab === 'manual' ? 'flex' : 'none' }}
          >
            <div className="solution-upload-modal__manual">
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <Controller
                    control={control}
                    name="language"
                    render={({ field: languageField }) => (
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

          <div className="solution-upload-modal__tab-pane" style={{ display: activeTab === 'files' ? 'flex' : 'none' }}>
            <div className="solution-upload-modal__files">
              <input type="file" multiple accept={fileAccept} hidden ref={fileInputRef} onChange={handleFileChange} />

              {files.length === 0 ? (
                <div className="solution-upload-modal__empty-state">
                  <button
                    type="button"
                    className="solution-upload-modal__add-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Добавить файлы +
                  </button>
                </div>
              ) : (
                <>
                  <div className="solution-upload-modal__files-list">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="solution-upload-modal__file-item">
                        <div className="solution-upload-modal__file-info">
                          <span className="solution-upload-modal__file-icon">
                            <FileIcon />
                          </span>
                          <span className="solution-upload-modal__file-name">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          className="solution-upload-modal__file-remove"
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
                      className="solution-upload-modal__add-btn solution-upload-modal__add-btn--bottom"
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
            className="solution-upload-modal__tab-pane"
            style={{ display: activeTab === 'archive' ? 'flex' : 'none' }}
          >
            <div className="solution-upload-modal__archive">
              <input
                type="file"
                accept={ARCHIVE_EXTENSIONS}
                hidden
                ref={archiveInputRef}
                onChange={handleArchiveChange}
              />

              {!archive ? (
                <div className="solution-upload-modal__empty-state">
                  <button
                    type="button"
                    className="solution-upload-modal__add-btn"
                    onClick={() => archiveInputRef.current?.click()}
                  >
                    Добавить архив +
                  </button>
                </div>
              ) : (
                <div className="solution-upload-modal__empty-state">
                  <div className="solution-upload-modal__archive-item">
                    <span className="solution-upload-modal__archive-name">{archive.name}</span>
                    <button
                      type="button"
                      className="solution-upload-modal__file-remove"
                      onClick={() => setValue('archive', null, { shouldDirty: true, shouldValidate: true })}
                    >
                      <CrossIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="solution-upload-modal__footer">
          <button type="submit" className="solution-upload-modal__submit-btn" disabled={isSubmitDisabled()}>
            <span className="solution-upload-modal__submit-icon">
              <CheckIcon />
            </span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default SolutionUploadModal;
