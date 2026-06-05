import { useState } from 'react';
import type { ReviewDetail } from '@/entities/review';
import type { EntityId } from '@/entities/project';
import { StarIcon } from '@/shared/ui/icons';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import reviewResultsSidebarStyles from './ReviewResultsSidebar.module.scss';

type ReviewOptionValue = string | number;

const AI_EVALUATION_STATUS = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

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
  const getReviewOptionValue = (finalReview: ReviewDetail['finalReviews'][number]): ReviewOptionValue =>
    finalReview.reviewerId ?? `review-${String(finalReview.id)}`;

  const [selectedReviewOptionValue, setSelectedReviewOptionValue] = useState<ReviewOptionValue | null>(
    review.finalReviews[0] ? getReviewOptionValue(review.finalReviews[0]) : null
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
      finalReview.reviewerId !== null &&
      finalReview.reviewerId !== undefined &&
      Number(finalReview.reviewerId) === Number(currentReviewerId);

    return {
      value: getReviewOptionValue(finalReview),
      label: isCurrentReviewer
        ? 'Вы'
        : finalReview.reviewerId === null || finalReview.reviewerId === undefined
          ? finalReview.reviewerName || 'AI'
        : canRevealReviewerNames && finalReview.revealName
          ? finalReview.reviewerName
          : `Ревьюер ${index + 1}`,
    };
  });

  const hasFinalReviews = review.finalReviews && review.finalReviews.length > 0;
  const isAiOnlyReview = review.reviewType === 'AI_ONLY';

  const selectedReviewerExists = review.finalReviews.some(
    (finalReview) => getReviewOptionValue(finalReview) === selectedReviewOptionValue
  );

  const effectiveSelectedReviewOptionValue = selectedReviewerExists
    ? selectedReviewOptionValue
    : (review.finalReviews[0] ? getReviewOptionValue(review.finalReviews[0]) : null);

  const selectedReviewData = review.finalReviews.find(
    (finalReview) => getReviewOptionValue(finalReview) === effectiveSelectedReviewOptionValue
  );

  const showAiSolutionBlock = showAiSolutionEvaluation && aiReviewEnabled && Boolean(review.aiEvaluation);

  const showAiReviewEvaluation = aiReviewEnabled && review.reviewType !== 'AI_ONLY' && Boolean(review.aiReviewEvaluation);
  const aiSolutionFailed = review.aiEvaluation?.status === AI_EVALUATION_STATUS.FAILED;
  const aiReviewFailed = review.aiReviewEvaluation?.status === AI_EVALUATION_STATUS.FAILED;

  const getAiErrorText = (message?: string | null): string => {
    const normalizedMessage = message?.trim();

    if (!normalizedMessage) {
      return 'Недостаточно данных для оценки';
    }

    if (normalizedMessage.includes('OpenRouter returned an empty response')) {
      return 'OpenRouter не вернул вариантов ответа. Провайдер мог временно не сгенерировать оценку.';
    }

    if (normalizedMessage.includes('OpenRouter returned an empty message')) {
      return 'OpenRouter вернул пустое сообщение. Попробуйте повторить проверку позже.';
    }

    if (normalizedMessage.includes('AI response does not contain a JSON object')) {
      return 'Ответ AI не содержит корректный JSON. Попробуйте повторить проверку позже.';
    }

    if (normalizedMessage.includes('429 Too Many Requests')) {
      return 'OpenRouter временно ограничил количество запросов. Попробуйте позже или выберите другую модель.';
    }

    return 'AI не смогла сформировать оценку. Попробуйте повторить проверку позже.';
  };

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

      {!isAiOnlyReview && reviewerOptions.length > 0 && selectedReviewData && effectiveSelectedReviewOptionValue !== null && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Детальная оценка от ревьюеров</h3>
          <div className={reviewResultsSidebarStyles.content}>
            <div className={reviewResultsSidebarStyles.dropdownWrap}>
              <ReviewDropdown
                label="Ревьюер:"
                options={reviewerOptions}
                value={effectiveSelectedReviewOptionValue}
                onChange={setSelectedReviewOptionValue}
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

      {showAiSolutionBlock && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Оценка решения от AI</h3>
          <div className={reviewResultsSidebarStyles.content}>
            {aiSolutionFailed ? (
              <div className={reviewResultsSidebarStyles.text}>{getAiErrorText(review.aiEvaluation?.errorMessage)}</div>
            ) : (
              <>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Общая оценка качества решения:</div>
                  <StarRating value={review.aiEvaluation?.qualityScore ?? 0} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Цикломатическая сложность:</div>
                  <div className={reviewResultsSidebarStyles.textBold}>{review.aiEvaluation?.cyclomaticComplexity}</div>
                </div>
                <div className={[reviewResultsSidebarStyles.field, reviewResultsSidebarStyles.isCompact].join(' ')}>
                  <div className={reviewResultsSidebarStyles.label}>Нарушения SOLID:</div>
                  <div className={reviewResultsSidebarStyles.subField}>
                    <span className={reviewResultsSidebarStyles.labelSmall}>Количество:</span>
                    <span className={reviewResultsSidebarStyles.textBold}>
                      {review.aiEvaluation?.solidViolations?.count || 0}
                    </span>
                  </div>
                  {review.aiEvaluation?.solidViolations && (
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
                {review.aiEvaluation?.overallComment && (
                  <div className={reviewResultsSidebarStyles.field}>
                    <div className={reviewResultsSidebarStyles.label}>Общие замечания:</div>
                    <div className={reviewResultsSidebarStyles.text}>{review.aiEvaluation.overallComment}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showAiReviewEvaluation && (
        <div className={reviewResultsSidebarStyles.block}>
          <h3 className={reviewResultsSidebarStyles.title}>Оценка ревью от AI</h3>
          <div className={reviewResultsSidebarStyles.content}>
            {aiReviewFailed ? (
              <div className={reviewResultsSidebarStyles.text}>
                {getAiErrorText(review.aiReviewEvaluation?.errorMessage)}
              </div>
            ) : (
              <>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Общая оценка качества:</div>
                  <StarRating value={review.aiReviewEvaluation?.qualityScore ?? 0} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Конкретность:</div>
                  <StarRating value={review.aiReviewEvaluation?.specificity ?? 0} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Техническая глубина:</div>
                  <StarRating value={review.aiReviewEvaluation?.techDepth ?? 0} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Корректность:</div>
                  <StarRating value={review.aiReviewEvaluation?.correctness ?? 0} />
                </div>
                <div className={reviewResultsSidebarStyles.field}>
                  <div className={reviewResultsSidebarStyles.label}>Отсутствие токсичности:</div>
                  <StarRating value={review.aiReviewEvaluation?.nonToxicity ?? 0} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewResultsSidebar;
