import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckIcon } from '@/shared/ui/icons';
import { ProjectSkillsSelector } from '@/entities/stack';
import ModalShell from '@/shared/ui/modal-shell';
import { PROJECT_PRIVACY, PROJECT_PRIVACY_LABELS, projectCreateFormSchema } from '@/entities/project';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import projectCreateModalStyles from './ProjectCreateModal.module.scss';

const initialState = {
  name: '',
  description: '',
  repositoryUrl: '',
  stack: [],
  privacy: PROJECT_PRIVACY.PUBLIC,
};

const ProjectCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LegacyValue) => {
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

  const submit = async (form: LegacyValue) => {
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

  const getError = (fieldName: LegacyValue) => {
    if (!((touchedFields as LegacyValue)[fieldName] || isSubmitted)) {
      return '';
    }

    return String((errors as LegacyValue)[fieldName]?.message || '');
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
      overlayClassName={projectCreateModalStyles.backdrop}
      dialogClassName={projectCreateModalStyles.root}
      ariaLabel="Создание проекта"
      title="Создание проекта"
      headerClassName={projectCreateModalStyles.head}
      titleClassName={projectCreateModalStyles.title}
      closeClassName={projectCreateModalStyles.close}
      closeAriaLabel="Закрыть форму"
    >
      <form className={projectCreateModalStyles.content} onSubmit={handleSubmit(submit)}>
        <div className={projectCreateModalStyles.fields}>
          <div className={projectCreateModalStyles.field}>
            <input
              className={[projectCreateModalStyles.input, nameError ? projectCreateModalStyles.isError : '']
                .filter(Boolean)
                .join(' ')}
              type="text"
              placeholder="Название*"
              maxLength={100}
              {...register('name')}
            />
            {nameError && <p className={projectCreateModalStyles.error}>{nameError}</p>}
          </div>

          <div className={projectCreateModalStyles.field}>
            <textarea
              className={[projectCreateModalStyles.input, projectCreateModalStyles.textarea].join(' ')}
              placeholder="Описание"
              maxLength={3000}
              {...register('description')}
            />
          </div>

          <div className={projectCreateModalStyles.field}>
            <input
              className={[projectCreateModalStyles.input, repositoryError ? projectCreateModalStyles.isError : '']
                .filter(Boolean)
                .join(' ')}
              type="text"
              placeholder="Ссылка на репозиторий"
              maxLength={500}
              {...register('repositoryUrl')}
            />
            {repositoryError && <p className={projectCreateModalStyles.error}>{repositoryError}</p>}
          </div>
        </div>

        <div className={projectCreateModalStyles.section}>
          <Controller
            control={control}
            name="stack"
            render={({ field }: LegacyValue) => (
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

        <div className={projectCreateModalStyles.section}>
          <h3 className={projectCreateModalStyles.sectionTitle}>Приватность:</h3>
          <div className={projectCreateModalStyles.radioRow}>
            {[PROJECT_PRIVACY.PUBLIC, PROJECT_PRIVACY.PRIVATE].map((privacyValue: LegacyValue) => (
              <label className={projectCreateModalStyles.radioItem} key={privacyValue}>
                <input
                  className={projectCreateModalStyles.radio}
                  type="radio"
                  value={privacyValue}
                  {...register('privacy')}
                />
                <span>{PROJECT_PRIVACY_LABELS[privacyValue]}</span>
              </label>
            ))}
          </div>
        </div>

        <button className={projectCreateModalStyles.submit} type="submit" disabled={!isValid || isSubmitting}>
          <CheckIcon />
        </button>
      </form>
    </ModalShell>
  );
};

export default ProjectCreateModal;
