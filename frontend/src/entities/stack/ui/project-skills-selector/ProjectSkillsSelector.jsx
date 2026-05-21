import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SKILL_GROUPS } from '../../model/profile-skills';
import projectSkillsSelectorStyles from './ProjectSkillsSelector.module.scss';
import taskCreatePageStyles from '../../../../pages/task-create/ui/TaskCreatePage.module.scss';
const allSkills = SKILL_GROUPS.flatMap((group) => group.options);

const uniqueSkills = [...new Set(allSkills)].sort((a, b) =>
  a.localeCompare(b, 'ru', {
    sensitivity: 'base',
  })
);

const POPUP_WIDTH = 420;
const POPUP_MAX_HEIGHT = 320;
const POPUP_VIEWPORT_PADDING = 12;
const POPUP_GAP = 8;
const POPUP_MIN_WIDTH = 210;
const POPUP_MIN_HEIGHT = 160;

const ProjectSkillsSelector = ({
  value,
  onChange,
  title = 'Технологический стек:',
  titleClassName = projectSkillsSelectorStyles.title,
  forceOpenUp = false,
  boundarySelector = '',
  withClear = true,
  disabled = false,
  emptyLabel = 'Не указано',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const rootRef = useRef(null);
  const popupRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = useMemo(
    () =>
      [...new Set((value || []).filter((item) => uniqueSkills.includes(item)))].sort((a, b) =>
        a.localeCompare(b, 'ru', {
          sensitivity: 'base',
        })
      ),
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

    onChange(
      [...selected, skillName].sort((a, b) =>
        a.localeCompare(b, 'ru', {
          sensitivity: 'base',
        })
      )
    );
  };

  const clearAll = () => {
    if (disabled) {
      return;
    }

    onChange([]);
  };

  const recalculatePopupPosition = useCallback(() => {
    const rootElement = rootRef.current;
    const triggerElement = triggerRef.current;

    if (!rootElement || !triggerElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();

    const boundaryElement =
      (boundarySelector ? triggerElement.closest(boundarySelector) : null) ||
      triggerElement.closest(`.${projectSkillsSelectorStyles.createModal}`) ||
      triggerElement.closest(`.${taskCreatePageStyles.content}`) ||
      triggerElement.closest('form');

    const boundaryRect = boundaryElement?.getBoundingClientRect();

    const minLeft = boundaryRect
      ? Math.max(POPUP_VIEWPORT_PADDING, boundaryRect.left + POPUP_VIEWPORT_PADDING)
      : POPUP_VIEWPORT_PADDING;

    const maxRight = boundaryRect
      ? Math.min(window.innerWidth - POPUP_VIEWPORT_PADDING, boundaryRect.right - POPUP_VIEWPORT_PADDING)
      : window.innerWidth - POPUP_VIEWPORT_PADDING;

    const minTop = boundaryRect
      ? Math.max(POPUP_VIEWPORT_PADDING, boundaryRect.top + POPUP_VIEWPORT_PADDING)
      : POPUP_VIEWPORT_PADDING;

    const maxBottom = boundaryRect
      ? Math.min(window.innerHeight - POPUP_VIEWPORT_PADDING, boundaryRect.bottom - POPUP_VIEWPORT_PADDING)
      : window.innerHeight - POPUP_VIEWPORT_PADDING;

    const availableWidth = Math.max(POPUP_MIN_WIDTH, maxRight - minLeft);
    const popupWidth = Math.min(POPUP_WIDTH, availableWidth);
    const spaceRight = maxRight - triggerRect.left;
    const spaceLeft = triggerRect.right - minLeft;
    const canOpenRight = spaceRight >= popupWidth;
    const canOpenLeft = spaceLeft >= popupWidth;
    let left = triggerRect.left;

    if (!canOpenRight && canOpenLeft) {
      left = triggerRect.right - popupWidth;
    } else if (!canOpenRight && !canOpenLeft) {
      left = minLeft + (availableWidth - popupWidth) / 2;
    }

    left = Math.min(maxRight - popupWidth, Math.max(minLeft, left));
    const spaceDown = maxBottom - triggerRect.bottom - POPUP_GAP;
    const spaceUp = triggerRect.top - minTop - POPUP_GAP;
    const openUpBySpace = spaceDown < POPUP_MIN_HEIGHT && spaceUp > spaceDown;
    const shouldOpenUp = forceOpenUp ? spaceUp > 0 : openUpBySpace;
    const sideSpace = shouldOpenUp ? spaceUp : spaceDown;
    const oppositeSideSpace = shouldOpenUp ? spaceDown : spaceUp;
    const popupMaxHeight = Math.min(POPUP_MAX_HEIGHT, Math.max(POPUP_MIN_HEIGHT, Math.max(0, sideSpace)));
    let top = shouldOpenUp ? triggerRect.top - POPUP_GAP - popupMaxHeight : triggerRect.bottom + POPUP_GAP;

    if (shouldOpenUp && top < minTop && oppositeSideSpace > sideSpace) {
      const fallbackHeight = Math.min(POPUP_MAX_HEIGHT, Math.max(POPUP_MIN_HEIGHT, Math.max(0, oppositeSideSpace)));
      top = triggerRect.bottom + POPUP_GAP;
      top = Math.min(maxBottom - fallbackHeight, Math.max(minTop, top));

      setPopupStyle({
        top: `${top + window.scrollY}px`,
        left: `${left + window.scrollX}px`,
        width: `${popupWidth}px`,
        maxHeight: `${fallbackHeight}px`,
      });

      return;
    }

    top = Math.min(maxBottom - popupMaxHeight, Math.max(minTop, top));

    setPopupStyle({
      top: `${top + window.scrollY}px`,
      left: `${left + window.scrollX}px`,
      width: `${popupWidth}px`,
      maxHeight: `${popupMaxHeight}px`,
    });
  }, [boundarySelector, forceOpenUp]);

  const handleOpenPopup = (event) => {
    triggerRef.current = event.currentTarget;

    setIsOpen((previousState) => {
      const nextState = !previousState;

      if (nextState) {
        window.requestAnimationFrame(() => {
          recalculatePopupPosition();
        });
      }

      return nextState;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      recalculatePopupPosition();
    });

    const handleOutsideClick = (event) => {
      const isInsidePopup = popupRef.current?.contains(event.target);
      const isTrigger = triggerRef.current?.contains(event.target);

      if (!isInsidePopup && !isTrigger) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', recalculatePopupPosition);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', recalculatePopupPosition);
    };
  }, [isOpen, recalculatePopupPosition, selected]);

  return (
    <div className={projectSkillsSelectorStyles.root} ref={rootRef}>
      <div className={projectSkillsSelectorStyles.head}>
        <h3 className={titleClassName}>{title}</h3>
        {withClear && (
          <button
            className={projectSkillsSelectorStyles.clear}
            type="button"
            onClick={clearAll}
            disabled={disabled || selected.length === 0}
          >
            Очистить все
          </button>
        )}
      </div>

      <div className={projectSkillsSelectorStyles.list}>
        {selected.length === 0 && <span className={projectSkillsSelectorStyles.isEmpty}>{emptyLabel}</span>}

        {selected.map((skillName) => (
          <button
            className={projectSkillsSelectorStyles.tag}
            type="button"
            key={skillName}
            onClick={() => toggleSkill(skillName)}
            disabled={disabled}
          >
            {skillName}
          </button>
        ))}

        <div className={projectSkillsSelectorStyles.popupWrap}>
          <button
            ref={triggerRef}
            className={projectSkillsSelectorStyles.add}
            type="button"
            onClick={handleOpenPopup}
            data-skills-add="true"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls="project-stack-options"
            disabled={disabled}
          >
            +
          </button>

          {isOpen &&
            createPortal(
              <div
                ref={popupRef}
                id="project-stack-options"
                className={[projectSkillsSelectorStyles.popup, projectSkillsSelectorStyles.isPortal].join(' ')}
                role="dialog"
                aria-label="Выбор стека"
                data-skills-popup="true"
                style={popupStyle}
              >
                {orderedOptions.map((skillName) => {
                  const isChecked = selected.includes(skillName);

                  return (
                    <label className={projectSkillsSelectorStyles.option} key={skillName}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSkill(skillName)}
                        disabled={disabled}
                      />
                      <span>{skillName}</span>
                    </label>
                  );
                })}
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSkillsSelector;
