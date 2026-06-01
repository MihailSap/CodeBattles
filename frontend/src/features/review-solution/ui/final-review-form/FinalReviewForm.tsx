import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StarIcon, CheckIcon } from '@/shared/ui/icons';
import type { FinalReview } from '@/entities/review';
import type { EntityId } from '@/entities/project';
import {
  finalReviewFormSchema,
  type FinalReviewFormInput,
  type FinalReviewFormValues,
  type FinalReviewSubmitPayload,
} from '../../model/final-review-schema';
import finalReviewFormStyles from './FinalReviewForm.module.scss';
import reviewResultsSidebarStyles from '../../../../widgets/review-workspace/ui/review-results-sidebar/ReviewResultsSidebar.module.scss';

const STORAGE_KEY_PREFIX = 'codebattles_final_review_';

interface StarSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const StarSelector = ({ value, onChange, disabled = false }: StarSelectorProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className={finalReviewFormStyles.starSelector} onMouseLeave={() => setHoverValue(0)}>
      {Array.from({
        length: 5,
      }).map((_, i) => {
        const ratingValue = i + 1;
        const isFilled = ratingValue <= (hoverValue || value);

        const starColor =
          hoverValue && ratingValue <= hoverValue
            ? 'var(--color-rating-star-hover)'
            : isFilled
              ? 'var(--color-rating-star)'
              : undefined;

        return (
          <button
            key={ratingValue}
            type="button"
            className={finalReviewFormStyles.btn}
            onClick={() => !disabled && onChange(ratingValue)}
            onMouseEnter={() => !disabled && setHoverValue(ratingValue)}
            disabled={disabled}
          >
            <StarIcon filled={isFilled} {...(starColor ? { color: starColor } : {})} />
          </button>
        );
      })}
    </div>
  );
};

const StarDisplay = ({ value }: { value: number }) => {
  const rounded = Math.round(value);

  return (
    <div className={[finalReviewFormStyles.starSelector, finalReviewFormStyles.isReadonly].join(' ')}>
      {Array.from({
        length: 5,
      }).map((_, i) => (
        <span key={i + 1} className={[finalReviewFormStyles.btn, finalReviewFormStyles.btnReadonly].join(' ')}>
          <StarIcon filled={i < rounded} />
        </span>
      ))}
    </div>
  );
};

interface FinalReviewFormProps {
  onSubmit?: (payload: FinalReviewSubmitPayload) => void | Promise<void>;
  isSubmitting: boolean;
  isReadOnly?: boolean;
  taskId: EntityId;
  initialData?: FinalReview | null;
}

const EMPTY_FORM: FinalReviewFormValues = {
  architecture: 0,
  readability: 0,
  testability: 0,
  scalability: 0,
  comment: '',
  verdict: 'APPROVED',
  revealName: false,
};

const FinalReviewForm = ({
  onSubmit,
  isSubmitting,
  isReadOnly = false,
  taskId,
  initialData = null,
}: FinalReviewFormProps) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${taskId || 'default'}`;

  const loadSavedForm = useCallback((): FinalReviewFormValues | null => {
    try {
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const parsed = finalReviewFormSchema.safeParse(JSON.parse(saved));

        return parsed.success ? parsed.data : null;
      }
    } catch (error: unknown) {
      console.warn('Failed to parse saved final review form:', error);
    }

    return null;
  }, [storageKey]);

  const getInitialForm = useCallback((): FinalReviewFormValues => {
    if (initialData) {
      return {
        architecture: initialData.architecture || 0,
        readability: initialData.readability || 0,
        testability: initialData.testability || 0,
        scalability: initialData.scalability || 0,
        comment: initialData.comment || '',
        verdict: initialData.verdict === 'REWORK' ? 'REWORK' : 'APPROVED',
        revealName: Boolean(initialData.revealName),
      };
    }

    const saved = loadSavedForm();

    return saved ?? EMPTY_FORM;
  }, [initialData, loadSavedForm]);

  const { control, register, handleSubmit, reset } = useForm<FinalReviewFormInput, unknown, FinalReviewFormValues>({
    resolver: zodResolver(finalReviewFormSchema),
    defaultValues: getInitialForm(),
    mode: 'onChange',
  });

  const watchedForm = useWatch({ control });

  const form = useMemo<FinalReviewFormValues>(
    () => ({
      ...getInitialForm(),
      ...watchedForm,
      revealName: watchedForm.revealName ?? getInitialForm().revealName,
    }),
    [getInitialForm, watchedForm]
  );

  useEffect(() => {
    reset(getInitialForm());
  }, [getInitialForm, reset]);

  useEffect(() => {
    if (!isReadOnly && taskId) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
      } catch (error: unknown) {
        console.warn('Failed to persist final review form:', error);
      }
    }
  }, [form, isReadOnly, storageKey, taskId]);

  const overallScore = useMemo(() => {
    const scores = [form.architecture, form.readability, form.testability, form.scalability];
    const filled = scores.filter((score) => score > 0);
    if (filled.length === 0) return 0;

    return Math.round(filled.reduce((total, score) => total + score, 0) / filled.length);
  }, [form.architecture, form.readability, form.testability, form.scalability]);

  const isFormValid = finalReviewFormSchema.safeParse(form).success;

  const submit = async () => {
    if (isSubmitting) return;

    await onSubmit?.({
      ...form,
      overallScore,
    });

    try {
      localStorage.removeItem(storageKey);
    } catch (error: unknown) {
      console.warn('Failed to clear saved final review form:', error);
    }
  };

  return (
    <div className={[finalReviewFormStyles.wrapper, reviewResultsSidebarStyles.block].join(' ')}>
      <h3 className={reviewResultsSidebarStyles.title}>Итоговое ревью</h3>
      <form className={finalReviewFormStyles.root} onSubmit={handleSubmit(submit)}>
        <div className={finalReviewFormStyles.fields}>
          <div className={finalReviewFormStyles.field}>
            <span className={finalReviewFormStyles.label}>Оценка архитектуры:</span>
            <Controller
              name="architecture"
              control={control}
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className={finalReviewFormStyles.field}>
            <span className={finalReviewFormStyles.label}>Оценка читаемости:</span>
            <Controller
              name="readability"
              control={control}
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className={finalReviewFormStyles.field}>
            <span className={finalReviewFormStyles.label}>Оценка тестируемости:</span>
            <Controller
              name="testability"
              control={control}
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className={finalReviewFormStyles.field}>
            <span className={finalReviewFormStyles.label}>Оценка масштабируемости:</span>
            <Controller
              name="scalability"
              control={control}
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>

          <div className={finalReviewFormStyles.field}>
            <span className={finalReviewFormStyles.label}>Общая оценка качества:</span>
            <StarDisplay value={overallScore} />
          </div>

          <div className={finalReviewFormStyles.fieldVertical}>
            <span className={finalReviewFormStyles.label}>Общие замечания (мин. 10 символов):</span>
            <textarea
              className={finalReviewFormStyles.textarea}
              placeholder="Оставьте ваш комментарий к решению..."
              disabled={isReadOnly}
              {...register('comment')}
            />
            {form.comment.length > 0 && form.comment.trim().length < 10 && (
              <span className={finalReviewFormStyles.charCount}>{form.comment.trim().length}/10</span>
            )}
          </div>

          <div className={finalReviewFormStyles.fieldVertical}>
            <span className={finalReviewFormStyles.label}>Вердикт:</span>
            <div className={finalReviewFormStyles.radios}>
              <label className={finalReviewFormStyles.radioLabel}>
                <input
                  type="radio"
                  className={finalReviewFormStyles.radioInput}
                  value="APPROVED"
                  disabled={isReadOnly}
                  {...register('verdict')}
                />
                <span className={[finalReviewFormStyles.verdictText, finalReviewFormStyles.isApproved].join(' ')}>
                  Одобрить
                </span>
              </label>
              <label className={finalReviewFormStyles.radioLabel}>
                <input
                  type="radio"
                  className={finalReviewFormStyles.radioInput}
                  value="REWORK"
                  disabled={isReadOnly}
                  {...register('verdict')}
                />
                <span className={[finalReviewFormStyles.verdictText, finalReviewFormStyles.isRework].join(' ')}>
                  На доработку
                </span>
              </label>
            </div>
          </div>

          <label className={finalReviewFormStyles.checkboxLabel}>
            <input
              type="checkbox"
              className={finalReviewFormStyles.checkbox}
              disabled={isReadOnly}
              {...register('revealName')}
            />
            Раскрыть моё имя исполнителям после завершения ревью
          </label>
        </div>

        {!isReadOnly && (
          <button type="submit" className={finalReviewFormStyles.submitBtn} disabled={!isFormValid || isSubmitting}>
            <CheckIcon />
          </button>
        )}
      </form>
    </div>
  );
};

export default FinalReviewForm;
