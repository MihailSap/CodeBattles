import { useState, useRef } from 'react';
import { CrossIcon, CheckIcon, FileIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import CodeEditor from '@/shared/ui/code-editor';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import './SolutionUploadModal.css';

const TABS = [
  { key: 'manual', label: 'Ручной ввод' },
  { key: 'files', label: 'Загрузка файлов' },
  { key: 'archive', label: 'Загрузка архивом' }
];

const MAX_FILES = 100;
const MAX_CODE_LENGTH = 100000;

const ALLOWED_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', '.cpp', '.c', '.h',
  '.hpp', '.html', '.css', '.scss', '.less', '.json', '.xml', '.yaml', '.yml',
  '.md', '.txt', '.sql', '.rb', '.go', '.rs', '.swift', '.kt', '.php',
  '.sh', '.bash', '.vue', '.svelte'
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
  plaintext: 'txt'
};

const SolutionUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('manual');

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [archive, setArchive] = useState(null);
  const archiveInputRef = useRef(null);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    setCode('');
    setFiles([]);
    setArchive(null);
    setActiveTab('manual');
    onClose();
  };

  const handleCodeChange = (value) => {
    if (value.length <= MAX_CODE_LENGTH) {
      setCode(value);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    setFiles((prev) => {
      const next = [...prev, ...incoming];
      return next.slice(0, MAX_FILES);
    });
    e.target.value = '';
  };

  const handleArchiveChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchive(e.target.files[0]);
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isSubmitDisabled = () => {
    if (isSubmitting) return true;
    if (activeTab === 'manual') return code.trim() === '';
    if (activeTab === 'files') return files.length === 0;
    if (activeTab === 'archive') return archive === null;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled()) return;

    let payload = {};
    if (activeTab === 'manual') {
      payload = {
        type: 'manual',
        files: [{ name: `solution.${LANGUAGE_EXTENSION_MAP[language] || 'txt'}`, content: code }]
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
          <EntityTabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </div>

        <form className="solution-upload-modal__content" onSubmit={handleSubmit}>
          <div className="solution-upload-modal__tab-content">
            <div className="solution-upload-modal__tab-pane" style={{ display: activeTab === 'manual' ? 'flex' : 'none' }}>
              <div className="solution-upload-modal__manual">
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  onLanguageChange={setLanguage}
                />
              </div>
            </div>

            <div className="solution-upload-modal__tab-pane" style={{ display: activeTab === 'files' ? 'flex' : 'none' }}>
              <div className="solution-upload-modal__files">
                <input
                  type="file"
                  multiple
                  accept={fileAccept}
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

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
                            <span className="solution-upload-modal__file-icon"><FileIcon /></span>
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

            <div className="solution-upload-modal__tab-pane" style={{ display: activeTab === 'archive' ? 'flex' : 'none' }}>
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
                        onClick={() => setArchive(null)}
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
            <button
              type="submit"
              className="solution-upload-modal__submit-btn"
              disabled={isSubmitDisabled()}
            >
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
