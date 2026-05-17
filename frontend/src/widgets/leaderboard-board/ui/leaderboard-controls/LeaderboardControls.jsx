import {
  LEADERBOARD_CATEGORY_OPTIONS,
  LEADERBOARD_PERIOD_OPTIONS
} from '@/entities/leaderboard';
import { SearchIcon } from '@/shared/ui/icons';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import './LeaderboardControls.css';

const LeaderboardControls = ({
  period,
  category,
  searchValue,
  onPeriodChange,
  onCategoryChange,
  onSearchChange,
  onMyRatingClick
}) => {
  const periodDropdownOptions = LEADERBOARD_PERIOD_OPTIONS.map((option) => ({
    value: option.key,
    label: option.label
  }));
  const categoryDropdownOptions = LEADERBOARD_CATEGORY_OPTIONS.map((option) => ({
    value: option.key,
    label: option.label
  }));

  return (
    <div className="leaderboard-controls">
      <div className="leaderboard-controls__dropdowns">
        <ReviewDropdown
          label="Период:"
          value={period}
          options={periodDropdownOptions}
          onChange={onPeriodChange}
        />

        <ReviewDropdown
          label="Категория:"
          value={category}
          options={categoryDropdownOptions}
          onChange={onCategoryChange}
        />
      </div>

      <div className="leaderboard-controls__actions">
        <label className="leaderboard-controls__search">
          <SearchIcon />
          <input
            type="search"
            value={searchValue}
            placeholder="Поиск"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button className="leaderboard-controls__my-rating" type="button" onClick={onMyRatingClick}>
          Мой рейтинг
        </button>
      </div>
    </div>
  );
};

export default LeaderboardControls;
