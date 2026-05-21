import { useEffect, useRef, useState } from 'react';
import { UnwrapIcon, CheckIcon } from '@/shared/ui/icons';
import reviewDropdownStyles from './ReviewDropdown.module.scss';

const ReviewDropdown = ({
  label,
  placeholder = '',
  value,
  options,
  onChange,
  rootClassName = '',
  labelClassName = '',
  triggerClassName = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={[reviewDropdownStyles.root, rootClassName].filter(Boolean).join(' ')} ref={rootRef}>
      <span className={[reviewDropdownStyles.label, labelClassName].filter(Boolean).join(' ')}>{label}</span>
      <button
        className={[reviewDropdownStyles.trigger, triggerClassName, isOpen ? reviewDropdownStyles.isOpen : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        onClick={() => setIsOpen((prevState) => !prevState)}
        aria-expanded={isOpen}
      >
        <span
          className={[reviewDropdownStyles.value, selectedOption ? '' : reviewDropdownStyles.isPlaceholder]
            .filter(Boolean)
            .join(' ')}
        >
          {selectedOption?.label || placeholder}
        </span>
        <span
          className={[reviewDropdownStyles.icon, isOpen ? reviewDropdownStyles.isOpen : ''].filter(Boolean).join(' ')}
        >
          <UnwrapIcon />
        </span>
      </button>

      {isOpen && (
        <div className={[reviewDropdownStyles.menu, menuClassName].filter(Boolean).join(' ')} role="listbox">
          {options.map((option) => (
            <button
              className={[reviewDropdownStyles.option, option.value === value ? reviewDropdownStyles.isActive : '']
                .filter(Boolean)
                .join(' ')}
              key={option.value || 'all'}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className={reviewDropdownStyles.optionCheck}>
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewDropdown;
