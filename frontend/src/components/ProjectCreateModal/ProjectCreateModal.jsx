import { useMemo, useState } from 'react';
import { CheckIcon, CrossIcon } from '../Icons/Icons';
import ProjectSkillsSelector from '../ProjectSkillsSelector/ProjectSkillsSelector';
import { PROJECT_PRIVACY, PROJECT_PRIVACY_LABELS } from '../../constants/project';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { validateProjectName, validateRepositoryUrl } from '../../utils/projectValidation';
import './ProjectCreateModal.css';

const initialState = {
  name: '',
  description: '',
  repositoryUrl: '',
  stack: [],
  privacy: PROJECT_PRIVACY.PUBLIC
};

const initialTouched = {
  name: false,
  repositoryUrl: false
};

const ProjectCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState(initialTouched);

  useBodyScrollLock(isOpen);

  const nameError = validateProjectName(form.name);
  const repositoryError = validateRepositoryUrl(form.repositoryUrl);

  const isFormValid = useMemo(() => !nameError && !repositoryError, [nameError, repositoryError]);

  const submit = async (event) => {
    event.preventDefault();

    setTouched({ name: true, repositoryUrl: true });

    if (!isFormValid || isSubmitting) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      repositoryUrl: form.repositoryUrl.trim(),
      stack: form.stack,
      privacy: form.privacy
    });
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setForm(initialState);
    setTouched(initialTouched);
    onClose();
  };

  return (
    <div className="project-create-modal__backdrop" onClick={handleClose} role="presentation">
      <div className="project-create-modal" role="dialog" aria-modal="true" aria-label="Создание проекта" onClick={(event) => event.stopPropagation()}>
        <div className="project-create-modal__head">
          <h2 className="project-create-modal__title">Создание проекта</h2>
          <button className="project-create-modal__close" type="button" onClick={handleClose} aria-label="Закрыть форму">
            <CrossIcon />
          </button>
        </div>

        <form className="project-create-modal__content" onSubmit={submit}>
          <div className="project-create-modal__fields">
            <div className="project-create-modal__field">
              <input
                className={`project-create-modal__input ${touched.name && nameError ? 'project-create-modal__input--error' : ''}`}
                type="text"
                placeholder="Название*"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                maxLength={100}
              />
              {touched.name && nameError && <p className="project-create-modal__error">{nameError}</p>}
            </div>

            <div className="project-create-modal__field">
              <textarea
                className="project-create-modal__input project-create-modal__textarea"
                placeholder="Описание"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 3000) }))}
                maxLength={3000}
              />
            </div>

            <div className="project-create-modal__field">
              <input
                className={`project-create-modal__input ${touched.repositoryUrl && repositoryError ? 'project-create-modal__input--error' : ''}`}
                type="text"
                placeholder="Ссылка на репозиторий"
                value={form.repositoryUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, repositoryUrl: event.target.value.slice(0, 500) }))}
                onBlur={() => setTouched((prev) => ({ ...prev, repositoryUrl: true }))}
                maxLength={500}
              />
              {touched.repositoryUrl && repositoryError && <p className="project-create-modal__error">{repositoryError}</p>}
            </div>
          </div>

          <div className="project-create-modal__section">
            <ProjectSkillsSelector
              value={form.stack}
              onChange={(stack) => setForm((prev) => ({ ...prev, stack }))}
              title="Технологический стек:"
              forceOpenUp
              boundarySelector=".project-create-modal"
            />
          </div>

          <div className="project-create-modal__section">
            <h3 className="project-create-modal__section-title">Приватность:</h3>
            <div className="project-create-modal__radio-row">
              {[PROJECT_PRIVACY.PUBLIC, PROJECT_PRIVACY.PRIVATE].map((privacyValue) => (
                <label className="project-create-modal__radio-item" key={privacyValue}>
                  <input
                    className="project-create-modal__radio"
                    type="radio"
                    checked={form.privacy === privacyValue}
                    onChange={() => setForm((prev) => ({ ...prev, privacy: privacyValue }))}
                  />
                  <span>{PROJECT_PRIVACY_LABELS[privacyValue]}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="project-create-modal__submit" type="submit" disabled={!isFormValid || isSubmitting}>
            <CheckIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
