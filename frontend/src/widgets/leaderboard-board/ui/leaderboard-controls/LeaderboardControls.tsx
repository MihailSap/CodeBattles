import { LEADERBOARD_CATEGORY_OPTIONS, LEADERBOARD_PERIOD_OPTIONS } from '@/entities/leaderboard';
import { SearchIcon } from '@/shared/ui/icons';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import leaderboardControlsStyles from './LeaderboardControls.module.scss';

const LeaderboardControls = ({
  period,
  category,
  searchValue,
  onPeriodChange,
  onCategoryChange,
  onSearchChange,
  onMyRatingClick,
}: LegacyValue) => {
  const periodDropdownOptions = LEADERBOARD_PERIOD_OPTIONS.map((option: LegacyValue) => ({
    value: option.key,
    label: option.label,
  }));

  const categoryDropdownOptions = LEADERBOARD_CATEGORY_OPTIONS.map((option: LegacyValue) => ({
    value: option.key,
    label: option.label,
  }));

  return (
    <div className={leaderboardControlsStyles.root}>
      <div className={leaderboardControlsStyles.dropdowns}>
        <ReviewDropdown label="Период:" value={period} options={periodDropdownOptions} onChange={onPeriodChange} />

        <ReviewDropdown
          label="Категория:"
          value={category}
          options={categoryDropdownOptions}
          onChange={onCategoryChange}
        />
      </div>

      <div className={leaderboardControlsStyles.actions}>
        <label className={leaderboardControlsStyles.search}>
          <SearchIcon />
          <input
            type="search"
            value={searchValue}
            placeholder="Поиск"
            onChange={(event: LegacyValue) => onSearchChange(event.target.value)}
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
