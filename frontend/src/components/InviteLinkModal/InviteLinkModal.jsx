import { useMemo, useState } from 'react';
import { CheckIcon, CrossIcon } from '../Icons/Icons';
import DateTimePicker from '../DateTimePicker/DateTimePicker';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import './InviteLinkModal.css';

const InviteLinkModal = ({ isOpen, onClose, onGenerate, onCopySuccess, isSubmitting }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [reusable, setReusable] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [localError, setLocalError] = useState('');

  const minValue = useMemo(() => new Date(), []);

  useBodyScrollLock(isOpen);

  const generate = async () => {
    if (!expiresAt) {
      return;
    }

    if (new Date(expiresAt).getTime() <= Date.now()) {
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
    setExpiresAt('');
    setReusable(false);
    setGeneratedLink('');
    setLocalError('');
    onClose();
  };

  return (
    <div className="invite-link-modal__backdrop" role="presentation" onClick={handleClose}>
      <div className="invite-link-modal" role="dialog" aria-modal="true" aria-label="Формирование ссылки" onClick={(event) => event.stopPropagation()}>
        <div className="invite-link-modal__head">
          <h2 className="invite-link-modal__title">Пригласительная ссылка</h2>
          <button className="invite-link-modal__close" type="button" onClick={handleClose} aria-label="Закрыть форму">
            <CrossIcon />
          </button>
        </div>

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
                    <input className="invite-link-modal__radio" type="radio" checked={!reusable} onChange={() => setReusable(false)} />
                    <span>Одноразовая</span>
                  </label>
                  <label className="invite-link-modal__radio-item">
                    <input className="invite-link-modal__radio" type="radio" checked={reusable} onChange={() => setReusable(true)} />
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
      </div>
    </div>
  );
};

export default InviteLinkModal;
