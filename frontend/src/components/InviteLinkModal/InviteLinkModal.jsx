import { useMemo, useState } from 'react';
import { CheckIcon } from '../Icons/Icons';
import DateTimePicker from '../DateTimePicker/DateTimePicker';
import ModalShell from '../ModalShell/ModalShell';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import './InviteLinkModal.css';

const isInvalidOrPastDateTime = (value) => {
  if (!value) {
    return true;
  }

  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed <= Date.now();
};

const InviteLinkModal = ({ isOpen, onClose, onGenerate, onCopySuccess, isSubmitting }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [reusable, setReusable] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [localError, setLocalError] = useState('');

  const minValue = useMemo(() => new Date(), []);

  useBodyScrollLock(isOpen);

  const generate = async () => {
    if (!expiresAt) {
      setLocalError('Выберите срок действия ссылки');
      return;
    }

    if (isInvalidOrPastDateTime(expiresAt)) {
      setLocalError('Срок действия ссылки должен быть в будущем');
      return;
    }

    setLocalError('');

    const payload = {
      expiresAt,
      reusable
    };

    const result = await onGenerate(payload);

    if (result?.link) {
      setGeneratedLink(result.link);
    }
  };

  const copy = async () => {
    if (!generatedLink) {
      return;
    }

    await navigator.clipboard.writeText(generatedLink);
    onCopySuccess?.();
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setExpiresAt('');
    setReusable(false);
    setGeneratedLink('');
    setLocalError('');
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="invite-link-modal__backdrop"
      dialogClassName="invite-link-modal"
      ariaLabel="Формирование ссылки"
      title="Пригласительная ссылка"
      headerClassName="invite-link-modal__head"
      titleClassName="invite-link-modal__title"
      closeClassName="invite-link-modal__close"
      closeAriaLabel="Закрыть форму"
      closeDisabled={isSubmitting}
    >
        <div className="invite-link-modal__content">
          {!generatedLink && (
            <>
              <div className="invite-link-modal__section">
                <h3 className="invite-link-modal__section-title">Срок действия:</h3>
                <DateTimePicker
                  value={expiresAt}
                  onChange={setExpiresAt}
                  minDateTime={minValue}
                  placeholder="Выберите дату и время"
                  hasError={Boolean(localError)}
                />
                {localError && <p className="invite-link-modal__error">{localError}</p>}
              </div>

              <div className="invite-link-modal__section">
                <h3 className="invite-link-modal__section-title">Тип ссылки:</h3>
                <div className="invite-link-modal__radios">
                  <label className="invite-link-modal__radio-item">
                    <input className="invite-link-modal__radio" type="radio" checked={!reusable} onChange={() => setReusable(false)} disabled={isSubmitting} />
                    <span>Одноразовая</span>
                  </label>
                  <label className="invite-link-modal__radio-item">
                    <input className="invite-link-modal__radio" type="radio" checked={reusable} onChange={() => setReusable(true)} disabled={isSubmitting} />
                    <span>Многоразовая</span>
                  </label>
                </div>
              </div>

              <button className="invite-link-modal__submit" type="button" onClick={generate} disabled={!expiresAt || isSubmitting}>
                <CheckIcon />
              </button>
            </>
          )}
          {generatedLink && (
            <div className="invite-link-modal__result">
              <a href={generatedLink} target="_blank" rel="noreferrer">{generatedLink}</a>
              <button type="button" onClick={copy}>Скопировать</button>
            </div>
          )}
        </div>
    </ModalShell>
  );
};

export default InviteLinkModal;
