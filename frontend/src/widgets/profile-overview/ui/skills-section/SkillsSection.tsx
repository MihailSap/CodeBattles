import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, CrossIcon, PencilIcon } from '@/shared/ui/icons';
import type { SkillGroupKey, SkillsPopupPosition } from '../../lib/use-skills-popup';
import skillsSectionStyles from './SkillsSection.module.scss';
import profileOverviewLayoutStyles from '../ProfileOverviewLayout.module.scss';

interface SkillsGroup {
  key: SkillGroupKey;
  title: string;
  selected: readonly string[];
  orderedOptions?: readonly string[];
}

interface SkillsSectionProps {
  canEditProfile: boolean;
  isActionBlocked: boolean;
  isSkillsEditMode: boolean;
  mobilePopupPosition: SkillsPopupPosition | null;
  onClearGroup: (groupKey: SkillGroupKey) => void;
  onOpenSkillsPopup: (groupKey: SkillGroupKey, event: MouseEvent<HTMLButtonElement>) => void;
  onSkillsEditCancel: () => void;
  onSkillsEditStart: () => void;
  onSkillsSave: () => void | Promise<void>;
  onToggleSkill: (groupKey: SkillGroupKey, skillName: string) => void;
  openedSkillsPopup: SkillGroupKey | null;
  popupMaxHeight: number;
  skillsByGroup: readonly SkillsGroup[];
  skillsDraftByGroup: readonly SkillsGroup[];
}

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
  popupMaxHeight,
  skillsByGroup,
  skillsDraftByGroup,
}: SkillsSectionProps) => {
  return (
    <section className={[profileOverviewLayoutStyles.section, skillsSectionStyles.isSkills].join(' ')}>
      <div className={profileOverviewLayoutStyles.sectionHead}>
        <div className={profileOverviewLayoutStyles.sectionTitleWrap}>
          <h2 className={profileOverviewLayoutStyles.sectionTitle}>Стек</h2>
          {canEditProfile && !isSkillsEditMode && (
            <button
              className={profileOverviewLayoutStyles.editButton}
              type="button"
              onClick={onSkillsEditStart}
              disabled={isActionBlocked}
              aria-label="Редактировать стек"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      </div>

      <div className={[profileOverviewLayoutStyles.sectionBody, skillsSectionStyles.body].join(' ')}>
        {(isSkillsEditMode ? skillsDraftByGroup : skillsByGroup).map((group) => {
          const popupId = `profile-skills-popup-${group.key}`;
          const isPopupOpen = openedSkillsPopup === group.key;

          return (
            <div className={skillsSectionStyles.skillGroup} key={group.key}>
              <div className={skillsSectionStyles.skillGroupHead}>
                <h3 className={skillsSectionStyles.skillTitle}>{group.title}</h3>
                {canEditProfile && isSkillsEditMode && (
                  <button
                    className={skillsSectionStyles.clearButton}
                    type="button"
                    onClick={() => onClearGroup(group.key)}
                    disabled={isActionBlocked}
                  >
                    Очистить все
                  </button>
                )}
              </div>

              <div className={skillsSectionStyles.list}>
                {group.selected.length === 0 && !(canEditProfile && isSkillsEditMode) ? (
                  <span className={skillsSectionStyles.isEmpty}>Не указано</span>
                ) : (
                  group.selected.map((skillName) => (
                    <button
                      className={[
                        skillsSectionStyles.skillTag,
                        canEditProfile && isSkillsEditMode ? skillsSectionStyles.isEditable : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      key={skillName}
                      onClick={() =>
                        canEditProfile && isSkillsEditMode ? onToggleSkill(group.key, skillName) : undefined
                      }
                      disabled={!canEditProfile || !isSkillsEditMode || isActionBlocked}
                    >
                      {skillName}
                    </button>
                  ))
                )}

                {canEditProfile && isSkillsEditMode && (
                  <div className={skillsSectionStyles.popupWrap}>
                    <button
                      className={skillsSectionStyles.addSkillButton}
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

                    {isPopupOpen &&
                      mobilePopupPosition &&
                      createPortal(
                        <div
                          id={popupId}
                          className={[skillsSectionStyles.popup, skillsSectionStyles.isPortal].join(' ')}
                          data-skills-popup="true"
                          role="dialog"
                          aria-label={`Выбор навыков: ${group.title}`}
                          style={{
                            top: `${mobilePopupPosition.top}px`,
                            left: `${mobilePopupPosition.left}px`,
                            width: `${mobilePopupPosition.width}px`,
                            maxHeight: `${popupMaxHeight}px`,
                          }}
                        >
                          {(group.orderedOptions ?? []).map((skillName) => {
                            const isChecked = group.selected.includes(skillName);

                            return (
                              <label key={skillName} className={skillsSectionStyles.option}>
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
                        </div>,
                        document.body
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEditProfile && isSkillsEditMode && (
        <div className={profileOverviewLayoutStyles.actions}>
          <button
            className={[profileOverviewLayoutStyles.action, profileOverviewLayoutStyles.isSave].join(' ')}
            type="button"
            onClick={onSkillsSave}
            disabled={isActionBlocked}
            aria-label="Сохранить стек"
          >
            <CheckIcon />
          </button>
          <button
            className={[profileOverviewLayoutStyles.action, profileOverviewLayoutStyles.isCancel].join(' ')}
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
