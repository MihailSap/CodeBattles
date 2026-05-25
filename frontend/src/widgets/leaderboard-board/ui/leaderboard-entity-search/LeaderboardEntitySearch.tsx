import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import type { LeaderboardEntity } from '@/entities/leaderboard';
import { CheckIcon, SearchIcon } from '@/shared/ui/icons';
import leaderboardEntitySearchStyles from './LeaderboardEntitySearch.module.scss';

interface LeaderboardEntitySearchProps {
  value: string;
  placeholder: string;
  options: readonly LeaderboardEntity[];
  selectedEntity: LeaderboardEntity | null;
  emptyText: string;
  onValueChange: (value: string) => void;
  onSelect: (entity: LeaderboardEntity) => void;
}

const LeaderboardEntitySearch = ({
  value,
  placeholder,
  options,
  selectedEntity,
  emptyText,
  onValueChange,
  onSelect,
}: LeaderboardEntitySearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) {
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
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onValueChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className={leaderboardEntitySearchStyles.dropdown}>
          {options.length > 0 ? (
            options.map((option) => (
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
