import { useState, memo, useMemo } from 'react';
import { AIIcon, LikeIcon, DislikeIcon, DeleteIcon, ComplaintIcon } from '@/shared/ui/icons';
import { COMMENT_CATEGORY_LABEL, COMMENT_CATEGORY_COLOR } from '@/entities/review';
import './CommentsBlock.css';


const getDisplayName = (comment, currentUserId) => {
  if (comment.authorRole === 'AI') return 'AI';
  if (comment.authorRole === 'System') return 'Система';
  if (comment.authorId === currentUserId) return 'Вы';
  if (comment.authorRole === 'Reviewer') {
    return comment.revealName
      ? comment.authorName
      : `Ревьюер ${comment.reviewerIndex || ''}`;
  }
  return comment.authorName || 'Пользователь';
};

const CommentThread = memo(({
  comment,
  level = 1,
  currentUser,
  onReply,
  onLike,
  onDislike,
  onDelete,
  onReport,
  onCloseThread,
  onReopenThread,
  readOnly = false,
  pageContext = 'task',
  allowReply = true
}) => {
  const [isExpanded, setIsExpanded] = useState(!comment.isClosed);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  const isAI = comment.authorRole === 'AI';
  const isSystem = comment.authorRole === 'System';
  const isMine = comment.authorId === currentUser?.id;
  const maxDepthReached = level >= 5;

  const displayName = getDisplayName(comment, currentUser?.id);

  const handleReplySubmit = async () => {
    if (replyText.length >= 15 && onReply && !isReplySubmitting) {
      setIsReplySubmitting(true);
      await onReply(comment.id, replyText);
      setIsReplying(false);
      setReplyText('');
      setIsExpanded(true);
      setIsReplySubmitting(false);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;

  const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
  const dislikedBy = Array.isArray(comment.dislikedBy) ? comment.dislikedBy : [];
  const likesCount = likedBy.length;
  const dislikesCount = dislikedBy.length;
  const userLiked = likedBy.includes(currentUser?.id);
  const userDisliked = dislikedBy.includes(currentUser?.id);

  const canReplyHere = !readOnly && !isSystem && !comment.isClosed && !maxDepthReached && allowReply && onReply;
  const canLike = !isMine && !isSystem && onLike;
  const canDislike = !isMine && !isSystem && isAI && onDislike;

  const canCloseThread = !readOnly && level === 1 && !isAI && !isSystem && !comment.isClosed
    && pageContext === 'task' && onCloseThread;

  const canReopenThread = !readOnly && level === 1 && !isAI && !isSystem && comment.isClosed
    && pageContext === 'review' && onReopenThread;

  const canDelete = !readOnly && isMine && !isSystem && onDelete && !hasReplies && (
    (pageContext === 'task' && level > 1) ||
    (pageContext === 'review')
  );

  const canReport = !readOnly && !isMine && !isAI && !isSystem && onReport;

  if (isSystem) {
    return (
      <div className={`comment-thread level-${level}`}>
        <div className="comment-system-message">
          <span className="comment-system-text">{comment.text}</span>
          <span className="comment-system-date">
            {new Date(comment.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`comment-thread level-${level}`}>
      <div className={`comment-container ${comment.isClosed ? 'comment-container--closed' : ''} ${isAI ? 'comment-container--ai' : ''}`}>
        <div className="comment-header">
          <div className="comment-author">
            {isAI && <span className="comment-author-ai-icon"><AIIcon /></span>}
            <span className={`comment-author-name ${isMine ? 'comment-author-name--mine' : ''}`}>{displayName}</span>
            <span className="comment-date">
              {new Date(comment.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="comment-actions-top">
            {comment.category && (
              <span
                className="comment-category-tag"
                style={{ backgroundColor: `${COMMENT_CATEGORY_COLOR[comment.category]}20`, color: COMMENT_CATEGORY_COLOR[comment.category] }}
              >
                {COMMENT_CATEGORY_LABEL[comment.category]}
              </span>
            )}
            {level === 1 && !isAI && (
              <>
                {comment.isClosed && (
                  <span className="comment-status-closed">Решено</span>
                )}
                {canCloseThread && (
                  <button className="comment-close-btn" type="button" onClick={() => onCloseThread(comment.id)}>
                    Закрыть тред
                  </button>
                )}
                {canReopenThread && (
                  <button className="comment-reopen-btn" type="button" onClick={() => onReopenThread(comment.id)}>
                    Открыть тред
                  </button>
                )}
              </>
            )}
            {hasReplies && (
              <button className="comment-toggle-btn" type="button" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? '▾' : '▸'}
              </button>
            )}
          </div>
        </div>

        <div className="comment-body">
          {comment.text}
        </div>

        <div className="comment-footer">
          {canReplyHere ? (
            <button className="comment-action-btn" type="button" onClick={() => setIsReplying(!isReplying)}>
              Ответить
            </button>
          ) : <span />}

          <div className="comment-footer-right">

            <button
              className={`comment-icon-btn ${userLiked ? 'active' : ''}`}
              type="button"
              onClick={() => canLike && onLike(comment.id)}
              disabled={!canLike}
            >
              <LikeIcon filled={userLiked} />
              {likesCount > 0 && <span className="comment-count">{likesCount}</span>}
            </button>

            {isAI && (
              <button
                className={`comment-icon-btn ${userDisliked ? 'active' : ''}`}
                type="button"
                onClick={() => canDislike && onDislike(comment.id)}
                disabled={!canDislike}
              >
                <DislikeIcon filled={userDisliked} />
                {dislikesCount > 0 && <span className="comment-count">{dislikesCount}</span>}
              </button>
            )}


            {canDelete && (
              <button className="comment-icon-btn error" type="button" onClick={() => onDelete(comment.id)}>
                <DeleteIcon />
              </button>
            )}


            {canReport && !canDelete && (
              <button className="comment-icon-btn warning" type="button" onClick={() => onReport(comment.id)}>
                <ComplaintIcon />
              </button>
            )}
          </div>
        </div>

        {isReplying && (
          <div className="comment-reply-form">
            <textarea
              className="comment-textarea"
              placeholder="Ваш ответ (минимум 15 символов)..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="comment-reply-actions">
              <button className="btn-cancel" type="button" onClick={() => setIsReplying(false)}>
                Отмена
              </button>
              <button
                className="btn-submit"
                type="button"
                disabled={replyText.length < 15 || isReplySubmitting}
                onClick={handleReplySubmit}
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && hasReplies && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              level={level + 1}
              currentUser={currentUser}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              onDelete={onDelete}
              onReport={onReport}
              onCloseThread={onCloseThread}
              onReopenThread={onReopenThread}
              readOnly={readOnly}
              pageContext={pageContext}
              allowReply={allowReply}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const CommentsBlock = memo(({
  comments,
  currentUser,
  onReply,
  onLike,
  onDislike,
  onDelete,
  onReport,
  onCloseThread,
  onReopenThread,
  readOnly = false,
  pageContext = 'task',
  allowReply = true,
  title = 'Комментарии',
  emptyText = 'Выберите участок кода с комментариями',
  isHistory = false
}) => {
  const humanComments = useMemo(() => (comments || []).filter((c) => c.authorRole !== 'AI'), [comments]);
  const aiComments = useMemo(() => (comments || []).filter((c) => c.authorRole === 'AI'), [comments]);

  const sortedHuman = useMemo(() => [...humanComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ), [humanComments]);

  if (!comments || comments.length === 0) {
    return (
      <div className={`comments-block ${isHistory ? 'comments-block--history' : ''}`}>
        <h3 className="comments-block-title">{title}</h3>
        <div className="comments-block-empty">{emptyText}</div>
      </div>
    );
  }

  return (
    <div className={`comments-block ${isHistory ? 'comments-block--history' : ''}`}>
      <h3 className="comments-block-title">{title}</h3>
      <div className="comments-block-list">
        {sortedHuman.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            level={1}
            currentUser={currentUser}
            onReply={isHistory ? undefined : onReply}
            onLike={isHistory ? undefined : onLike}
            onDislike={isHistory ? undefined : onDislike}
            onDelete={isHistory ? undefined : onDelete}
            onReport={isHistory ? undefined : onReport}
            onCloseThread={isHistory ? undefined : onCloseThread}
            onReopenThread={isHistory ? undefined : onReopenThread}
            readOnly={readOnly || isHistory}
            pageContext={pageContext}
            allowReply={allowReply}
          />
        ))}

        {aiComments.length > 0 && (
          <>
            <div className="comments-block-ai-divider">
              <span>AI-комментарии</span>
            </div>
            {aiComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                level={1}
                currentUser={currentUser}
                onLike={isHistory ? undefined : onLike}
                onDislike={isHistory ? undefined : onDislike}
                readOnly={readOnly || isHistory}
                pageContext={pageContext}
                allowReply={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

export default CommentsBlock;
