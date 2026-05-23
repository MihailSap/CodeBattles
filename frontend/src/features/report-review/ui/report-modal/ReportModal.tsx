import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { REPORT_REASON, REPORT_REASON_LABEL, REPORT_REASONS } from '@/entities/review';
import { CheckIcon } from '@/shared/ui/icons';
import { reportFormSchema } from '../../model/report-schema';
import reportModalStyles from './ReportModal.module.scss';

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LegacyValue) => {
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

  const selectedReason = useWatch({
    control,
    name: 'selectedReason',
  });

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;
  const isOther = selectedReason === REPORT_REASON.OTHER;
  const canSubmit = isValid && !isSubmitting;

  const submit = async ({ selectedReason: reason, customText }: LegacyValue) => {
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
      overlayClassName={reportModalStyles.backdrop}
      dialogClassName={reportModalStyles.root}
      ariaLabel="Отправить жалобу"
      title="Отправить жалобу"
      headerClassName={reportModalStyles.head}
      titleClassName={reportModalStyles.title}
      closeClassName={reportModalStyles.close}
    >
      <form className={reportModalStyles.content} onSubmit={handleSubmit(submit)}>
        <div className={reportModalStyles.reasons}>
          {REPORT_REASONS.map((reason: LegacyValue) => (
            <label key={reason} className={reportModalStyles.radioLabel}>
              <input
                type="radio"
                className={reportModalStyles.radioInput}
                value={reason}
                {...register('selectedReason')}
              />
              <span className={reportModalStyles.radioText}>{REPORT_REASON_LABEL[reason]}</span>
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            className={reportModalStyles.textarea}
            placeholder="Опишите причину (минимум 10 символов)..."
            {...register('customText')}
          />
        )}

        <div className={reportModalStyles.actions}>
          <button type="submit" className={reportModalStyles.submitBtn} disabled={!canSubmit}>
            <CheckIcon />
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default ReportModal;
