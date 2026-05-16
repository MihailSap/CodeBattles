import { useState, useEffect, useMemo, useCallback } from 'react';
import { StarIcon, CheckIcon } from '../Icons/Icons';
import './FinalReviewForm.css';

const STORAGE_KEY_PREFIX = 'codebattles_final_review_';

const StarSelector = ({ value, onChange, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="star-selector" onMouseLeave={() => setHoverValue(0)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const ratingValue = i + 1;
        const isFilled = ratingValue <= (hoverValue || value);
        const starColor = hoverValue && ratingValue <= hoverValue
          ? 'var(--color-rating-star-hover)'
          : isFilled ? 'var(--color-rating-star)' : undefined;

        return (
          <button
            key={i}
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
        <span key={i} className="star-selector__btn star-selector__btn--readonly">
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
        revealName: Boolean(initialData.revealName)
      };
    }

    const saved = loadSavedForm();
    return saved || {
      architecture: 0,
      readability: 0,
      testability: 0,
      scalability: 0,
      comment: '',
      verdict: '',
      revealName: false
    };
  }, [initialData, loadSavedForm]);

  const [form, setForm] = useState(getInitialForm);

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

  const isFormValid =
    form.architecture > 0 &&
    form.readability > 0 &&
    form.testability > 0 &&
    form.scalability > 0 &&
    form.comment.trim().length >= 20 &&
    form.verdict !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    await onSubmit({ ...form, overallScore });
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear saved final review form:', error);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="final-review-form-wrapper review-results-sidebar__block">
      <h3 className="review-results-sidebar__title">Итоговое ревью</h3>
      <form className="final-review-form" onSubmit={handleSubmit}>
        <div className="final-review-form__fields">
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка архитектуры:</span>
            <StarSelector
              value={form.architecture}
              onChange={(val) => updateField('architecture', val)}
              disabled={isReadOnly}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка читаемости:</span>
            <StarSelector
              value={form.readability}
              onChange={(val) => updateField('readability', val)}
              disabled={isReadOnly}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка тестируемости:</span>
            <StarSelector
              value={form.testability}
              onChange={(val) => updateField('testability', val)}
              disabled={isReadOnly}
            />
          </div>
          <div className="final-review-form__field">
            <span className="final-review-form__label">Оценка масштабируемости:</span>
            <StarSelector
              value={form.scalability}
              onChange={(val) => updateField('scalability', val)}
              disabled={isReadOnly}
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
              value={form.comment}
              onChange={(e) => updateField('comment', e.target.value)}
              disabled={isReadOnly}
            />
            {form.comment.length > 0 && form.comment.trim().length < 20 && (
              <span className="final-review-form__char-count">
                {form.comment.trim().length}/20
              </span>
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
                  checked={form.verdict === 'APPROVED'}
                  onChange={() => updateField('verdict', 'APPROVED')}
                  disabled={isReadOnly}
                />
                <span className="final-review-form__verdict-text final-review-form__verdict-text--approved">Одобрить</span>
              </label>
              <label className="final-review-form__radio-label">
                <input
                  type="radio"
                  className="final-review-form__radio-input"
                  name="verdict"
                  value="REWORK"
                  checked={form.verdict === 'REWORK'}
                  onChange={() => updateField('verdict', 'REWORK')}
                  disabled={isReadOnly}
                />
                <span className="final-review-form__verdict-text final-review-form__verdict-text--rework">На доработку</span>
              </label>
            </div>
          </div>

          <label className="final-review-form__checkbox-label">
            <input
              type="checkbox"
              className="final-review-form__checkbox"
              checked={form.revealName}
              onChange={(e) => updateField('revealName', e.target.checked)}
              disabled={isReadOnly}
            />
            Раскрыть моё имя исполнителям после завершения ревью
          </label>
        </div>

        {!isReadOnly && (

          <button type="submit"
            className="final-review-form__submit-btn"
            disabled={!isFormValid || isSubmitting}>
            <CheckIcon />
          </button>
        )}
      </form>
    </div>
  );
};

export default FinalReviewForm;
