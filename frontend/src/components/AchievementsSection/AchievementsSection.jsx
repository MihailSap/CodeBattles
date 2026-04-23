import { CheckIcon } from '../Icons/Icons';
import './AchievementsSection.css';

const AchievementsSection = ({ achievements, canEditProfile, receivedAchievementIdSet }) => {
  return (
    <section className="profile-page__section profile-page__section--achievements">
      <div className="profile-page__section-head">
        <div className="profile-page__section-title-wrap">
          <h2 className="profile-page__section-title">Достижения</h2>
        </div>
      </div>

      <div className="profile-page__section-body profile-page__achievements-body">
        {achievements.length === 0 && !canEditProfile ? (
          <p className="profile-page__achievements-empty">Еще не получено ни одного достижения</p>
        ) : (
          <div className="profile-page__achievements-list">
            {
              achievements.map((achievement) => {
                const isReceived = receivedAchievementIdSet.has(achievement.id);

                return (
                  <article
                    key={achievement.id}
                    className={`profile-page__achievement-item ${isReceived ? 'profile-page__achievement-item--received' : 'profile-page__achievement-item--not-received'}`}
                  >
                    <img className="profile-page__achievement-image" src={achievement.image} alt={achievement.name} />
                    <div className="profile-page__achievement-content">
                      <p className="profile-page__achievement-name">
                        {achievement.name}
                        {isReceived && (
                          <span className="profile-page__achievement-check" aria-label="Получено">
                            <CheckIcon />
                          </span>
                        )}
                      </p>
                      <p className="profile-page__achievement-description">{achievement.description}</p>
                    </div>
                  </article>
                );
              })
            }
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementsSection;
