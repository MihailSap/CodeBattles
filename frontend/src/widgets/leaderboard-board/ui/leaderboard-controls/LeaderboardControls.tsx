import {
  LEADERBOARD_CATEGORY_OPTIONS,
  LEADERBOARD_PERIOD_OPTIONS,
  type LeaderboardCategory,
  type LeaderboardPeriod,
} from '@/entities/leaderboard';
import { SearchIcon } from '@/shared/ui/icons';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import leaderboardControlsStyles from './LeaderboardControls.module.scss';

interface LeaderboardControlsProps {
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  searchValue: string;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onCategoryChange: (category: LeaderboardCategory) => void;
  onSearchChange: (searchValue: string) => void;
  onMyRatingClick: () => void;
}

const LeaderboardControls = ({
  period,
  category,
  searchValue,
  onPeriodChange,
  onCategoryChange,
  onSearchChange,
  onMyRatingClick,
}: LeaderboardControlsProps) => {
  const periodDropdownOptions = LEADERBOARD_PERIOD_OPTIONS.map((option) => ({
    value: option.key,
    label: option.label,
  }));

  const categoryDropdownOptions = LEADERBOARD_CATEGORY_OPTIONS.map((option) => ({
    value: option.key,
    label: option.label,
  }));

  return (
    <div className={leaderboardControlsStyles.root}>
      <div className={leaderboardControlsStyles.dropdowns}>
        <ReviewDropdown
          label="Период:"
          value={period}
          options={periodDropdownOptions}
          onChange={onPeriodChange}
          triggerClassName={leaderboardControlsStyles.dropdownTrigger}
          menuClassName={leaderboardControlsStyles.dropdownMenu}
        />

        <ReviewDropdown
          label="Категория:"
          value={category}
          options={categoryDropdownOptions}
          onChange={onCategoryChange}
          triggerClassName={leaderboardControlsStyles.dropdownTrigger}
          menuClassName={leaderboardControlsStyles.dropdownMenu}
        />
      </div>

      <div className={leaderboardControlsStyles.actions}>
        <label className={leaderboardControlsStyles.search}>
          <SearchIcon />
          <input
            type="search"
            value={searchValue}
            placeholder="Поиск"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button className={leaderboardControlsStyles.myRating} type="button" onClick={onMyRatingClick}>
          Мой рейтинг
        </button>
      </div>
    </div>
  );
};

export default LeaderboardControls;
