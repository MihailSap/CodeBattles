import { StarIcon } from '@/shared/ui/icons';
import statisticsSectionStyles from './StatisticsSection.module.scss';
import profilePageStyles from '../../../../pages/profile/ui/ProfilePage.module.scss';

const StatisticsSection = ({ acceptedDecisionsPercent, getPercentClass, statCards, statistics }: LegacyValue) => {
  return (
    <section className={[profilePageStyles.section, statisticsSectionStyles.isStatistics].join(' ')}>
      <div className={profilePageStyles.sectionHead}>
        <div className={profilePageStyles.sectionTitleWrap}>
          <h2 className={profilePageStyles.sectionTitle}>Статистика</h2>
        </div>
      </div>

      <div className={[profilePageStyles.sectionBody, statisticsSectionStyles.body].join(' ')}>
        <div className={statisticsSectionStyles.grid}>
          {statCards.map((card: LegacyValue) => {
            const value = Math.max(0, Math.min(5, Number(statistics[card.key]) || 0));

            return (
              <div key={card.key} className={statisticsSectionStyles.statCard}>
                <p className={statisticsSectionStyles.statTitle}>{card.title}</p>
                <div className={statisticsSectionStyles.starsRow}>
                  {Array.from({
                    length: 5,
                  }).map((_: LegacyValue, index: LegacyValue) => (
                    <StarIcon key={`${card.key}-${index + 1}`} filled={index + 1 <= value} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={statisticsSectionStyles.acceptedBlock}>
          <p className={statisticsSectionStyles.statTitle}>Принятые решения</p>
          <p
            className={[statisticsSectionStyles.acceptedPercent, getPercentClass(acceptedDecisionsPercent)]
              .filter(Boolean)
              .join(' ')}
          >
            {acceptedDecisionsPercent}%
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
