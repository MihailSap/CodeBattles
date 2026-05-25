import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { REPORT_REASON_LABEL, REPORT_REASONS, type ReportReason } from '@/entities/review';
import { CheckIcon } from '@/shared/ui/icons';
import { reportFormSchema, type ReportFormInput, type ReportFormValues } from '../../model/report-schema';
import reportModalStyles from './ReportModal.module.scss';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, comment: string) => void | Promise<void>;
  isSubmitting: boolean;
}

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }: ReportModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<ReportFormInput, unknown, ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      selectedReason: '',
    },
    mode: 'onChange',
  });

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;
  const canSubmit = isValid && !isSubmitting;

  const submit = async ({ selectedReason: reason }: ReportFormValues) => {
    if (!canSubmit) return;
    await onSubmit(reason, '');
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
          {REPORT_REASONS.map((reason) => (
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
