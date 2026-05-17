import { useEffect, useRef, useState } from 'react';
import { CheckIcon, SearchIcon } from '@/shared/ui/icons';
import './LeaderboardEntitySearch.css';

const LeaderboardEntitySearch = ({
  value,
  placeholder,
  options,
  selectedEntity,
  emptyText,
  onValueChange,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
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
    <div className="leaderboard-entity-search" ref={rootRef}>
      <SearchIcon />
      <input
        className="leaderboard-entity-search__input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="leaderboard-entity-search__dropdown">
          {options.length > 0 ? options.map((option) => (
            <button
              className="leaderboard-entity-search__option"
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
          )) : (
            <div className="leaderboard-entity-search__empty">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardEntitySearch;
