import ModalShell from '../ModalShell/ModalShell';
import './ConfirmActionModal.css';

const ConfirmActionModal = ({ isOpen, title, description, confirmLabel, onCancel, onConfirm, isSubmitting, isDeleteAction }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      overlayClassName="confirm-modal-backdrop"
      dialogClassName="confirm-modal"
      ariaLabel={title}
    >
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__description">{description}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__button confirm-modal__button--cancel" type="button" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </button>
          <button
            className={`confirm-modal__button confirm-modal__button--confirm ${isDeleteAction ? 'confirm-modal__button--confirm-delete' : 'confirm-modal__button--confirm-success'}`}
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
