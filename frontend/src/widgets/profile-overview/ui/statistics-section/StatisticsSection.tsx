import type { ProfileStatistics } from '@/entities/profile';
import { StarIcon } from '@/shared/ui/icons';
import statisticsSectionStyles from './StatisticsSection.module.scss';
import profileOverviewLayoutStyles from '../ProfileOverviewLayout.module.scss';

interface StatisticsCard {
  key: keyof Omit<ProfileStatistics, 'acceptedDecisionsPercent'>;
  title: string;
}

interface StatisticsSectionProps {
  acceptedDecisionsPercent: number;
  getPercentClass: (percent: number) => string;
  statCards: readonly StatisticsCard[];
  statistics: ProfileStatistics;
}

const StatisticsSection = ({
  acceptedDecisionsPercent,
  getPercentClass,
  statCards,
  statistics,
}: StatisticsSectionProps) => {
  return (
    <section className={[profileOverviewLayoutStyles.section, statisticsSectionStyles.isStatistics].join(' ')}>
      <div className={profileOverviewLayoutStyles.sectionHead}>
        <div className={profileOverviewLayoutStyles.sectionTitleWrap}>
          <h2 className={profileOverviewLayoutStyles.sectionTitle}>Статистика</h2>
        </div>
      </div>

      <div className={[profileOverviewLayoutStyles.sectionBody, statisticsSectionStyles.body].join(' ')}>
        <div className={statisticsSectionStyles.grid}>
          {statCards.map((card) => {
            const value = Math.max(0, Math.min(5, Number(statistics[card.key]) || 0));

            return (
              <div key={card.key} className={statisticsSectionStyles.statCard}>
                <p className={statisticsSectionStyles.statTitle}>{card.title}</p>
                <div className={statisticsSectionStyles.starsRow}>
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
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
