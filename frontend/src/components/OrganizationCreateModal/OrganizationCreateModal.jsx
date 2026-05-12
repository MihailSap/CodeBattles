import { useMemo, useRef, useState } from 'react';
import uploadIcon from '../../assets/upload-icon.svg';
import deleteIcon from '../../assets/delete-icon.svg';
import { CheckIcon } from '../Icons/Icons';
import ModalShell from '../ModalShell/ModalShell';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { validateOrganizationName, validateOrganizationUrl } from '../../utils/organizationValidation';
import './OrganizationCreateModal.css';

const initialForm = {
  name: '',
  link: '',
  description: ''
};

const initialTouched = {
  name: false,
  link: false
};

const OrganizationCreateModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState(initialTouched);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const inputRef = useRef(null);

  useBodyScrollLock(isOpen);

  const nameError = validateOrganizationName(form.name);
  const linkError = validateOrganizationUrl(form.link);

  const isValid = useMemo(() => !nameError && !linkError && Boolean(logoPreview), [linkError, logoPreview, nameError]);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setForm(initialForm);
    setTouched(initialTouched);
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, link: true });

    if (!isValid || isSubmitting) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      link: form.link.trim(),
      description: form.description.trim(),
      logoFile,
      logoPreview
    });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(nextUrl);
  };

  const handleLogoClear = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(null);
    setLogoPreview('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

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
        <form className="organization-create-modal__form" onSubmit={handleSubmit}>
          <div className="organization-create-modal__main">
            <div className="organization-create-modal__left">
              <div className="organization-create-modal__logo-box">
                <div className="organization-create-modal__logo-actions">
                  {logoPreview ? (
                    <button className="organization-create-modal__icon-btn organization-create-modal__icon-btn--delete" type="button" onClick={handleLogoClear} aria-label="Удалить логотип">
                      <img src={deleteIcon} alt="" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button className="organization-create-modal__icon-btn organization-create-modal__icon-btn--upload" type="button" onClick={() => inputRef.current?.click()} aria-label="Загрузить логотип">
                    <img src={uploadIcon} alt="" />
                  </button>
                </div>
                {logoPreview ? <img className="organization-create-modal__logo" src={logoPreview} alt="Логотип организации" /> : <span className="organization-create-modal__logo-placeholder">Логотип*</span>}
              </div>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
            </div>

            <div className="organization-create-modal__right">
              <div className="organization-create-modal__field">
                <input
                  className={`organization-create-modal__input ${touched.name && nameError ? 'organization-create-modal__input--error' : ''}`}
                  type="text"
                  placeholder="Название*"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  maxLength={100}
                />
                {touched.name && nameError && <p className="organization-create-modal__error">{nameError}</p>}
              </div>

              <div className="organization-create-modal__field">
                <input
                  className={`organization-create-modal__input ${touched.link && linkError ? 'organization-create-modal__input--error' : ''}`}
                  type="text"
                  placeholder="Ссылка на организацию"
                  value={form.link}
                  onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value.slice(0, 500) }))}
                  onBlur={() => setTouched((prev) => ({ ...prev, link: true }))}
                  maxLength={500}
                />
                {touched.link && linkError && <p className="organization-create-modal__error">{linkError}</p>}
              </div>

              <div className="organization-create-modal__field">
                <textarea
                  className="organization-create-modal__input organization-create-modal__textarea"
                  placeholder="Описание"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 3000) }))}
                  maxLength={3000}
                />
              </div>
            </div>
          </div>

          <button className="organization-create-modal__submit" type="submit" disabled={!isValid || isSubmitting}>
            <CheckIcon />
          </button>
        </form>
    </ModalShell>
  );
};

export default OrganizationCreateModal;
