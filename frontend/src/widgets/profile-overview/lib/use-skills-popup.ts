import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { ProfileSkills } from '@/entities/profile';
import profileOverviewLayoutStyles from '../ui/ProfileOverviewLayout.module.scss';

const VIEWPORT_PADDING = 12;
const POPUP_MAX_HEIGHT = 240;
const POPUP_MAX_WIDTH = 320;
const POPUP_MIN_WIDTH = 180;
const POPUP_GAP = 8;

export type SkillGroupKey = keyof ProfileSkills;

export interface SkillsPopupPosition {
  top: number;
  left: number;
  width: number;
}

export const useSkillsPopup = () => {
  const popupAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [openedSkillsPopup, setOpenedSkillsPopup] = useState<SkillGroupKey | null>(null);
  const [popupDirection, setPopupDirection] = useState<'down' | 'up'>('down');
  const [popupMaxHeight, setPopupMaxHeight] = useState(240);
  const [mobilePopupPosition, setMobilePopupPosition] = useState<SkillsPopupPosition | null>(null);
  const [popupHorizontalAlign, setPopupHorizontalAlign] = useState<'left' | 'right' | 'center'>('left');

  const closeSkillsPopup = useCallback(() => {
    setOpenedSkillsPopup(null);
    setMobilePopupPosition(null);
    popupAnchorRef.current = null;
  }, []);

  const recalculatePopupPosition = useCallback(() => {
    const anchor = popupAnchorRef.current;

    if (!anchor) {
      return;
    }

    const triggerRect = anchor.getBoundingClientRect();

    const boundsElement = anchor.closest(`.${profileOverviewLayoutStyles.sectionBody}`) || anchor.closest('form');

    const boundsRect = boundsElement?.getBoundingClientRect();
    const minLeft = boundsRect ? Math.max(VIEWPORT_PADDING, boundsRect.left + VIEWPORT_PADDING) : VIEWPORT_PADDING;

    const maxRight = boundsRect
      ? Math.min(window.innerWidth - VIEWPORT_PADDING, boundsRect.right - VIEWPORT_PADDING)
      : window.innerWidth - VIEWPORT_PADDING;

    const minTop = VIEWPORT_PADDING;
    const maxBottom = window.innerHeight - VIEWPORT_PADDING;
    const availableWidth = Math.max(POPUP_MIN_WIDTH, maxRight - minLeft);
    const popupWidth = Math.min(POPUP_MAX_WIDTH, availableWidth);
    const spaceRight = maxRight - triggerRect.left;
    const spaceLeft = triggerRect.right - minLeft;
    const canOpenToRight = spaceRight >= popupWidth;
    const canOpenToLeft = spaceLeft >= popupWidth;
    let left = triggerRect.left;
    let horizontalAlign: 'left' | 'right' | 'center' = 'left';

    if (!canOpenToRight && canOpenToLeft) {
      left = triggerRect.right - popupWidth;
      horizontalAlign = 'right';
    } else if (!canOpenToRight && !canOpenToLeft) {
      left = minLeft + (availableWidth - popupWidth) / 2;
      horizontalAlign = 'center';
    }

    left = Math.min(maxRight - popupWidth, Math.max(minLeft, left));
    const spaceDown = maxBottom - triggerRect.bottom - POPUP_GAP;
    const spaceUp = triggerRect.top - minTop - POPUP_GAP;
    const shouldOpenUp = spaceDown < 160 && spaceUp > spaceDown;
    const availableHeight = shouldOpenUp ? spaceUp : spaceDown;
    const maxHeight = Math.max(80, Math.min(POPUP_MAX_HEIGHT, availableHeight));

    const top = shouldOpenUp
      ? Math.max(minTop, triggerRect.top - POPUP_GAP - maxHeight)
      : Math.min(maxBottom - maxHeight, triggerRect.bottom + POPUP_GAP);

    setPopupDirection(shouldOpenUp ? 'up' : 'down');
    setPopupHorizontalAlign(horizontalAlign);
    setPopupMaxHeight(maxHeight);

    setMobilePopupPosition({
      top: top + window.scrollY,
      left: left + window.scrollX,
      width: popupWidth,
    });
  }, []);

  const openSkillsPopup = useCallback(
    (groupKey: SkillGroupKey, event: ReactMouseEvent<HTMLButtonElement>) => {
      popupAnchorRef.current = event.currentTarget;

      setOpenedSkillsPopup((previousState) => {
        if (previousState === groupKey) {
          popupAnchorRef.current = null;
          setMobilePopupPosition(null);

          return null;
        }

        window.requestAnimationFrame(() => {
          recalculatePopupPosition();
        });

        return groupKey;
      });
    },
    [recalculatePopupPosition]
  );

  useEffect(() => {
    if (!openedSkillsPopup) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        (event.target.closest('[data-skills-popup="true"]') || event.target.closest('[data-skills-add="true"]'))
      ) {
        return;
      }

      closeSkillsPopup();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSkillsPopup();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeSkillsPopup, openedSkillsPopup]);

  useEffect(() => {
    if (!openedSkillsPopup) {
      return undefined;
    }

    const handleViewportChange = () => {
      recalculatePopupPosition();
    };

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [openedSkillsPopup, recalculatePopupPosition]);

  return {
    openedSkillsPopup,
    popupDirection,
    popupHorizontalAlign,
    popupMaxHeight,
    mobilePopupPosition,
    closeSkillsPopup,
    openSkillsPopup,
  };
};
