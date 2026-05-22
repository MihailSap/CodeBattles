import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import uploadIcon from '@/shared/assets/upload-icon.svg';
import deleteIcon from '@/shared/assets/delete-icon.svg';
import { CheckIcon } from '@/shared/ui/icons';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { organizationCreateFormSchema } from '@/entities/organization';
import organizationCreateModalStyles from './OrganizationCreateModal.module.scss';

const initialForm = {
  name: '',
  link: '',
  description: '',
  logoFile: null,
};

const OrganizationCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LegacyValue) => {
  const [logoPreview, setLogoPreview] = useState('');
  const inputRef = useRef<LegacyValue>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm<LegacyValue>({
    resolver: zodResolver(organizationCreateFormSchema) as LegacyValue,
    defaultValues: initialForm,
    mode: 'onChange',
  });

  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    reset(initialForm);
    setLogoPreview('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const submit = async (form: LegacyValue) => {
    if (isSubmitting) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      link: form.link.trim(),
      description: form.description.trim(),
      logoFile: form.logoFile,
      logoPreview,
    });
  };

  const handleLogoUpload = (event: LegacyValue) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    setValue('logoFile', file, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setLogoPreview(nextUrl);
  };

  const handleLogoClear = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setValue('logoFile', null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setLogoPreview('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getError = (fieldName: string) => {
    if (!(touchedFields[fieldName] || isSubmitted)) {
      return '';
    }

    return String(errors[fieldName]?.message || '');
  };

  const nameError = getError('name');
  const linkError = getError('link');
  const logoError = getError('logoFile');

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={organizationCreateModalStyles.overlay}
      dialogClassName={organizationCreateModalStyles.root}
      ariaLabel="Создание организации"
      title="Создание организации"
      headerClassName={organizationCreateModalStyles.head}
      titleClassName={organizationCreateModalStyles.title}
      closeClassName={organizationCreateModalStyles.close}
      closeAriaLabel="Закрыть форму"
    >
      <form className={organizationCreateModalStyles.form} onSubmit={handleSubmit(submit)}>
        <div className={organizationCreateModalStyles.main}>
          <div className={organizationCreateModalStyles.left}>
            <div className={organizationCreateModalStyles.logoBox}>
              <div className={organizationCreateModalStyles.logoActions}>
                {logoPreview ? (
                  <button
                    className={[organizationCreateModalStyles.iconBtn, organizationCreateModalStyles.isDelete].join(
                      ' '
                    )}
                    type="button"
                    onClick={handleLogoClear}
                    aria-label="Удалить логотип"
                  >
                    <img src={deleteIcon} alt="" />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  className={[organizationCreateModalStyles.iconBtn, organizationCreateModalStyles.isUpload].join(' ')}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Загрузить логотип"
                >
                  <img src={uploadIcon} alt="" />
                </button>
              </div>
              {logoPreview ? (
                <img className={organizationCreateModalStyles.logo} src={logoPreview} alt="Логотип организации" />
              ) : (
                <span className={organizationCreateModalStyles.logoPlaceholder}>Логотип*</span>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
            {logoError && <p className={organizationCreateModalStyles.error}>{logoError}</p>}
          </div>

          <div className={organizationCreateModalStyles.right}>
            <div className={organizationCreateModalStyles.field}>
              <input
                className={[organizationCreateModalStyles.input, nameError ? organizationCreateModalStyles.isError : '']
                  .filter(Boolean)
                  .join(' ')}
                type="text"
                placeholder="Название*"
                maxLength={100}
                {...register('name')}
              />
              {nameError && <p className={organizationCreateModalStyles.error}>{nameError}</p>}
            </div>

            <div className={organizationCreateModalStyles.field}>
              <input
                className={[organizationCreateModalStyles.input, linkError ? organizationCreateModalStyles.isError : '']
                  .filter(Boolean)
                  .join(' ')}
                type="text"
                placeholder="Ссылка на организацию"
                maxLength={500}
                {...register('link')}
              />
              {linkError && <p className={organizationCreateModalStyles.error}>{linkError}</p>}
            </div>

            <div className={organizationCreateModalStyles.field}>
              <textarea
                className={[organizationCreateModalStyles.input, organizationCreateModalStyles.textarea].join(' ')}
                placeholder="Описание"
                maxLength={3000}
                {...register('description')}
              />
            </div>
          </div>
        </div>

        <button
          className={organizationCreateModalStyles.submit}
          type="submit"
          disabled={!isValid || isSubmitting || !getValues('logoFile')}
        >
          <CheckIcon />
        </button>
      </form>
    </ModalShell>
  );
};

export default OrganizationCreateModal;
