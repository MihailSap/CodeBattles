import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { REPORT_REASON, REPORT_REASON_LABEL, REPORT_REASONS } from '@/entities/review';
import { CheckIcon } from '@/shared/ui/icons';
import { reportFormSchema } from '../../model/report-schema';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      selectedReason: '',
      customText: '',
    },
    mode: 'onChange',
  });
  const selectedReason = useWatch({ control, name: 'selectedReason' });

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const isOther = selectedReason === REPORT_REASON.OTHER;
  const canSubmit = isValid && !isSubmitting;

  const submit = async ({ selectedReason: reason, customText }) => {
    if (!canSubmit) return;

    await onSubmit(reason, reason === REPORT_REASON.OTHER ? customText.trim() : '');
    reset();
  };

  const handleClose = () => {
    reset();
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
      <form className="report-modal__content" onSubmit={handleSubmit(submit)}>
        <div className="report-modal__reasons">
          {REPORT_REASONS.map((reason) => (
            <label key={reason} className="report-modal__radio-label">
              <input
                type="radio"
                className="report-modal__radio-input"
                name="reportReason"
                value={reason}
                {...register('selectedReason')}
              />
              <span className="report-modal__radio-text">{REPORT_REASON_LABEL[reason]}</span>
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            className="report-modal__textarea"
            placeholder="Опишите причину (минимум 10 символов)..."
            {...register('customText')}
          />
        )}

        <div className="report-modal__actions">
          <button type="submit" className="report-modal__submit-btn" disabled={!canSubmit}>
            <CheckIcon />
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default ReportModal;
