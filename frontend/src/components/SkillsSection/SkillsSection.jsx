import editIcon from '../../assets/edit-icon.svg';
import { CheckIcon, CrossIcon } from '../Icons/Icons';
import './SkillsSection.css';

const SkillsSection = ({
  canEditProfile,
  isActionBlocked,
  isSkillsEditMode,
  mobilePopupPosition,
  onClearGroup,
  onOpenSkillsPopup,
  onSkillsEditCancel,
  onSkillsEditStart,
  onSkillsSave,
  onToggleSkill,
  openedSkillsPopup,
  popupDirection,
  popupMaxHeight,
  skillsByGroup,
  skillsDraftByGroup
}) => {
  return (
    <section className="profile-page__section profile-page__section--skills">
      <div className="profile-page__section-head">
        <div className="profile-page__section-title-wrap">
          <h2 className="profile-page__section-title">Стек</h2>
          {canEditProfile && !isSkillsEditMode && (
            <button
              className="profile-page__edit-button"
              type="button"
              onClick={onSkillsEditStart}
              disabled={isActionBlocked}
              aria-label="Редактировать стек"
            >
              <img src={editIcon} alt="" width="20" height="20" />
            </button>
          )}
        </div>
      </div>

      <div className="profile-page__section-body profile-page__skills-body">
        {(isSkillsEditMode ? skillsDraftByGroup : skillsByGroup).map((group) => {
          const popupId = `profile-skills-popup-${group.key}`;
          const isPopupOpen = openedSkillsPopup === group.key;

          return (
            <div className="profile-page__skill-group" key={group.key}>
              <div className="profile-page__skill-group-head">
                <h3 className="profile-page__skill-title">{group.title}</h3>
                {canEditProfile && isSkillsEditMode && (
                  <button
                    className="profile-page__clear-button"
                    type="button"
                    onClick={() => onClearGroup(group.key)}
                    disabled={isActionBlocked}
                  >
                    Очистить все
                  </button>
                )}
              </div>

              <div className="profile-page__skills-list">
                {group.selected.length === 0 && !(canEditProfile && isSkillsEditMode) ? (
                  <span className="profile-page__empty">Не задано</span>
                ) : (
                  group.selected.map((skillName) => (
                    <button
                      className={`profile-page__skill-tag ${canEditProfile && isSkillsEditMode ? 'profile-page__skill-tag--editable' : ''}`}
                      type="button"
                      key={skillName}
                      onClick={() => (canEditProfile && isSkillsEditMode ? onToggleSkill(group.key, skillName) : undefined)}
                      disabled={!canEditProfile || !isSkillsEditMode || isActionBlocked}
                    >
                      {skillName}
                    </button>
                  ))
                )}

                {canEditProfile && isSkillsEditMode && (
                  <div className="profile-page__skills-popup-wrap">
                    <button
                      className="profile-page__add-skill-button"
                      type="button"
                      data-skills-add="true"
                      onClick={(event) => onOpenSkillsPopup(group.key, event)}
                      disabled={isActionBlocked}
                      aria-label={`Добавить навык в ${group.title}`}
                      aria-haspopup="dialog"
                      aria-controls={popupId}
                      aria-expanded={isPopupOpen}
                    >
                      +
                    </button>

                    {isPopupOpen && (
                      <div
                        id={popupId}
                        className={`profile-page__skills-popup ${popupDirection === 'up' ? 'profile-page__skills-popup--top' : ''} ${mobilePopupPosition ? 'profile-page__skills-popup--mobile' : ''}`}
                        data-skills-popup="true"
                        role="dialog"
                        aria-label={`Выбор навыков: ${group.title}`}
                        style={
                          mobilePopupPosition
                            ? {
                                top: `${mobilePopupPosition.top}px`,
                                left: `${mobilePopupPosition.left}px`,
                                width: `${mobilePopupPosition.width}px`,
                                maxHeight: `${popupMaxHeight}px`
                              }
                            : { maxHeight: `${popupMaxHeight}px` }
                        }
                      >
                        {group.orderedOptions.map((skillName) => {
                          const isChecked = group.selected.includes(skillName);

                          return (
                            <label key={skillName} className="profile-page__skills-option">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => onToggleSkill(group.key, skillName)}
                                disabled={isActionBlocked}
                              />
                              <span>{skillName}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEditProfile && isSkillsEditMode && (
        <div className="profile-page__actions">
          <button
            className="profile-page__action profile-page__action--save"
            type="button"
            onClick={onSkillsSave}
            disabled={isActionBlocked}
            aria-label="Сохранить стек"
          >
            <CheckIcon />
          </button>
          <button
            className="profile-page__action profile-page__action--cancel"
            type="button"
            onClick={onSkillsEditCancel}
            disabled={isActionBlocked}
            aria-label="Отменить изменения стека"
          >
            <CrossIcon />
          </button>
        </div>
      )}
    </section>
  );
};

export default SkillsSection;
