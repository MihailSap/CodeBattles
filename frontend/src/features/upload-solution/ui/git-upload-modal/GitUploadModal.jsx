import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CheckIcon } from '@/shared/ui/icons';
import EntityTabs from '@/shared/ui/entity-tabs';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { gitUploadFormSchema } from '../../model/upload-schemas';
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

const MOCK_REPOSITORIES = {
  github: [
    {
      value: 'gh_repo_1',
      label: 'org/codebattles-frontend',
    },
    {
      value: 'gh_repo_2',
      label: 'org/codebattles-backend',
    },
  ],
  gitlab: [
    {
      value: 'gl_repo_1',
      label: 'team/codebattles-frontend',
    },
    {
      value: 'gl_repo_2',
      label: 'team/codebattles-backend',
    },
  ],
};

const MOCK_BRANCHES = [
  {
    value: 'main',
    label: 'main',
  },
  {
    value: 'develop',
    label: 'develop',
  },
];

const MOCK_PRS = {
  gh_repo_1: [
    {
      value: 'gh_pr_1',
      label: 'PR #124: Improve review comments styling',
    },
    {
      value: 'gh_pr_2',
      label: 'PR #128: Fix mobile file tree behavior',
    },
    {
      value: 'gh_pr_3',
      label: 'PR #131: Refactor solution tab layout',
    },
  ],
  gh_repo_2: [
    {
      value: 'gh_pr_4',
      label: 'PR #205: Add review status endpoint',
    },
    {
      value: 'gh_pr_5',
      label: 'PR #213: Optimize auth middleware',
    },
  ],
  gl_repo_1: [
    {
      value: 'gl_pr_1',
      label: '!34 Update comments sidebar visuals',
    },
    {
      value: 'gl_pr_2',
      label: '!39 Add responsive modal spacing',
    },
  ],
  gl_repo_2: [
    {
      value: 'gl_pr_3',
      label: '!51 Improve CI quality checks',
    },
    {
      value: 'gl_pr_4',
      label: '!58 Introduce review pipeline cache',
    },
  ],
};

const PR_REPOS_BY_PLATFORM = {
  github: ['gh_repo_1', 'gh_repo_2'],
  gitlab: ['gl_repo_1', 'gl_repo_2'],
};

const GitUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('github');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(gitUploadFormSchema),
    defaultValues: {
      repository: '',
      targetBranch: '',
      pullRequest: '',
    },
    mode: 'onChange',
  });

  const selectedRepo = useWatch({
    control,
    name: 'repository',
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

  const currentRepositories = MOCK_REPOSITORIES[activeTab] || [];

  const currentPrOptions = selectedRepo
    ? MOCK_PRS[selectedRepo] || []
    : (PR_REPOS_BY_PLATFORM[activeTab] || []).flatMap((repoKey) => MOCK_PRS[repoKey] || []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    reset();
  };

  const submit = async ({ repository, targetBranch, pullRequest }) => {
    if (isSubmitDisabled()) return;

    await onSubmit({
      type: 'git',
      platform: activeTab,
      repository,
      targetBranch,
      pullRequest,
      files: [
        {
          name: 'src/App.jsx',
          isDiff: true,
          content: '+const isReviewFlowReady = true;',
        },
        {
          name: 'src/main.jsx',
          isDiff: true,
          content: ' const rootElement = document.getElementById("root");\n-const legacyRoot = null;',
        },
      ],
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
            <Controller
              control={control}
              name="repository"
              render={({ field }) => (
                <ReviewDropdown
                  label="Репозиторий:"
                  options={currentRepositories}
                  value={field.value}
                  rootClassName={gitUploadModalStyles.field}
                  labelClassName={gitUploadModalStyles.fieldLabel}
                  triggerClassName={gitUploadModalStyles.fieldTrigger}
                  menuClassName={gitUploadModalStyles.fieldMenu}
                  onChange={(value) => {
                    field.onChange(value);

                    setValue('pullRequest', '', {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Выберите репозиторий"
                />
              )}
            />
            <Controller
              control={control}
              name="targetBranch"
              render={({ field }) => (
                <ReviewDropdown
                  label="Целевая ветка:"
                  options={MOCK_BRANCHES}
                  value={field.value}
                  rootClassName={gitUploadModalStyles.field}
                  labelClassName={gitUploadModalStyles.fieldLabel}
                  triggerClassName={gitUploadModalStyles.fieldTrigger}
                  menuClassName={gitUploadModalStyles.fieldMenu}
                  onChange={field.onChange}
                  placeholder="Выберите ветку"
                />
              )}
            />
            <Controller
              control={control}
              name="pullRequest"
              render={({ field }) => (
                <ReviewDropdown
                  label="Pull Request:"
                  options={currentPrOptions}
                  value={field.value}
                  rootClassName={gitUploadModalStyles.field}
                  labelClassName={gitUploadModalStyles.fieldLabel}
                  triggerClassName={gitUploadModalStyles.fieldTrigger}
                  menuClassName={gitUploadModalStyles.fieldMenuUp}
                  onChange={field.onChange}
                  placeholder="Выберите Pull Request"
                />
              )}
            />
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
