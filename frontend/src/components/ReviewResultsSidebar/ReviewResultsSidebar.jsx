import React, { useState } from 'react';
import { StarIcon } from '../Icons/Icons';
import ReviewDropdown from '../ReviewDropdown/ReviewDropdown';
import './ReviewResultsSidebar.css';

const StarRating = ({ value, max = 5 }) => {
  const roundedValue = Math.round(value);
  return (
    <div className="star-rating">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="star-rating__star">
          <StarIcon filled={i < roundedValue} />
        </span>
      ))}
    </div>
  );
};

const ReviewResultsSidebar = ({ review, aiReviewEnabled }) => {
  const [selectedReviewerId, setSelectedReviewerId] = useState(
    review.finalReviews && review.finalReviews.length > 0
      ? review.finalReviews[0].reviewerId
      : null
  );

  if (!review) return null;

  const averageScore = review.finalReviews && review.finalReviews.length > 0
    ? review.finalReviews.reduce((acc, fr) => acc + (fr.architecture + fr.readability + fr.testability + fr.scalability) / 4, 0) / review.finalReviews.length
    : 0;

  const reviewerOptions = (review.finalReviews || []).map((fr, idx) => ({
    value: fr.reviewerId,
    label: fr.revealName ? fr.reviewerName : `Ревьюер ${idx + 1}`
  }));

  const selectedReviewData = (review.finalReviews || []).find(fr => fr.reviewerId === selectedReviewerId);

  const hasFinalReviews = review.finalReviews && review.finalReviews.length > 0;

  return (
    <div className="review-results-sidebar">
      {hasFinalReviews && (
        <div className="review-results-sidebar__block">
          <h3 className="review-results-sidebar__title">Итоговая оценка от ревьюеров</h3>
          <div className="review-results-sidebar__content review-results-sidebar__content--center">
            <StarRating value={averageScore} />
          </div>
        </div>
      )}

      {reviewerOptions.length > 0 && selectedReviewData && (
        <div className="review-results-sidebar__block">
          <h3 className="review-results-sidebar__title">Детальная оценка от ревьюеров</h3>
          <div className="review-results-sidebar__content">
            <div className="review-results-sidebar__dropdown-wrap">
              <ReviewDropdown
                label="Ревьюер:"
                options={reviewerOptions}
                value={selectedReviewerId}
                onChange={setSelectedReviewerId}
              />
            </div>

            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Оценка архитектуры:</div>
              <StarRating value={selectedReviewData.architecture} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Оценка читаемости:</div>
              <StarRating value={selectedReviewData.readability} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Оценка тестируемости:</div>
              <StarRating value={selectedReviewData.testability} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Оценка масштабируемости:</div>
              <StarRating value={selectedReviewData.scalability} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Общие замечания:</div>
              <div className="review-results-sidebar__text">{selectedReviewData.comment}</div>
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Вердикт:</div>
              <div className={`review-results-sidebar__verdict ${selectedReviewData.verdict === 'APPROVED' ? 'approved' : 'rework'}`}>
                {selectedReviewData.verdict === 'APPROVED' ? 'Одобрено' : 'На доработку'}
              </div>
            </div>
          </div>
        </div>
      )}

      {aiReviewEnabled && (hasFinalReviews || review.aiEvaluation) && (
        <div className="review-results-sidebar__block">
          <h3 className="review-results-sidebar__title">Оценка решения от AI</h3>
          <div className="review-results-sidebar__content">
            {review.aiEvaluation ? (
              <>
                <div className="review-results-sidebar__field">
                  <div className="review-results-sidebar__label">Общая оценка качества решения:</div>
                  <StarRating value={review.aiEvaluation.qualityScore} />
                </div>
                <div className="review-results-sidebar__field">
                  <div className="review-results-sidebar__label">Цикломатическая сложность:</div>
                  <div className="review-results-sidebar__text-bold">{review.aiEvaluation.cyclomaticComplexity}</div>
                </div>
                <div className="review-results-sidebar__field review-results-sidebar__field--compact">
                  <div className="review-results-sidebar__label">Нарушения SOLID:</div>
                  <div className="review-results-sidebar__sub-field">
                    <span className="review-results-sidebar__label-small">Количество:</span>
                    <span className="review-results-sidebar__text-bold">{review.aiEvaluation.solidViolations?.count || 0}</span>
                  </div>
                  {review.aiEvaluation.solidViolations && (
                    <div className="review-results-sidebar__sub-field">
                      <span className="review-results-sidebar__label-small">Критичность:</span>
                      <div className={`review-results-sidebar__severity severity-${review.aiEvaluation.solidViolations.severity === 'Проблем нет' ? 'none' : review.aiEvaluation.solidViolations.severity === 'Не критично' ? 'low' : review.aiEvaluation.solidViolations.severity === 'Средняя' ? 'medium' : 'high'}`}>
                        {review.aiEvaluation.solidViolations.severity}
                      </div>
                    </div>
                  )}
                </div>
                {review.aiEvaluation.overallComment && (
                  <div className="review-results-sidebar__field">
                    <div className="review-results-sidebar__label">Общие замечания:</div>
                    <div className="review-results-sidebar__text">{review.aiEvaluation.overallComment}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="review-results-sidebar__text">Недостаточно данных для оценки</div>
            )}
          </div>
        </div>
      )}

      {aiReviewEnabled && review.aiReviewEvaluation && (
        <div className="review-results-sidebar__block">
          <h3 className="review-results-sidebar__title">Оценка ревью от AI</h3>
          <div className="review-results-sidebar__content">
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Общая оценка качества:</div>
              <StarRating value={review.aiReviewEvaluation.qualityScore} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Конкретность:</div>
              <StarRating value={review.aiReviewEvaluation.specificity} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Техническая глубина:</div>
              <StarRating value={review.aiReviewEvaluation.techDepth} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Корректность:</div>
              <StarRating value={review.aiReviewEvaluation.correctness} />
            </div>
            <div className="review-results-sidebar__field">
              <div className="review-results-sidebar__label">Отсутствие токсичности:</div>
              <StarRating value={review.aiReviewEvaluation.nonToxicity} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewResultsSidebar;
