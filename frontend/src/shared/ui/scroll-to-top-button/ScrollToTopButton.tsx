import { useState, useEffect } from 'react';
import { UnwrapIcon } from '@/shared/ui/icons';
import scrollToTopButtonStyles from './ScrollToTopButton.module.scss';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 520);
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    isVisible && (
      <button onClick={scrollToTop} className={scrollToTopButtonStyles.root}>
        <UnwrapIcon />
      </button>
    )
  );
};

export default ScrollToTopButton;
