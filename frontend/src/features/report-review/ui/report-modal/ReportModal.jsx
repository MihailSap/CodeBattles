import { useState } from 'react';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { REPORT_REASON, REPORT_REASON_LABEL, REPORT_REASONS } from '@/entities/review';
import { CheckIcon } from '@/shared/ui/icons';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customText, setCustomText] = useState('');

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const isOther = selectedReason === REPORT_REASON.OTHER;
  const canSubmit = selectedReason && (!isOther || customText.trim().length >= 10) && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit(selectedReason, isOther ? customText.trim() : '');
    setSelectedReason('');
    setCustomText('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomText('');
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="report-modal__backdrop"
      dialogClassName="report-modal"
      ariaLabel="Отправить жалобу"
      title="Отправить жалобу"
      headerClassName="report-modal__head"
      titleClassName="report-modal__title"
      closeClassName="report-modal__close"
    >
        <form className="report-modal__content" onSubmit={handleSubmit}>
          <div className="report-modal__reasons">
            {REPORT_REASONS.map((reason) => (
              <label key={reason} className="report-modal__radio-label">
                <input
                  type="radio"
                  className="report-modal__radio-input"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span className="report-modal__radio-text">{REPORT_REASON_LABEL[reason]}</span>
              </label>
            ))}
          </div>

          {isOther && (
            <textarea
              className="report-modal__textarea"
              placeholder="Опишите причину (минимум 10 символов)..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
          )}

          <div className="report-modal__actions">
            <button
              type="submit"
              className="report-modal__submit-btn"
              disabled={!canSubmit}
            >
              <CheckIcon />
            </button>
          </div>
        </form>
    </ModalShell>
  );
};

export default ReportModal;
