import { CrossIcon } from '@/shared/ui/icons';

const ModalShell = ({
  isOpen,
  onClose,
  overlayClassName,
  dialogClassName,
  headerClassName,
  titleClassName,
  closeClassName,
  title,
  titleId,
  closeAriaLabel = 'Закрыть',
  showCloseButton = true,
  closeDisabled = false,
  ariaLabel,
  ariaLabelledBy,
  closeOnBackdrop = true,
  children
}) => {
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div className={overlayClassName} role="presentation" onClick={handleBackdropClick}>
      <div
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className={headerClassName}>
            <h2 className={titleClassName} id={titleId}>{title}</h2>
            {showCloseButton && (
              <button
                className={closeClassName}
                type="button"
                onClick={onClose}
                aria-label={closeAriaLabel}
                disabled={closeDisabled}
              >
                <CrossIcon />
              </button>
            )}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
