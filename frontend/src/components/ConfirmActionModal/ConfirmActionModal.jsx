import './ConfirmActionModal.css';

const ConfirmActionModal = ({ isOpen, title, description, confirmLabel, onCancel, onConfirm, isSubmitting }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__description">{description}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__button confirm-modal__button--cancel" type="button" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </button>
          <button className="confirm-modal__button confirm-modal__button--confirm" type="button" onClick={onConfirm} disabled={isSubmitting}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
