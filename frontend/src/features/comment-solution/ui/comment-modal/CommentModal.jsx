import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { CheckIcon } from '@/shared/ui/icons';
import { COMMENT_CATEGORY, COMMENT_CATEGORY_LABEL, COMMENT_SEVERITY, COMMENT_SEVERITY_LABEL } from '@/entities/review';
import { commentFormSchema } from '../../model/comment-schema';
import './CommentModal.css';

const CommentModal = ({ isOpen, onClose, onSubmit, isSubmitting, lineData }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      text: '',
      category: '',
      severity: '',
    },
    mode: 'onChange',
  });

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const startLine = lineData?.startLine;
  const endLine = lineData?.endLine;
  const isSingleLine = startLine === endLine;
  const headerText = isSingleLine
    ? `Комментарий к строке ${startLine}`
    : `Комментарий к строкам ${startLine}-${endLine}`;

  const submit = ({ text, category, severity }) => {
    if (isSubmitting) return;
    onSubmit({ text: text.trim(), category: category || null, severity: severity || null });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="comment-modal__backdrop"
      dialogClassName="comment-modal"
      ariaLabel={headerText}
      title={headerText}
      headerClassName="comment-modal__head"
      titleClassName="comment-modal__title"
      closeClassName="comment-modal__close"
    >
      <form className="comment-modal__content" onSubmit={handleSubmit(submit)}>
        <div className="comment-modal__field">
          <label>Текст комментария*</label>
          <textarea
            className="comment-modal__textarea"
            placeholder="Введите текст комментария..."
            {...register('text')}
          />
        </div>

        <div className="comment-modal__row">
          <div className="comment-modal__field">
            <label>Категория</label>
            <div className="comment-modal__radio-group">
              <label className="comment-modal__radio-label">
                <input
                  type="radio"
                  className="comment-modal__radio-input"
                  name="category"
                  value=""
                  {...register('category')}
                />
                <span className="comment-modal__radio-text">Без категории</span>
              </label>
              {Object.values(COMMENT_CATEGORY).map((value) => (
                <label key={value} className="comment-modal__radio-label">
                  <input
                    type="radio"
                    className="comment-modal__radio-input"
                    name="category"
                    value={value}
                    {...register('category')}
                  />
                  <span className="comment-modal__radio-text">{COMMENT_CATEGORY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="comment-modal__field">
            <label>Уровень критичности</label>
            <div className="comment-modal__radio-group">
              <label className="comment-modal__radio-label">
                <input
                  type="radio"
                  className="comment-modal__radio-input"
                  name="severity"
                  value=""
                  {...register('severity')}
                />
                <span className="comment-modal__radio-text">Без критичности</span>
              </label>
              {Object.values(COMMENT_SEVERITY).map((value) => (
                <label key={value} className="comment-modal__radio-label">
                  <input
                    type="radio"
                    className="comment-modal__radio-input"
                    name="severity"
                    value={value}
                    {...register('severity')}
                  />
                  <span className="comment-modal__radio-text">{COMMENT_SEVERITY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="comment-modal__footer">
          <button type="submit" className="comment-modal__submit-btn" disabled={!isValid || isSubmitting}>
            <CheckIcon />
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default CommentModal;
