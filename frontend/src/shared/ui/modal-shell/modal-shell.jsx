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
  children,
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
    <div className={overlayClassName} role="presentation">
      {closeOnBackdrop && (
        <button
          type="button"
          aria-label="Закрыть окно"
          onClick={handleBackdropClick}
          style={{
            position: 'absolute',
            inset: 0,
            border: 0,
            padding: 0,
            background: 'transparent',
            cursor: 'default',
          }}
        />
      )}
      <div
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {title ? (
          <div className={headerClassName}>
            <h2 className={titleClassName} id={titleId}>
              {title}
            </h2>
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
