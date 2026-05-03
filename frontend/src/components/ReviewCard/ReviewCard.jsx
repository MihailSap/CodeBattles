import { CheckIcon, CommentIcon } from '../Icons/Icons';
import { REVIEW_STATUS, REVIEW_STATUS_LABEL } from '../../constants/review';
import './ReviewCard.css';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

const getStatusClassName = (status) => {
  if (status === REVIEW_STATUS.IN_PROGRESS) {
    return 'review-card__status--in-progress';
  }

  if (status === REVIEW_STATUS.COMPLETED) {
    return 'review-card__status--completed';
  }

  return 'review-card__status--new';
};

const getDeadlineMeta = (review) => {
  const deadlineTime = new Date(review.responseDeadline).getTime();
  const reviewedTime = review.reviewedAt ? new Date(review.reviewedAt).getTime() : null;

  if (review.checkedByReviewer && reviewedTime && reviewedTime <= deadlineTime) {
    return { text: 'Проверено вовремя', className: 'review-card__deadline-value--success' };
  }

  if (review.checkedByReviewer && reviewedTime && reviewedTime > deadlineTime) {
    return { text: 'Просрочено', className: 'review-card__deadline-value--error' };
  }

  const nowTime = Date.now();

  if (nowTime > deadlineTime) {
    return { text: 'Просрочено', className: 'review-card__deadline-value--error' };
  }

  const daysLeft = Math.max(1, Math.ceil((deadlineTime - nowTime) / (24 * 60 * 60 * 1000)));
  const suffix = daysLeft % 10 === 1 && daysLeft % 100 !== 11 ? 'день' : daysLeft % 10 >= 2 && daysLeft % 10 <= 4 && (daysLeft % 100 < 12 || daysLeft % 100 > 14) ? 'дня' : 'дней';

  return {
    text: `${daysLeft} ${suffix}`,
    className: 'review-card__deadline-value--warning'
  };
};

const ReviewCard = ({ review }) => {
  const authorLogin = review.status === REVIEW_STATUS.COMPLETED && review.revealAuthorAfterReview ? `@${review.author.login}` : 'Анонимно';
  const deadlineMeta = getDeadlineMeta(review);

  return (
    <button className="review-card" type="button">
      <div className="review-card__top">
        <div className="review-card__title-wrap">
          <h3 className="review-card__title">{review.taskName}</h3>
          {review.checkedByReviewer && (
            <span className="review-card__checked-icon">
              <CheckIcon />
            </span>
          )}
        </div>

        <div className="review-card__meta-right">
          {review.status !== REVIEW_STATUS.NEW && (
            <span className="review-card__comments">
              <span className="review-card__comments-count">{review.commentsCount}</span>
              <span className="review-card__comments-icon">
                <CommentIcon />
              </span>
            </span>
          )}
          <span className={`review-card__status ${getStatusClassName(review.status)}`}>{REVIEW_STATUS_LABEL[review.status]}</span>
        </div>
      </div>

      <div className="review-card__bottom">
        <p className="review-card__meta-line">
          <span className="review-card__label">Автор:</span>
          <span className="review-card__value">{authorLogin}</span>
        </p>
        <p className="review-card__meta-line">
          <span className="review-card__label">Загружено:</span>
          <span className="review-card__value">{formatDate(review.uploadedAt)}</span>
        </p>
        <p className="review-card__meta-line">
          <span className="review-card__label">Срок проверки:</span>
          <span className="review-card__value">
            <span className={deadlineMeta.className}>{formatDate(review.responseDeadline)} ({deadlineMeta.text})</span>
          </span>
        </p>
      </div>
    </button>
  );
};

export default ReviewCard;
