import { useState } from 'react';
import type { ReviewDetail } from '@/entities/review';
import type { EntityId } from '@/entities/project';
import { StarIcon } from '@/shared/ui/icons';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import reviewResultsSidebarStyles from './ReviewResultsSidebar.module.scss';

interface StarRatingProps {
  value: number;
  max?: number;
}

const StarRating = ({ value, max = 5 }: StarRatingProps) => {
  const roundedValue = Math.round(value);

  return (
    <div className={reviewResultsSidebarStyles.starRating}>
      {Array.from({
        length: max,
      }).map((_, index) => {
        const ratingValue = index + 1;

        return (
          <span key={ratingValue} className={reviewResultsSidebarStyles.star}>
            <StarIcon filled={ratingValue <= roundedValue} />
          </span>
        );
      })}
    </div>
  );
};

interface ReviewResultsSidebarProps {
  review: ReviewDetail;
  aiReviewEnabled: boolean;
  canRevealReviewerNames?: boolean;
  currentReviewerId?: EntityId | null;
  showReviewerSummary?: boolean;
  showAiSolutionEvaluation?: boolean;
}

const ReviewResultsSidebar = ({
  review,
  aiReviewEnabled,
  canRevealReviewerNames = true,
  currentReviewerId = null,
  showReviewerSummary = true,
  showAiSolutionEvaluation = true,
}: ReviewResultsSidebarProps) => {
  const [selectedReviewerId, setSelectedReviewerId] = useState<EntityId | null>(
    review.finalReviews[0]?.reviewerId ?? null
  );

  const averageScore =
    review.finalReviews && review.finalReviews.length > 0
      ? review.finalReviews.reduce(
          (total, finalReview) =>
            total +
            (finalReview.architecture + finalReview.readability + finalReview.testability + finalReview.scalability) /
              4,
          0
        ) / review.finalReviews.length
      : 0;

  const reviewerOptions = review.finalReviews.map((finalReview, index) => {
    const isCurrentReviewer =
      currentReviewerId !== null &&
      currentReviewerId !== undefined &&
      Number(finalReview.reviewerId) === Number(currentReviewerId);

    return {
      value: finalReview.reviewerId,
      label: isCurrentReviewer
        ? 'Вы'
        : canRevealReviewerNames && finalReview.revealName
          ? finalReview.reviewerName
          : `Ревьюер ${index + 1}`,
    };
  });

  const hasFinalReviews = review.finalReviews && review.finalReviews.length > 0;

  const selectedReviewerExists = review.finalReviews.some(
    (finalReview) => Number(finalReview.reviewerId) === Number(selectedReviewerId)
  );

  const effectiveSelectedReviewerId = selectedReviewerExists
    ? selectedReviewerId
    : (review.finalReviews[0]?.reviewerId ?? null);

  const selectedReviewData = review.finalReviews.find(
    (finalReview) => Number(finalReview.reviewerId) === Number(effectiveSelectedReviewerId)
  );

  const showAiEvaluations =
    showAiSolutionEvaluation && aiReviewEnabled && (hasFinalReviews || Boolean(review.aiEvaluation));

  return (
    <div className={reviewResultsSidebarStyles.root}>
      {showReviewerSummary && hasFinalReviews && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Итоговая оценка от ревьюеров</h3>
          <div className={[reviewResultsSidebarStyles.content, reviewResultsSidebarStyles.isCenter].join(' ')}>
            <StarRating value={averageScore} />
          </div>
        </div>
      )}

      {reviewerOptions.length > 0 && selectedReviewData && effectiveSelectedReviewerId !== null && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Детальная оценка от ревьюеров</h3>
          <div className={reviewResultsSidebarStyles.content}>
            <div className={reviewResultsSidebarStyles.dropdownWrap}>
              <ReviewDropdown
                label="Ревьюер:"
                options={reviewerOptions}
                value={effectiveSelectedReviewerId}
                onChange={setSelectedReviewerId}
              />
            </div>

            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Оценка архитектуры:</div>
              <StarRating value={selectedReviewData.architecture} />
            </div>
            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Оценка читаемости:</div>
              <StarRating value={selectedReviewData.readability} />
            </div>
            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Оценка тестируемости:</div>
              <StarRating value={selectedReviewData.testability} />
            </div>
            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Оценка масштабируемости:</div>
              <StarRating value={selectedReviewData.scalability} />
            </div>
            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Общие замечания:</div>
              <div className={reviewResultsSidebarStyles.text}>{selectedReviewData.comment}</div>
            </div>
            <div className={reviewResultsSidebarStyles.field}>
              <div className={reviewResultsSidebarStyles.label}>Вердикт:</div>
              <div
                className={[
                  reviewResultsSidebarStyles.verdict,
                  selectedReviewData.verdict === 'APPROVED'
                    ? reviewResultsSidebarStyles.isApproved
                    : reviewResultsSidebarStyles.isRework,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {selectedReviewData.verdict === 'APPROVED' ? 'Одобрено' : 'На доработку'}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAiEvaluations && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Оценка решения от AI</h3>
          <div className={reviewResultsSidebarStyles.content}>
            {review.aiEvaluation ? (
              <>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Общая оценка качества решения:</div>
                  <StarRating value={review.aiEvaluation.qualityScore} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Цикломатическая сложность:</div>
                  <div className={reviewResultsSidebarStyles.textBold}>{review.aiEvaluation.cyclomaticComplexity}</div>
                </div>
                <div className={[reviewResultsSidebarStyles.field, reviewResultsSidebarStyles.isCompact].join(' ')}>
                  <div className={reviewResultsSidebarStyles.label}>Нарушения SOLID:</div>
                  <div className={reviewResultsSidebarStyles.subField}>
                    <span className={reviewResultsSidebarStyles.labelSmall}>Количество:</span>
                    <span className={reviewResultsSidebarStyles.textBold}>
                      {review.aiEvaluation.solidViolations?.count || 0}
                    </span>
                  </div>
                  {review.aiEvaluation.solidViolations && (
                    <div className={reviewResultsSidebarStyles.subField}>
                      <span className={reviewResultsSidebarStyles.labelSmall}>Критичность:</span>
                      <div
                        className={[
                          reviewResultsSidebarStyles.severity,
                          'severity-',
                          review.aiEvaluation.solidViolations.severity === 'Проблем нет'
                            ? 'none'
                            : review.aiEvaluation.solidViolations.severity === 'Не критично'
                              ? 'low'
                              : review.aiEvaluation.solidViolations.severity === 'Средняя'
                                ? 'medium'
                                : 'high',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {review.aiEvaluation.solidViolations.severity}
                      </div>
                    </div>
                  )}
                </div>
                {review.aiEvaluation.overallComment && (
                  <div className={reviewResultsSidebarStyles.field}>
                    <div className={reviewResultsSidebarStyles.label}>Общие замечания:</div>
                    <div className={reviewResultsSidebarStyles.text}>{review.aiEvaluation.overallComment}</div>
                  </div>
                )}
              </>
            ) : (
              <div className={reviewResultsSidebarStyles.text}>Недостаточно данных для оценки</div>
            )}
          </div>
        </div>
      )}

      {showAiEvaluations && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Оценка ревью от AI</h3>
          <div className={reviewResultsSidebarStyles.content}>
            {review.aiReviewEvaluation ? (
              <>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Общая оценка качества:</div>
                  <StarRating value={review.aiReviewEvaluation.qualityScore} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Конкретность:</div>
                  <StarRating value={review.aiReviewEvaluation.specificity} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Техническая глубина:</div>
                  <StarRating value={review.aiReviewEvaluation.techDepth} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Корректность:</div>
                  <StarRating value={review.aiReviewEvaluation.correctness} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Отсутствие токсичности:</div>
                  <StarRating value={review.aiReviewEvaluation.nonToxicity} />
                </div>
              </>
            ) : (
              <div className={reviewResultsSidebarStyles.text}>Недостаточно данных для оценки</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewResultsSidebar;
