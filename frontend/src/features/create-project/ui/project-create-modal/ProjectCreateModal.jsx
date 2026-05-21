import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckIcon } from '@/shared/ui/icons';
import { ProjectSkillsSelector } from '@/entities/stack';
import ModalShell from '@/shared/ui/modal-shell';
import { PROJECT_PRIVACY, PROJECT_PRIVACY_LABELS, projectCreateFormSchema } from '@/entities/project';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import './ProjectCreateModal.css';

const initialState = {
  name: '',
  description: '',
  repositoryUrl: '',
  stack: [],
  privacy: PROJECT_PRIVACY.PUBLIC,
};

const ProjectCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(projectCreateFormSchema),
    defaultValues: initialState,
    mode: 'onChange',
  });

  useBodyScrollLock(isOpen);

  const submit = async (form) => {
    if (isSubmitting) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      repositoryUrl: form.repositoryUrl.trim(),
      stack: form.stack,
      privacy: form.privacy,
    });
  };

  const getError = (fieldName) => {
    if (!(touchedFields[fieldName] || isSubmitted)) {
      return '';
    }

    return errors[fieldName]?.message || '';
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    reset(initialState);
    onClose();
  };

  const nameError = getError('name');
  const repositoryError = getError('repositoryUrl');

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="project-create-modal__backdrop"
      dialogClassName="project-create-modal"
      ariaLabel="Создание проекта"
      title="Создание проекта"
      headerClassName="project-create-modal__head"
      titleClassName="project-create-modal__title"
      closeClassName="project-create-modal__close"
      closeAriaLabel="Закрыть форму"
    >
      <form className="project-create-modal__content" onSubmit={handleSubmit(submit)}>
        <div className="project-create-modal__fields">
          <div className="project-create-modal__field">
            <input
              className={`project-create-modal__input ${nameError ? 'project-create-modal__input--error' : ''}`}
              type="text"
              placeholder="Название*"
              maxLength={100}
              {...register('name')}
            />
            {nameError && <p className="project-create-modal__error">{nameError}</p>}
          </div>

          <div className="project-create-modal__field">
            <textarea
              className="project-create-modal__input project-create-modal__textarea"
              placeholder="Описание"
              maxLength={3000}
              {...register('description')}
            />
          </div>

          <div className="project-create-modal__field">
            <input
              className={`project-create-modal__input ${repositoryError ? 'project-create-modal__input--error' : ''}`}
              type="text"
              placeholder="Ссылка на репозиторий"
              maxLength={500}
              {...register('repositoryUrl')}
            />
            {repositoryError && <p className="project-create-modal__error">{repositoryError}</p>}
          </div>
        </div>

        <div className="project-create-modal__section">
          <Controller
            control={control}
            name="stack"
            render={({ field }) => (
              <ProjectSkillsSelector
                value={field.value}
                onChange={field.onChange}
                title="Технологический стек:"
                forceOpenUp
                boundarySelector=".project-create-modal"
              />
            )}
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
                  value={privacyValue}
                  {...register('privacy')}
                />
                <span>{PROJECT_PRIVACY_LABELS[privacyValue]}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="project-create-modal__submit" type="submit" disabled={!isValid || isSubmitting}>
          <CheckIcon />
        </button>
      </form>
    </ModalShell>
  );
};

export default ProjectCreateModal;
