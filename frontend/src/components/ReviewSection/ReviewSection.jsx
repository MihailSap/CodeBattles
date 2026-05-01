import { useMemo, useRef, useState } from 'react';
import { UnwrapIcon } from '../Icons/Icons';
import './ReviewSection.css';

const ReviewSection = ({ title, reviewsCount, children, defaultOpen = true, nested = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? 'none' : '0px');
  const contentRef = useRef(null);

  const sectionClassName = useMemo(
    () => `review-section ${nested ? 'review-section--nested' : ''}`,
    [nested]
  );

  const handleToggle = () => {
    const contentNode = contentRef.current;

    if (!contentNode) {
      setIsOpen((prevState) => !prevState);
      return;
    }

    if (isOpen) {
      setMaxHeight(`${contentNode.scrollHeight}px`);
      window.requestAnimationFrame(() => {
        setIsOpen(false);
        setMaxHeight('0px');
      });
      return;
    }

    setIsOpen(true);
    setMaxHeight(`${contentNode.scrollHeight}px`);
  };

  return (
    <section className={sectionClassName}>
      <button
        className={`review-section__header ${isOpen ? '' : 'review-section__header--collapsed'}`}
        type="button"
        onClick={handleToggle}
      >
        <span className={`review-section__arrow ${isOpen ? 'review-section__arrow--open' : ''}`}>
          <UnwrapIcon />
        </span>
        <span className="review-section__title">{title}</span>
        <span className="review-section__tag">{reviewsCount}</span>
      </button>

      <div
        className={`review-section__body ${isOpen ? 'review-section__body--open' : ''}`}
        style={{ maxHeight }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== 'max-height') {
            return;
          }

          if (isOpen) {
            setMaxHeight('none');
          }
        }}
      >
        <div className="review-section__content" ref={contentRef}>{children}</div>
      </div>
    </section>
  );
};

export default ReviewSection;
