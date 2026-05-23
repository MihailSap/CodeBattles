import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { CheckIcon } from '@/shared/ui/icons';
import { COMMENT_CATEGORY, COMMENT_CATEGORY_LABEL, COMMENT_SEVERITY, COMMENT_SEVERITY_LABEL } from '@/entities/review';
import { commentFormSchema } from '../../model/comment-schema';
import commentModalStyles from './CommentModal.module.scss';

const CommentModal = ({ isOpen, onClose, onSubmit, isSubmitting, lineData }: LegacyValue) => {
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

  const submit = ({ text, category, severity }: LegacyValue) => {
    if (isSubmitting) return;

    onSubmit({
      text: text.trim(),
      category: category || null,
      severity: severity || null,
    });

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
      overlayClassName={commentModalStyles.backdrop}
      dialogClassName={commentModalStyles.root}
      ariaLabel={headerText}
      title={headerText}
      headerClassName={commentModalStyles.head}
      titleClassName={commentModalStyles.title}
      closeClassName={commentModalStyles.close}
    >
      <form className={commentModalStyles.content} onSubmit={handleSubmit(submit)}>
        <div className={commentModalStyles.field}>
          <label>Текст комментария*</label>
          <textarea
            className={commentModalStyles.textarea}
            placeholder="Введите текст комментария..."
            {...register('text')}
          />
        </div>

        <div className={commentModalStyles.row}>
          <div className={commentModalStyles.field}>
            <label>Категория</label>
            <div className={commentModalStyles.radioGroup}>
              <label className={commentModalStyles.radioLabel}>
                <input type="radio" className={commentModalStyles.radioInput} value="" {...register('category')} />
                <span className={commentModalStyles.radioText}>Без категории</span>
              </label>
              {Object.values(COMMENT_CATEGORY).map((value: LegacyValue) => (
                <label key={value} className={commentModalStyles.radioLabel}>
                  <input
                    type="radio"
                    className={commentModalStyles.radioInput}
                    value={value}
                    {...register('category')}
                  />
                  <span className={commentModalStyles.radioText}>{COMMENT_CATEGORY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={commentModalStyles.field}>
            <label>Уровень критичности</label>
            <div className={commentModalStyles.radioGroup}>
              <label className={commentModalStyles.radioLabel}>
                <input type="radio" className={commentModalStyles.radioInput} value="" {...register('severity')} />
                <span className={commentModalStyles.radioText}>Без критичности</span>
              </label>
              {Object.values(COMMENT_SEVERITY).map((value: LegacyValue) => (
                <label key={value} className={commentModalStyles.radioLabel}>
                  <input
                    type="radio"
                    className={commentModalStyles.radioInput}
                    value={value}
                    {...register('severity')}
                  />
                  <span className={commentModalStyles.radioText}>{COMMENT_SEVERITY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={commentModalStyles.footer}>
          <button type="submit" className={commentModalStyles.submitBtn} disabled={!isValid || isSubmitting}>
            <CheckIcon />
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default CommentModal;
