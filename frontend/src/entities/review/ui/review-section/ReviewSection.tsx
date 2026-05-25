import { useMemo, useRef, useState, type ReactNode, type TransitionEvent } from 'react';
import { UnwrapIcon } from '@/shared/ui/icons';
import reviewSectionStyles from './ReviewSection.module.scss';

interface ReviewSectionProps {
  title: string;
  reviewsCount: number;
  children: ReactNode;
  defaultOpen?: boolean;
  nested?: boolean;
}

const ReviewSection = ({ title, reviewsCount, children, defaultOpen = true, nested = false }: ReviewSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? 'none' : '0px');
  const contentRef = useRef<HTMLDivElement | null>(null);

  const sectionClassName = useMemo(
    () => [reviewSectionStyles.root, nested ? reviewSectionStyles.isNested : ''].filter(Boolean).join(' '),
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
        className={[reviewSectionStyles.header, isOpen ? '' : reviewSectionStyles.isCollapsed]
          .filter(Boolean)
          .join(' ')}
        type="button"
        onClick={handleToggle}
      >
        <span
          className={[reviewSectionStyles.arrow, isOpen ? reviewSectionStyles.isOpen : ''].filter(Boolean).join(' ')}
        >
          <UnwrapIcon />
        </span>
        <span className={reviewSectionStyles.title}>{title}</span>
        <span className={reviewSectionStyles.tag}>{reviewsCount}</span>
      </button>

      <div
        className={[reviewSectionStyles.body, isOpen ? reviewSectionStyles.isOpen : ''].filter(Boolean).join(' ')}
        style={{
          maxHeight,
        }}
        onTransitionEnd={(event: TransitionEvent<HTMLDivElement>) => {
          if (event.propertyName !== 'max-height') {
            return;
          }

          if (isOpen) {
            setMaxHeight('none');
          }
        }}
      >
        <div className={reviewSectionStyles.content} ref={contentRef}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
