import React, { useState } from 'react';
import { CheckIcon } from '../Icons/Icons';
import EntityTabs from '../EntityTabs/EntityTabs';
import ReviewDropdown from '../ReviewDropdown/ReviewDropdown';
import ModalShell from '../ModalShell/ModalShell';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import './GitUploadModal.css';

const TABS = [
  { key: 'github', label: 'GitHub' },
  { key: 'gitlab', label: 'GitLab' }
];

const MOCK_REPOSITORIES = {
  github: [
    { value: 'gh_repo_1', label: 'org/codebattles-frontend' },
    { value: 'gh_repo_2', label: 'org/codebattles-backend' }
  ],
  gitlab: [
    { value: 'gl_repo_1', label: 'team/codebattles-frontend' },
    { value: 'gl_repo_2', label: 'team/codebattles-backend' }
  ]
};

const MOCK_BRANCHES = [
  { value: 'main', label: 'main' },
  { value: 'develop', label: 'develop' }
];

const MOCK_PRS = {
  gh_repo_1: [
    { value: 'gh_pr_1', label: 'PR #124: Improve review comments styling' },
    { value: 'gh_pr_2', label: 'PR #128: Fix mobile file tree behavior' },
    { value: 'gh_pr_3', label: 'PR #131: Refactor solution tab layout' }
  ],
  gh_repo_2: [
    { value: 'gh_pr_4', label: 'PR #205: Add review status endpoint' },
    { value: 'gh_pr_5', label: 'PR #213: Optimize auth middleware' }
  ],
  gl_repo_1: [
    { value: 'gl_pr_1', label: '!34 Update comments sidebar visuals' },
    { value: 'gl_pr_2', label: '!39 Add responsive modal spacing' }
  ],
  gl_repo_2: [
    { value: 'gl_pr_3', label: '!51 Improve CI quality checks' },
    { value: 'gl_pr_4', label: '!58 Introduce review pipeline cache' }
  ]
};

const PR_REPOS_BY_PLATFORM = {
  github: ['gh_repo_1', 'gh_repo_2'],
  gitlab: ['gl_repo_1', 'gl_repo_2']
};

const GitUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('github');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedTargetBranch, setSelectedTargetBranch] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedRepo(null);
    setSelectedTargetBranch(null);
    setSelectedPR(null);
    onClose();
  };

  const isSubmitDisabled = () => {
    return isSubmitting || !selectedRepo || !selectedTargetBranch || !selectedPR;
  };

  const currentRepositories = MOCK_REPOSITORIES[activeTab] || [];
  const currentPrOptions = selectedRepo
    ? (MOCK_PRS[selectedRepo] || [])
    : (PR_REPOS_BY_PLATFORM[activeTab] || []).flatMap((repoKey) => MOCK_PRS[repoKey] || []);
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSelectedRepo(null);
    setSelectedTargetBranch(null);
    setSelectedPR(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled()) return;

    await onSubmit({
      type: 'git',
      platform: activeTab,
      repository: selectedRepo,
      targetBranch: selectedTargetBranch,
      pullRequest: selectedPR,
      files: [
        { name: 'src/App.jsx', isDiff: true, content: '+const isReviewFlowReady = true;' },
        { name: 'src/main.jsx', isDiff: true, content: ' const rootElement = document.getElementById("root");\n-const legacyRoot = null;' }
      ]
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="git-upload-modal__backdrop"
      dialogClassName="git-upload-modal"
      ariaLabel="Загрузка решения"
      title="Загрузка решения"
      headerClassName="git-upload-modal__head"
      titleClassName="git-upload-modal__title"
      closeClassName="git-upload-modal__close"
    >
        <div className="git-upload-modal__tabs-wrap">
          <EntityTabs tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />
        </div>

        <form className="git-upload-modal__content" onSubmit={handleSubmit}>
          <div className="git-upload-modal__tab-content">
            <div className="git-upload-modal__form-fields">
              <ReviewDropdown
                label="Репозиторий:"
                options={currentRepositories}
                value={selectedRepo}
                onChange={(value) => {
                  setSelectedRepo(value);
                  setSelectedPR(null);
                }}
                placeholder="Выберите репозиторий"
              />
              <ReviewDropdown
                label="Целевая ветка:"
                options={MOCK_BRANCHES}
                value={selectedTargetBranch}
                onChange={setSelectedTargetBranch}
                placeholder="Выберите ветку"
              />
              <ReviewDropdown
                label="Pull Request:"
                options={currentPrOptions}
                value={selectedPR}
                onChange={setSelectedPR}
                placeholder="Выберите Pull Request"
              />
            </div>
          </div>

          <div className="git-upload-modal__footer">
            <button
              type="submit"
              className="git-upload-modal__submit-btn"
              disabled={isSubmitDisabled()}
            >
              <span className="git-upload-modal__submit-icon">
                <CheckIcon />
              </span>
            </button>
          </div>
        </form>
    </ModalShell>
  );
};

export default GitUploadModal;
