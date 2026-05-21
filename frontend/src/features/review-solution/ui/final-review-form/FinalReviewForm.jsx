import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StarIcon, CheckIcon } from '@/shared/ui/icons';
import { finalReviewFormSchema } from '../../model/final-review-schema';
import './FinalReviewForm.css';

const STORAGE_KEY_PREFIX = 'codebattles_final_review_';

const StarSelector = ({ value, onChange, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="star-selector" onMouseLeave={() => setHoverValue(0)}>
      {Array.from({ length: 5 }).map((_, i) => {
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
            className="star-selector__btn"
            onClick={() => !disabled && onChange(ratingValue)}
            onMouseEnter={() => !disabled && setHoverValue(ratingValue)}
            disabled={disabled}
          >
            <StarIcon filled={isFilled} color={starColor} />
          </button>
        );
      })}
    </div>
  );
};

const StarDisplay = ({ value }) => {
  const rounded = Math.round(value);
  return (
    <div className="star-selector star-selector--readonly">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i + 1} className="star-selector__btn star-selector__btn--readonly">
          <StarIcon filled={i < rounded} />
        </span>
      ))}
    </div>
  );
};

const FinalReviewForm = ({ onSubmit, isSubmitting, isReadOnly = false, taskId, initialData = null }) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${taskId || 'default'}`;

  const loadSavedForm = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to parse saved final review form:', error);
    }
    return null;
  }, [storageKey]);

  const getInitialForm = useCallback(() => {
    if (initialData) {
      return {
        architecture: initialData.architecture || 0,
        readability: initialData.readability || 0,
        testability: initialData.testability || 0,
        scalability: initialData.scalability || 0,
        comment: initialData.comment || '',
        verdict: initialData.verdict || '',
        revealName: Boolean(initialData.revealName),
      };
    }

    const saved = loadSavedForm();
    return (
      saved || {
        architecture: 0,
        readability: 0,
        testability: 0,
        scalability: 0,
        comment: '',
        verdict: '',
        revealName: false,
      }
    );
  }, [initialData, loadSavedForm]);

  const { control, register, handleSubmit, reset } = useForm({
    resolver: zodResolver(finalReviewFormSchema),
    defaultValues: getInitialForm(),
    mode: 'onChange',
  });
  const form = useWatch({ control }) || getInitialForm();

  useEffect(() => {
    reset(getInitialForm());
  }, [getInitialForm, reset]);

  useEffect(() => {
    if (!isReadOnly && taskId) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
      } catch (error) {
        console.warn('Failed to persist final review form:', error);
      }
    }
  }, [form, isReadOnly, storageKey, taskId]);

  const overallScore = useMemo(() => {
    const scores = [form.architecture, form.readability, form.testability, form.scalability];
    const filled = scores.filter((s) => s > 0);
    if (filled.length === 0) return 0;
    return Math.round(filled.reduce((a, b) => a + b, 0) / filled.length);
  }, [form.architecture, form.readability, form.testability, form.scalability]);

  const isFormValid = finalReviewFormSchema.safeParse(form).success;

  const submit = async () => {
    if (isSubmitting) return;
    await onSubmit({ ...form, overallScore });
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear saved final review form:', error);
    }
  };

  return (
    <div className="final-review-form-wrapper review-results-sidebar__block">
      <h3 className="review-results-sidebar__title">Итоговое ревью</h3>
      <form className="final-review-form" onSubmit={handleSubmit(submit)}>
        <div className="final-review-form__fields">
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка архитектуры:</span>
            <Controller
              control={control}
              name="architecture"
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка читаемости:</span>
            <Controller
              control={control}
              name="readability"
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка тестируемости:</span>
            <Controller
              control={control}
              name="testability"
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка масштабируемости:</span>
            <Controller
              control={control}
              name="scalability"
              render={({ field }) => (
                <StarSelector value={field.value} onChange={field.onChange} disabled={isReadOnly} />
              )}
            />
          </div>

          <div className="final-review-form__field">
            <span className="final-review-form__label">Общая оценка качества:</span>
            <StarDisplay value={overallScore} />
          </div>

          <div className="final-review-form__field-vertical">
            <span className="final-review-form__label">Общие замечания (мин. 20 символов):</span>
            <textarea
              className="final-review-form__textarea"
              placeholder="Оставьте ваш комментарий к решению..."
              disabled={isReadOnly}
              {...register('comment')}
            />
            {form.comment.length > 0 && form.comment.trim().length < 20 && (
              <span className="final-review-form__char-count">{form.comment.trim().length}/20</span>
            )}
          </div>

          <div className="final-review-form__field-vertical">
            <span className="final-review-form__label">Вердикт:</span>
            <div className="final-review-form__radios">
              <label className="final-review-form__radio-label">
                <input
                  type="radio"
                  className="final-review-form__radio-input"
                  name="verdict"
                  value="APPROVED"
                  disabled={isReadOnly}
                  {...register('verdict')}
                />
                <span className="final-review-form__verdict-text final-review-form__verdict-text--approved">
                  Одобрить
                </span>
              </label>
              <label className="final-review-form__radio-label">
                <input
                  type="radio"
                  className="final-review-form__radio-input"
                  name="verdict"
                  value="REWORK"
                  disabled={isReadOnly}
                  {...register('verdict')}
                />
                <span className="final-review-form__verdict-text final-review-form__verdict-text--rework">
                  На доработку
                </span>
              </label>
            </div>
          </div>

          <label className="final-review-form__checkbox-label">
            <input
              type="checkbox"
              className="final-review-form__checkbox"
              disabled={isReadOnly}
              {...register('revealName')}
            />
            Раскрыть моё имя исполнителям после завершения ревью
          </label>
        </div>

        {!isReadOnly && (
          <button type="submit" className="final-review-form__submit-btn" disabled={!isFormValid || isSubmitting}>
            <CheckIcon />
          </button>
        )}
      </form>
    </div>
  );
};

export default FinalReviewForm;
