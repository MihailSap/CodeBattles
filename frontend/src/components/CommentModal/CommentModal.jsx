import { useState } from 'react';
import ModalShell from '../ModalShell/ModalShell';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { CheckIcon } from '../Icons/Icons';
import {
  COMMENT_CATEGORY,
  COMMENT_CATEGORY_LABEL,
  COMMENT_SEVERITY,
  COMMENT_SEVERITY_LABEL,
} from '../../constants/review';
import './CommentModal.css';

const CommentModal = ({ isOpen, onClose, onSubmit, isSubmitting, lineData }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const startLine = lineData?.startLine;
  const endLine = lineData?.endLine;
  const isSingleLine = startLine === endLine;
  const headerText = isSingleLine
    ? `Комментарий к строке ${startLine}`
    : `Комментарий к строкам ${startLine}-${endLine}`;

  const handleSubmit = () => {
    if (text.length < 15 || isSubmitting) return;
    onSubmit({ text, category: category || null, severity: severity || null });
    setText('');
    setCategory('');
    setSeverity('');
  };

  const handleClose = () => {
    setText('');
    setCategory('');
    setSeverity('');
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
      <div className="comment-modal__content">
        <div className="comment-modal__field">
          <label>Текст комментария*</label>
          <textarea
            className="comment-modal__textarea"
            placeholder="Введите текст комментария..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
                  checked={category === ''}
                  onChange={() => setCategory('')}
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
                    checked={category === value}
                    onChange={(e) => setCategory(e.target.value)}
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
                  checked={severity === ''}
                  onChange={() => setSeverity('')}
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
                    checked={severity === value}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span className="comment-modal__radio-text">{COMMENT_SEVERITY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="comment-modal__footer">
          <button
            type="button"
            className="comment-modal__submit-btn"
            disabled={text.trim().length < 15 || isSubmitting}
            onClick={handleSubmit}
          >
            <CheckIcon />
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default CommentModal;
