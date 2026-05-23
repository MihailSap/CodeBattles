import { useState, memo, useMemo } from 'react';
import { AIIcon, LikeIcon, DislikeIcon, DeleteIcon, ComplaintIcon } from '@/shared/ui/icons';
import { COMMENT_CATEGORY_LABEL, COMMENT_CATEGORY_COLOR } from '@/entities/review';
import commentsBlockStyles from './CommentsBlock.module.scss';

const getDisplayName = (comment: LegacyValue, currentUserId: LegacyValue) => {
  if (comment.authorRole === 'AI') return 'AI';
  if (comment.authorRole === 'System') return 'Система';
  if (comment.authorId === currentUserId) return 'Вы';

  if (comment.authorRole === 'Reviewer') {
    return comment.revealName ? comment.authorName : `Ревьюер ${comment.reviewerIndex || ''}`;
  }

  return comment.authorName || 'Пользователь';
};

const CommentThread = memo(
  ({
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
    allowReply = true,
  }: LegacyValue) => {
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

    const canCloseThread =
      !readOnly && level === 1 && !isAI && !isSystem && !comment.isClosed && pageContext === 'task' && onCloseThread;

    const canReopenThread =
      !readOnly && level === 1 && !isAI && !isSystem && comment.isClosed && pageContext === 'review' && onReopenThread;

    const canDelete =
      !readOnly &&
      isMine &&
      !isSystem &&
      onDelete &&
      !hasReplies &&
      ((pageContext === 'task' && level > 1) || pageContext === 'review');

    const canReport = !readOnly && !isMine && !isAI && !isSystem && onReport;

    if (isSystem) {
      return (
        <div className={commentsBlockStyles.thread}>
          <div className={commentsBlockStyles.message}>
            <span className={commentsBlockStyles.text}>{comment.text}</span>
            <span className={commentsBlockStyles.commentSystemDate}>
              {new Date(comment.createdAt).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={commentsBlockStyles.thread}>
        <div
          className={[
            commentsBlockStyles.commentContainer,
            comment.isClosed ? commentsBlockStyles.isClosed : '',
            isAI ? commentsBlockStyles.isAi : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={commentsBlockStyles.header}>
            <div className={commentsBlockStyles.commentAuthor}>
              {isAI && (
                <span className={commentsBlockStyles.aiIcon}>
                  <AIIcon />
                </span>
              )}
              <span
                className={[commentsBlockStyles.commentAuthorName, isMine ? commentsBlockStyles.isMine : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {displayName}
              </span>
              <span className={commentsBlockStyles.date}>
                {new Date(comment.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className={commentsBlockStyles.actionsTop}>
              {comment.category && (
                <span
                  className={commentsBlockStyles.categoryTag}
                  style={{
                    backgroundColor: `${COMMENT_CATEGORY_COLOR[comment.category]}20`,
                    color: COMMENT_CATEGORY_COLOR[comment.category],
                  }}
                >
                  {COMMENT_CATEGORY_LABEL[comment.category]}
                </span>
              )}
              {level === 1 && !isAI && (
                <>
                  {comment.isClosed && <span className={commentsBlockStyles.statusClosed}>Решено</span>}
                  {canCloseThread && (
                    <button
                      className={commentsBlockStyles.closeBtn}
                      type="button"
                      onClick={() => onCloseThread(comment.id)}
                    >
                      Закрыть тред
                    </button>
                  )}
                  {canReopenThread && (
                    <button
                      className={commentsBlockStyles.reopenBtn}
                      type="button"
                      onClick={() => onReopenThread(comment.id)}
                    >
                      Открыть тред
                    </button>
                  )}
                </>
              )}
              {hasReplies && (
                <button
                  className={commentsBlockStyles.toggleBtn}
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
              )}
            </div>
          </div>

          <div className={commentsBlockStyles.body}>{comment.text}</div>

          <div className={commentsBlockStyles.footer}>
            {canReplyHere ? (
              <button
                className={commentsBlockStyles.actionBtn}
                type="button"
                onClick={() => setIsReplying(!isReplying)}
              >
                Ответить
              </button>
            ) : (
              <span />
            )}

            <div className={commentsBlockStyles.footerRight}>
              <button
                className={[commentsBlockStyles.iconBtn, userLiked ? commentsBlockStyles.isActive : '']
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                onClick={() => canLike && onLike(comment.id)}
                disabled={!canLike}
              >
                <LikeIcon filled={userLiked} />
                {likesCount > 0 && <span className={commentsBlockStyles.count}>{likesCount}</span>}
              </button>

              {isAI && (
                <button
                  className={[commentsBlockStyles.iconBtn, userDisliked ? commentsBlockStyles.isActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  onClick={() => canDislike && onDislike(comment.id)}
                  disabled={!canDislike}
                >
                  <DislikeIcon filled={userDisliked} />
                  {dislikesCount > 0 && <span className={commentsBlockStyles.count}>{dislikesCount}</span>}
                </button>
              )}

              {canDelete && (
                <button
                  className={[commentsBlockStyles.iconBtn, commentsBlockStyles.isError].join(' ')}
                  type="button"
                  onClick={() => onDelete(comment.id)}
                >
                  <DeleteIcon />
                </button>
              )}

              {canReport && !canDelete && (
                <button
                  className={[commentsBlockStyles.iconBtn, commentsBlockStyles.isWarning].join(' ')}
                  type="button"
                  onClick={() => onReport(comment.id)}
                >
                  <ComplaintIcon />
                </button>
              )}
            </div>
          </div>

          {isReplying && (
            <div className={commentsBlockStyles.form}>
              <textarea
                className={commentsBlockStyles.textarea}
                placeholder="Ваш ответ (минимум 15 символов)..."
                value={replyText}
                onChange={(e: LegacyValue) => setReplyText(e.target.value)}
              />
              <div className={commentsBlockStyles.actions}>
                <button className={commentsBlockStyles.cancelButton} type="button" onClick={() => setIsReplying(false)}>
                  Отмена
                </button>
                <button
                  className={commentsBlockStyles.submitButton}
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
          <div className={commentsBlockStyles.replies}>
            {comment.replies.map((reply: LegacyValue) => (
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
  }
);

const CommentsBlock = memo(
  ({
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
    isHistory = false,
  }: LegacyValue) => {
    const humanComments = useMemo(() => (comments || []).filter((c: LegacyValue) => c.authorRole !== 'AI'), [comments]);
    const aiComments = useMemo(() => (comments || []).filter((c: LegacyValue) => c.authorRole === 'AI'), [comments]);

    const sortedHuman = useMemo(
      () =>
        [...humanComments].sort(
          (a: LegacyValue, b: LegacyValue) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      [humanComments]
    );

    if (!comments || comments.length === 0) {
      return (
        <div
          className={[commentsBlockStyles.root, isHistory ? commentsBlockStyles.isHistory : '']
            .filter(Boolean)
            .join(' ')}
        >
          <h3 className={commentsBlockStyles.title}>{title}</h3>
          <div className={commentsBlockStyles.empty}>{emptyText}</div>
        </div>
      );
    }

    return (
      <div
        className={[commentsBlockStyles.root, isHistory ? commentsBlockStyles.isHistory : ''].filter(Boolean).join(' ')}
      >
        <h3 className={commentsBlockStyles.title}>{title}</h3>
        <div className={commentsBlockStyles.list}>
          {sortedHuman.map((comment: LegacyValue) => (
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
              <div className={commentsBlockStyles.aiDivider}>
                <span>AI-комментарии</span>
              </div>
              {aiComments.map((comment: LegacyValue) => (
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
  }
);

export default CommentsBlock;
