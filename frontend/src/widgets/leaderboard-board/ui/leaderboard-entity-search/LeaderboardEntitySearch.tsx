import { useEffect, useRef, useState } from 'react';
import { CheckIcon, SearchIcon } from '@/shared/ui/icons';
import leaderboardEntitySearchStyles from './LeaderboardEntitySearch.module.scss';

const LeaderboardEntitySearch = ({
  value,
  placeholder,
  options,
  selectedEntity,
  emptyText,
  onValueChange,
  onSelect,
}: LegacyValue) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<LegacyValue>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: LegacyValue) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={leaderboardEntitySearchStyles.root} ref={rootRef}>
      <SearchIcon />
      <input
        className={leaderboardEntitySearchStyles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event: LegacyValue) => {
          onValueChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className={leaderboardEntitySearchStyles.dropdown}>
          {options.length > 0 ? (
            options.map((option: LegacyValue) => (
              <button
                className={leaderboardEntitySearchStyles.option}
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <span>{option.name}</span>
                {selectedEntity?.id === option.id && <CheckIcon />}
              </button>
            ))
          ) : (
            <div className={leaderboardEntitySearchStyles.isEmpty}>{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardEntitySearch;
