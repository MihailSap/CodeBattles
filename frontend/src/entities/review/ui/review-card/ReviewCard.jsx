import { memo, useCallback, useMemo } from 'react';
import { CheckIcon, CommentIcon } from '@/shared/ui/icons';
import { REVIEW_STATUS, REVIEW_STATUS_LABEL } from '../../model';
import reviewCardStyles from './ReviewCard.module.scss';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const getStatusClassName = (status) => {
  if (status === REVIEW_STATUS.IN_PROGRESS) {
    return reviewCardStyles.isInProgress;
  }

  if (status === REVIEW_STATUS.COMPLETED) {
    return reviewCardStyles.isCompleted;
  }

  return reviewCardStyles.isNew;
};

const getDeadlineMeta = (review) => {
  const deadlineTime = new Date(review.responseDeadline).getTime();
  const reviewedTime = review.reviewedAt ? new Date(review.reviewedAt).getTime() : null;

  if (review.checkedByReviewer && reviewedTime && reviewedTime <= deadlineTime) {
    return {
      text: 'Проверено вовремя',
      className: reviewCardStyles.isSuccess,
    };
  }

  if (review.checkedByReviewer && reviewedTime && reviewedTime > deadlineTime) {
    return {
      text: 'Просрочено',
      className: reviewCardStyles.isError,
    };
  }

  const nowTime = Date.now();

  if (nowTime > deadlineTime) {
    return {
      text: 'Просрочено',
      className: reviewCardStyles.isError,
    };
  }

  const daysLeft = Math.max(1, Math.ceil((deadlineTime - nowTime) / (24 * 60 * 60 * 1000)));

  const suffix =
    daysLeft % 10 === 1 && daysLeft % 100 !== 11
      ? 'день'
      : daysLeft % 10 >= 2 && daysLeft % 10 <= 4 && (daysLeft % 100 < 12 || daysLeft % 100 > 14)
        ? 'дня'
        : 'дней';

  return {
    text: `${daysLeft} ${suffix}`,
    className: reviewCardStyles.isWarning,
  };
};

const ReviewCard = ({ review, onClick, onOpen }) => {
  const deadlineMeta = useMemo(() => getDeadlineMeta(review), [review]);

  const handleClick = useCallback(() => {
    if (onOpen) {
      onOpen(review.id);

      return;
    }

    onClick?.();
  }, [onClick, onOpen, review.id]);

  return (
    <button className={reviewCardStyles.root} type="button" onClick={handleClick}>
      <div className={reviewCardStyles.top}>
        <div className={reviewCardStyles.titleWrap}>
          <h3 className={reviewCardStyles.title}>{review.taskName}</h3>
          {review.checkedByReviewer && deadlineMeta.text === 'Проверено вовремя' && (
            <span className={reviewCardStyles.checkedIcon}>
              <CheckIcon />
            </span>
          )}
        </div>

        <div className={reviewCardStyles.metaRight}>
          {review.status !== REVIEW_STATUS.NEW && (
            <span className={reviewCardStyles.comments}>
              <span className={reviewCardStyles.commentsCount}>{review.commentsCount}</span>
              <span className={reviewCardStyles.commentsIcon}>
                <CommentIcon />
              </span>
            </span>
          )}
          <span className={[reviewCardStyles.status, getStatusClassName(review.status)].filter(Boolean).join(' ')}>
            {REVIEW_STATUS_LABEL[review.status]}
          </span>
        </div>
      </div>

      <div className={reviewCardStyles.bottom}>
        <p className={reviewCardStyles.metaLine}>
          <span className={reviewCardStyles.label}>Загружено:</span>
          <span className={reviewCardStyles.value}>{formatDate(review.uploadedAt)}</span>
        </p>
        <p className={reviewCardStyles.metaLine}>
          <span className={reviewCardStyles.label}>Срок проверки:</span>
          <span className={reviewCardStyles.value}>
            <span className={deadlineMeta.className}>
              {formatDate(review.responseDeadline)} ({deadlineMeta.text})
            </span>
          </span>
        </p>
      </div>
    </button>
  );
};

export default memo(ReviewCard);
