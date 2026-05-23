import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import confirmActionModalStyles from './ConfirmActionModal.module.scss';

const ConfirmActionModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  isSubmitting,
  isDeleteAction,
}: LegacyValue) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      overlayClassName={confirmActionModalStyles.backdrop}
      dialogClassName={confirmActionModalStyles.root}
      ariaLabel={title}
    >
      <h3 className={confirmActionModalStyles.title}>{title}</h3>
      <p className={confirmActionModalStyles.description}>{description}</p>
      <div className={confirmActionModalStyles.actions}>
        <button className={confirmActionModalStyles.button} type="button" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </button>
        <button
          className={[
            confirmActionModalStyles.button,
            isDeleteAction ? confirmActionModalStyles.isConfirmDelete : confirmActionModalStyles.isConfirmSuccess,
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};

export default ConfirmActionModal;
