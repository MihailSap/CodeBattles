import { useEffect, useRef, useState } from 'react';
import { UnwrapIcon, CheckIcon } from '@/shared/ui/icons';
import './ReviewDropdown.css';

const ReviewDropdown = ({ label, placeholder = '', value, options, onChange }) => {
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
    <div className="review-dropdown" ref={rootRef}>
      <span className="review-dropdown__label">{label}</span>
      <button
        className={`review-dropdown__trigger ${isOpen ? 'review-dropdown__trigger--open' : ''}`}
        type="button"
        onClick={() => setIsOpen((prevState) => !prevState)}
        aria-expanded={isOpen}
      >
        <span className={`review-dropdown__value ${selectedOption ? '' : 'review-dropdown__value--placeholder'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`review-dropdown__icon ${isOpen ? 'review-dropdown__icon--open' : ''}`}>
          <UnwrapIcon />
        </span>
      </button>

      {isOpen && (
        <div className="review-dropdown__menu" role="listbox">
          {options.map((option) => (
            <button
              className={`review-dropdown__option ${option.value === value ? 'review-dropdown__option--active' : ''}`}
              key={option.value || 'all'}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="review-dropdown__option-check">
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
