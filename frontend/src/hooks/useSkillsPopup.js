import { useCallback, useEffect, useRef, useState } from 'react';

export const useSkillsPopup = () => {
  const popupAnchorRef = useRef(null);
  const [openedSkillsPopup, setOpenedSkillsPopup] = useState(null);
  const [popupDirection, setPopupDirection] = useState('down');
  const [popupMaxHeight, setPopupMaxHeight] = useState(240);
  const [mobilePopupPosition, setMobilePopupPosition] = useState(null);

  const closeSkillsPopup = useCallback(() => {
    setOpenedSkillsPopup(null);
    setMobilePopupPosition(null);
    popupAnchorRef.current = null;
  }, []);

  const recalculateMobilePopupPosition = useCallback(() => {
    const anchor = popupAnchorRef.current;

    if (!anchor || window.innerWidth > 760) {
      return;
    }

    const triggerRect = anchor.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredHeight = 240;
    const popupWidth = Math.min(250, window.innerWidth - viewportPadding * 2);
    const desiredTop = triggerRect.bottom + 8;
    const top = Math.min(desiredTop, window.innerHeight - viewportPadding - 80);
    const left = Math.min(
      window.innerWidth - popupWidth - viewportPadding,
      Math.max(viewportPadding, triggerRect.left)
    );
    const spaceDown = window.innerHeight - top - viewportPadding;
    const maxHeight = Math.max(80, Math.min(preferredHeight, spaceDown));

    setPopupDirection('down');
    setPopupMaxHeight(maxHeight);
    setMobilePopupPosition({ top, left, width: popupWidth });
  }, []);

  const openSkillsPopup = useCallback((groupKey, event) => {
    popupAnchorRef.current = event.currentTarget;
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredHeight = 240;
    const isMobileViewport = window.innerWidth <= 760;

    if (isMobileViewport) {
      const popupWidth = Math.min(250, window.innerWidth - viewportPadding * 2);
      const desiredTop = triggerRect.bottom + 8;
      const top = Math.min(desiredTop, window.innerHeight - viewportPadding - 80);
      const left = Math.min(
        window.innerWidth - popupWidth - viewportPadding,
        Math.max(viewportPadding, triggerRect.left)
      );
      const spaceDown = window.innerHeight - top - viewportPadding;
      const maxHeight = Math.max(80, Math.min(preferredHeight, spaceDown));

      setPopupDirection('down');
      setPopupMaxHeight(maxHeight);
      setMobilePopupPosition({ top, left, width: popupWidth });
    } else {
      const spaceDown = window.innerHeight - triggerRect.bottom - viewportPadding;
      const spaceUp = triggerRect.top - viewportPadding;
      const shouldOpenUp = spaceDown < 180 && spaceUp > spaceDown;
      const maxHeight = Math.max(120, Math.min(preferredHeight, shouldOpenUp ? spaceUp - 8 : spaceDown - 8));

      setPopupDirection(shouldOpenUp ? 'up' : 'down');
      setPopupMaxHeight(maxHeight);
      setMobilePopupPosition(null);
    }

    setOpenedSkillsPopup((previousState) => {
      if (previousState === groupKey) {
        popupAnchorRef.current = null;
        setMobilePopupPosition(null);
        return null;
      }

      return groupKey;
    });
  }, []);

  useEffect(() => {
    if (!openedSkillsPopup) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (event.target.closest('[data-skills-popup="true"]') || event.target.closest('[data-skills-add="true"]')) {
        return;
      }

      closeSkillsPopup();
    };

    const handleEscape = (event) => {
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
    if (!openedSkillsPopup || !mobilePopupPosition) {
      return undefined;
    }

    const handleViewportChange = () => {
      recalculateMobilePopupPosition();
    };

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [mobilePopupPosition, openedSkillsPopup, recalculateMobilePopupPosition]);

  return {
    openedSkillsPopup,
    popupDirection,
    popupMaxHeight,
    mobilePopupPosition,
    closeSkillsPopup,
    openSkillsPopup
  };
};
