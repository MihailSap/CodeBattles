import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import uploadIcon from '@/shared/assets/upload-icon.svg';
import deleteIcon from '@/shared/assets/delete-icon.svg';
import { CheckIcon } from '@/shared/ui/icons';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { organizationCreateFormSchema } from '@/entities/organization';
import './OrganizationCreateModal.css';

const initialForm = {
  name: '',
  link: '',
  description: '',
  logoFile: null,
};

const OrganizationCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [logoPreview, setLogoPreview] = useState('');
  const inputRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(organizationCreateFormSchema),
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

  const submit = async (form) => {
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

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setValue('logoFile', file, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setLogoPreview(nextUrl);
  };

  const handleLogoClear = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setValue('logoFile', null, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setLogoPreview('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getError = (fieldName) => {
    if (!(touchedFields[fieldName] || isSubmitted)) {
      return '';
    }

    return errors[fieldName]?.message || '';
  };

  const nameError = getError('name');
  const linkError = getError('link');
  const logoError = getError('logoFile');

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="organization-create-modal__overlay"
      dialogClassName="organization-create-modal"
      ariaLabel="Создание организации"
      title="Создание организации"
      headerClassName="organization-create-modal__head"
      titleClassName="organization-create-modal__title"
      closeClassName="organization-create-modal__close"
      closeAriaLabel="Закрыть форму"
    >
      <form className="organization-create-modal__form" onSubmit={handleSubmit(submit)}>
        <div className="organization-create-modal__main">
          <div className="organization-create-modal__left">
            <div className="organization-create-modal__logo-box">
              <div className="organization-create-modal__logo-actions">
                {logoPreview ? (
                  <button
                    className="organization-create-modal__icon-btn organization-create-modal__icon-btn--delete"
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
                  className="organization-create-modal__icon-btn organization-create-modal__icon-btn--upload"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Загрузить логотип"
                >
                  <img src={uploadIcon} alt="" />
                </button>
              </div>
              {logoPreview ? (
                <img className="organization-create-modal__logo" src={logoPreview} alt="Логотип организации" />
              ) : (
                <span className="organization-create-modal__logo-placeholder">Логотип*</span>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
            {logoError && <p className="organization-create-modal__error">{logoError}</p>}
          </div>

          <div className="organization-create-modal__right">
            <div className="organization-create-modal__field">
              <input
                className={`organization-create-modal__input ${nameError ? 'organization-create-modal__input--error' : ''}`}
                type="text"
                placeholder="Название*"
                maxLength={100}
                {...register('name')}
              />
              {nameError && <p className="organization-create-modal__error">{nameError}</p>}
            </div>

            <div className="organization-create-modal__field">
              <input
                className={`organization-create-modal__input ${linkError ? 'organization-create-modal__input--error' : ''}`}
                type="text"
                placeholder="Ссылка на организацию"
                maxLength={500}
                {...register('link')}
              />
              {linkError && <p className="organization-create-modal__error">{linkError}</p>}
            </div>

            <div className="organization-create-modal__field">
              <textarea
                className="organization-create-modal__input organization-create-modal__textarea"
                placeholder="Описание"
                maxLength={3000}
                {...register('description')}
              />
            </div>
          </div>
        </div>

        <button
          className="organization-create-modal__submit"
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
