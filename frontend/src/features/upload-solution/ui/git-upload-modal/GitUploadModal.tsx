import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import {
  gitUploadFormSchema,
  type GitSolutionUploadPayload,
  type GitUploadFormValues,
} from '../../model/upload-schemas';
import gitUploadModalStyles from './GitUploadModal.module.scss';

const TABS = [
  {
    key: 'github',
    label: 'GitHub',
  },
  {
    key: 'gitlab',
    label: 'GitLab',
  },
];

type GitPlatform = 'github' | 'gitlab';

interface GitUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: GitSolutionUploadPayload) => void | Promise<void>;
  isSubmitting: boolean;
}

const isGitPlatform = (value: string): value is GitPlatform => value === 'github' || value === 'gitlab';

const GitUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: GitUploadModalProps) => {
  const [activeTab, setActiveTab] = useState<GitPlatform>('github');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<GitUploadFormValues>({
    resolver: zodResolver(gitUploadFormSchema),
    defaultValues: {
      sourceBranch: '',
      targetBranch: '',
      repositoryName: '',
    },
    mode: 'onChange',
  });

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const isSubmitDisabled = () => {
    return isSubmitting || !isValid;
  };

  const handleTabChange = (tabKey: string) => {
    if (!isGitPlatform(tabKey)) {
      return;
    }

    setActiveTab(tabKey);
    reset();
  };

  const submit = async ({ sourceBranch, targetBranch, repositoryName }: GitUploadFormValues) => {
    if (isSubmitDisabled()) return;

    await onSubmit({
      type: 'git',
      uploadType: 'GIT_PULL_REQUEST',
      git: {
        provider: activeTab === 'github' ? 'GITHUB' : 'GITLAB',
        sourceBranch,
        targetBranch,
        repositoryName,
      },
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={gitUploadModalStyles.backdrop}
      dialogClassName={gitUploadModalStyles.root}
      ariaLabel="Загрузка решения"
      title="Загрузка решения"
      headerClassName={gitUploadModalStyles.head}
      titleClassName={gitUploadModalStyles.title}
      closeClassName={gitUploadModalStyles.close}
    >
      <div className={gitUploadModalStyles.tabsWrap}>
        <EntityTabs tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />
      </div>

      <form className={gitUploadModalStyles.content} onSubmit={handleSubmit(submit)}>
        <div className={gitUploadModalStyles.tabContent}>
          <div className={gitUploadModalStyles.formFields}>
            <div className={gitUploadModalStyles.field}>
              <input
                className={[gitUploadModalStyles.input, errors.repositoryName ? gitUploadModalStyles.isError : '']
                  .filter(Boolean)
                  .join(' ')}
                type="url"
                placeholder="Ссылка на репозиторий*"
                aria-label="Ссылка на репозиторий"
                {...register('repositoryName')}
              />
              {errors.repositoryName && <p className={gitUploadModalStyles.error}>{errors.repositoryName.message}</p>}
            </div>
            <div className={gitUploadModalStyles.field}>
              <input
                className={[gitUploadModalStyles.input, errors.sourceBranch ? gitUploadModalStyles.isError : '']
                  .filter(Boolean)
                  .join(' ')}
                type="text"
                placeholder="Исходная ветка*"
                aria-label="Исходная ветка"
                {...register('sourceBranch')}
              />
              {errors.sourceBranch && <p className={gitUploadModalStyles.error}>{errors.sourceBranch.message}</p>}
            </div>
            <div className={gitUploadModalStyles.field}>
              <input
                className={[gitUploadModalStyles.input, errors.targetBranch ? gitUploadModalStyles.isError : '']
                  .filter(Boolean)
                  .join(' ')}
                type="text"
                placeholder="Целевая ветка*"
                aria-label="Целевая ветка"
                {...register('targetBranch')}
              />
              {errors.targetBranch && <p className={gitUploadModalStyles.error}>{errors.targetBranch.message}</p>}
            </div>
          </div>
        </div>

        <div className={gitUploadModalStyles.footer}>
          <button type="submit" className={gitUploadModalStyles.submitBtn} disabled={isSubmitDisabled()}>
            <span className={gitUploadModalStyles.submitIcon}>
              <CheckIcon />
            </span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default GitUploadModal;
