import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SKILL_GROUPS } from '../../constants/profileSkills';
import { useSkillsPopup } from '../../hooks/useSkillsPopup';
import './ProjectSkillsSelector.css';

const allSkills = SKILL_GROUPS.flatMap((group) => group.options);

const uniqueSkills = [...new Set(allSkills)].sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));

const ProjectSkillsSelector = ({
  value,
  onChange,
  title = 'Технологический стек:',
  titleClassName = 'project-skills-selector__title',
  forceOpenUp = false,
  boundarySelector = '',
  withClear = true,
  disabled = false,
  emptyLabel = 'Не указано'
}) => {
  const { openedSkillsPopup, popupDirection, popupMaxHeight, mobilePopupPosition, openSkillsPopup } = useSkillsPopup();
  const [alignRight, setAlignRight] = useState(false);
  const [desktopPopupWidth, setDesktopPopupWidth] = useState(320);
  const triggerRef = useRef(null);

  const selected = useMemo(
    () => [...new Set((value || []).filter((item) => uniqueSkills.includes(item)))].sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' })),
    [value]
  );

  const orderedOptions = useMemo(() => {
    const selectedSet = new Set(selected);
    const unselected = uniqueSkills.filter((skill) => !selectedSet.has(skill));

    return [...unselected, ...selected];
  }, [selected]);

  const toggleSkill = (skillName) => {
    if (disabled) {
      return;
    }

    if (selected.includes(skillName)) {
      onChange(selected.filter((item) => item !== skillName));
      return;
    }

    onChange([...selected, skillName].sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' })));
  };

  const clearAll = () => {
    if (disabled) {
      return;
    }

    onChange([]);
  };

  const recalculateDesktopPopupPosition = useCallback(() => {
    const triggerElement = triggerRef.current;

    if (!triggerElement) {
      return;
    }

    const viewportPadding = 12;
    const triggerRect = triggerElement.getBoundingClientRect();
    const boundaryElement = boundarySelector ? triggerElement.closest(boundarySelector) : null;
    const boundaryRect = boundaryElement?.getBoundingClientRect();

    const maxAllowedWidth = boundaryRect
      ? Math.max(220, Math.floor(boundaryRect.width) - 24)
      : window.innerWidth - viewportPadding * 2;
    const popupWidth = Math.min(320, maxAllowedWidth);
    const rightLimit = boundaryRect ? boundaryRect.right - 12 : window.innerWidth - viewportPadding;
    const shouldAlignRight = triggerRect.left + popupWidth > rightLimit;

    setAlignRight((previousState) => (previousState === shouldAlignRight ? previousState : shouldAlignRight));
    setDesktopPopupWidth((previousState) => (previousState === popupWidth ? previousState : popupWidth));
  }, [boundarySelector]);

  const handleOpenPopup = (event) => {
    triggerRef.current = event.currentTarget;
    recalculateDesktopPopupPosition();
    openSkillsPopup('project-stack', event);
  };

  useEffect(() => {
    if (openedSkillsPopup !== 'project-stack') {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      recalculateDesktopPopupPosition();
    });

    const handleViewportChange = () => {
      recalculateDesktopPopupPosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [openedSkillsPopup, recalculateDesktopPopupPosition, selected]);

  return (
    <div className="project-skills-selector">
      <div className="project-skills-selector__head">
        <h3 className={titleClassName}>{title}</h3>
        {withClear && (
          <button className="project-skills-selector__clear" type="button" onClick={clearAll} disabled={disabled || selected.length === 0}>
            Очистить все
          </button>
        )}
      </div>

      <div className="project-skills-selector__list">
        {selected.length === 0 && <span className="project-skills-selector__empty">{emptyLabel}</span>}

        {selected.map((skillName) => (
          <button className="project-skills-selector__tag" type="button" key={skillName} onClick={() => toggleSkill(skillName)} disabled={disabled}>
            {skillName}
          </button>
        ))}

        <div className="project-skills-selector__popup-wrap">
          <button
            ref={triggerRef}
            className="project-skills-selector__add"
            type="button"
            onClick={handleOpenPopup}
            data-skills-add="true"
            aria-haspopup="dialog"
            aria-expanded={openedSkillsPopup === 'project-stack'}
            aria-controls="project-stack-options"
            disabled={disabled}
          >
            +
          </button>

          {openedSkillsPopup === 'project-stack' && (
            <div
              id="project-stack-options"
              className={`project-skills-selector__popup ${popupDirection === 'up' || forceOpenUp ? 'project-skills-selector__popup--top' : ''} ${alignRight ? 'project-skills-selector__popup--right' : ''} ${mobilePopupPosition ? 'project-skills-selector__popup--mobile' : ''}`}
              role="dialog"
              aria-label="Выбор стека"
              data-skills-popup="true"
              style={
                mobilePopupPosition
                  ? {
                      top: `${mobilePopupPosition.top}px`,
                      left: `${mobilePopupPosition.left}px`,
                      width: `${mobilePopupPosition.width}px`,
                      maxHeight: `${popupMaxHeight}px`
                    }
                  : { maxHeight: `${popupMaxHeight}px`, width: `${desktopPopupWidth}px` }
              }
            >
              {orderedOptions.map((skillName) => {
                const isChecked = selected.includes(skillName);

                return (
                  <label className="project-skills-selector__option" key={skillName}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleSkill(skillName)} disabled={disabled} />
                    <span>{skillName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSkillsSelector;
