import { memo } from 'react';
import { CheckIcon } from '@/shared/ui/icons';
import type { Achievement } from '../../model/achievements';
import achievementsSectionStyles from './AchievementsSection.module.scss';

interface AchievementsSectionProps {
  achievements: Achievement[];
  canEditProfile: boolean;
  receivedAchievementIdSet: ReadonlySet<number>;
}

const AchievementsSection = ({ achievements, canEditProfile, receivedAchievementIdSet }: AchievementsSectionProps) => {
  return (
    <section className={[achievementsSectionStyles.section, achievementsSectionStyles.isAchievements].join(' ')}>
      <div className={achievementsSectionStyles.sectionHead}>
        <div className={achievementsSectionStyles.sectionTitleWrap}>
          <h2 className={achievementsSectionStyles.sectionTitle}>Достижения</h2>
        </div>
      </div>

      <div className={[achievementsSectionStyles.sectionBody, achievementsSectionStyles.body].join(' ')}>
        {achievements.length === 0 && !canEditProfile ? (
          <p className={achievementsSectionStyles.empty}>Еще не получено ни одного достижения</p>
        ) : (
          <div className={achievementsSectionStyles.list}>
            {achievements.map((achievement) => {
              const isReceived = receivedAchievementIdSet.has(achievement.id);

              return (
                <article
                  key={achievement.id}
                  className={[
                    achievementsSectionStyles.achievementItem,
                    isReceived ? achievementsSectionStyles.isReceived : achievementsSectionStyles.isNotReceived,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <img
                    className={achievementsSectionStyles.achievementImage}
                    src={achievement.image}
                    alt={achievement.name}
                  />
                  <div className={achievementsSectionStyles.achievementContent}>
                    <p className={achievementsSectionStyles.achievementName}>
                      {achievement.name}
                      {isReceived && (
                        <span className={achievementsSectionStyles.achievementCheck} aria-label="Получено">
                          <CheckIcon />
                        </span>
                      )}
                    </p>
                    <p className={achievementsSectionStyles.achievementDescription}>{achievement.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(AchievementsSection);
