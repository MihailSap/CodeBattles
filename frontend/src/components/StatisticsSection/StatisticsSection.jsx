import { StarIcon } from '../Icons/Icons';
import './StatisticsSection.css';

const StatisticsSection = ({ acceptedDecisionsPercent, getPercentClass, statCards, statistics }) => {
  return (
    <section className="profile-page__section profile-page__section--statistics">
      <div className="profile-page__section-head">
        <div className="profile-page__section-title-wrap">
          <h2 className="profile-page__section-title">Статистика</h2>
        </div>
      </div>

      <div className="profile-page__section-body profile-page__statistics-body">
        <div className="profile-page__statistics-grid">
          {statCards.map((card) => {
            const value = Math.max(0, Math.min(5, Number(statistics[card.key]) || 0));

            return (
              <div key={card.key} className="profile-page__stat-card">
                <p className="profile-page__stat-title">{card.title}</p>
                <div className="profile-page__stars-row">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={`${card.key}-${index + 1}`} filled={index + 1 <= value} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="profile-page__accepted-block">
          <p className="profile-page__stat-title">Принятые решения</p>
          <p className={`profile-page__accepted-percent ${getPercentClass(acceptedDecisionsPercent)}`}>{acceptedDecisionsPercent}%</p>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
