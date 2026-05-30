import { useMemo, useState } from 'react';
import { CheckIcon } from '@/shared/ui/icons';
import DateTimePicker from '@/shared/ui/date-time-picker';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import inviteLinkModalStyles from './InviteLinkModal.module.scss';

const isInvalidOrPastDateTime = (value: string): boolean => {
  if (!value) {
    return true;
  }

  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed <= Date.now();
};

interface InviteLinkPayload {
  expiresAt: string;
  reusable: boolean;
}

interface InviteLinkResult {
  link: string;
}

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: InviteLinkPayload) => InviteLinkResult | null | Promise<InviteLinkResult | null>;
  onCopySuccess?: () => void;
  isSubmitting: boolean;
}

const InviteLinkModal = ({ isOpen, onClose, onGenerate, onCopySuccess, isSubmitting }: InviteLinkModalProps) => {
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
      reusable,
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
      overlayClassName={inviteLinkModalStyles.backdrop}
      dialogClassName={inviteLinkModalStyles.root}
      ariaLabel="Формирование ссылки"
      title="Пригласительная ссылка"
      headerClassName={inviteLinkModalStyles.head}
      titleClassName={inviteLinkModalStyles.title}
      closeClassName={inviteLinkModalStyles.close}
      closeAriaLabel="Закрыть форму"
      closeDisabled={isSubmitting}
    >
      <div className={inviteLinkModalStyles.content}>
        {!generatedLink && (
          <>
            <div className={inviteLinkModalStyles.section}>
              <h3 className={inviteLinkModalStyles.sectionTitle}>Срок действия:</h3>
              <DateTimePicker
                value={expiresAt}
                onChange={setExpiresAt}
                minDateTime={minValue}
                placeholder="Выберите дату и время"
                hasError={Boolean(localError)}
              />
              {localError && <p className={inviteLinkModalStyles.isError}>{localError}</p>}
            </div>

            <div className={inviteLinkModalStyles.section}>
              <h3 className={inviteLinkModalStyles.sectionTitle}>Тип ссылки:</h3>
              <div className={inviteLinkModalStyles.radios}>
                <label className={inviteLinkModalStyles.radioItem}>
                  <input
                    className={inviteLinkModalStyles.radio}
                    type="radio"
                    checked={!reusable}
                    onChange={() => setReusable(false)}
                    disabled={isSubmitting}
                  />
                  <span>Одноразовая</span>
                </label>
                <label className={inviteLinkModalStyles.radioItem}>
                  <input
                    className={inviteLinkModalStyles.radio}
                    type="radio"
                    checked={reusable}
                    onChange={() => setReusable(true)}
                    disabled={isSubmitting}
                  />
                  <span>Многоразовая</span>
                </label>
              </div>
            </div>

            <button
              className={inviteLinkModalStyles.submit}
              type="button"
              onClick={generate}
              disabled={!expiresAt || isSubmitting}
            >
              <CheckIcon />
            </button>
          </>
        )}
        {generatedLink && (
          <div className={inviteLinkModalStyles.result}>
            <a href={generatedLink} target="_blank" rel="noreferrer">
              {generatedLink}
            </a>
            <button type="button" onClick={copy}>
              Скопировать
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default InviteLinkModal;
