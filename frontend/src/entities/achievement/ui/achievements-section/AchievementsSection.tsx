import { memo } from 'react';
import { CheckIcon } from '@/shared/ui/icons';
import achievementsSectionStyles from './AchievementsSection.module.scss';
import profilePageStyles from '../../../../pages/profile/ui/ProfilePage.module.scss';

const AchievementsSection = ({ achievements, canEditProfile, receivedAchievementIdSet }: LegacyValue) => {
  return (
    <section className={[profilePageStyles.section, achievementsSectionStyles.isAchievements].join(' ')}>
      <div className={profilePageStyles.sectionHead}>
        <div className={profilePageStyles.sectionTitleWrap}>
          <h2 className={profilePageStyles.sectionTitle}>Достижения</h2>
        </div>
      </div>

      <div className={[profilePageStyles.sectionBody, achievementsSectionStyles.body].join(' ')}>
        {achievements.length === 0 && !canEditProfile ? (
          <p className={achievementsSectionStyles.empty}>Еще не получено ни одного достижения</p>
        ) : (
          <div className={achievementsSectionStyles.list}>
            {achievements.map((achievement: LegacyValue) => {
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
