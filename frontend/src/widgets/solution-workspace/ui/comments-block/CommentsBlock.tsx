import { type ChangeEvent, useState, memo, useMemo } from 'react';
import { AIIcon, LikeIcon, DislikeIcon, DeleteIcon, ComplaintIcon } from '@/shared/ui/icons';
import { COMMENT_CATEGORY_LABEL, COMMENT_CATEGORY_COLOR, type ReviewComment } from '@/entities/review';
import type { User } from '@/entities/user';
import type { EntityId } from '@/entities/project';
import commentsBlockStyles from './CommentsBlock.module.scss';

type PageContext = 'task' | 'review';
type CommentAction = (commentId: EntityId) => void | Promise<void>;
type ReplyAction = (commentId: EntityId, text: string) => void | Promise<void>;

interface CommentsBlockProps {
  comments: readonly ReviewComment[];
  currentUser?: User | null | undefined;
  onReply?: ReplyAction | undefined;
  onLike?: CommentAction | undefined;
  onDislike?: CommentAction | undefined;
  onDelete?: CommentAction | undefined;
  onReport?: CommentAction | undefined;
  onCloseThread?: CommentAction | undefined;
  onReopenThread?: CommentAction | undefined;
  readOnly?: boolean;
  pageContext?: PageContext;
  allowReply?: boolean;
  title?: string;
  emptyText?: string;
  isHistory?: boolean;
}

interface CommentThreadProps extends Omit<CommentsBlockProps, 'comments' | 'title' | 'emptyText' | 'isHistory'> {
  comment: ReviewComment;
  level?: number;
  threadClosed?: boolean;
}

const getDisplayName = (comment: ReviewComment, currentUserId?: EntityId): string => {
  if (comment.authorRole === 'AI') return 'AI';
  if (comment.authorRole === 'System') return 'Система';
  if (comment.authorId === currentUserId) return 'Вы';

  if (comment.authorRole === 'Reviewer') {
    const anonymousName = `Ревьюер ${comment.reviewerIndex || ''}`.trim();

    return comment.revealName && comment.authorName ? comment.authorName : anonymousName;
  }

  if (comment.authorRole === 'Assignee') {
    return comment.revealName && comment.authorName ? comment.authorName : 'Исполнитель';
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
    threadClosed = false,
  }: CommentThreadProps) => {
    const [isExpanded, setIsExpanded] = useState(!comment.isClosed);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isReplySubmitting, setIsReplySubmitting] = useState(false);
    const isAI = comment.authorRole === 'AI';
    const isSystem = comment.authorRole === 'System';
    const isMine = comment.authorId === currentUser?.id;
    const maxDepthReached = level >= 5;
    const displayName = getDisplayName(comment, currentUser?.id);
    const isThreadClosed = threadClosed || Boolean(comment.isClosed);

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
    const userLiked = currentUser !== null && currentUser !== undefined && likedBy.includes(currentUser.id);
    const userDisliked = currentUser !== null && currentUser !== undefined && dislikedBy.includes(currentUser.id);
    const canReplyHere = !readOnly && !isSystem && !isThreadClosed && !maxDepthReached && allowReply && onReply;
    const canReact = !(level > 1 && isThreadClosed);
    const canLike = canReact && !isMine && !isSystem && onLike;
    const canDislike = canReact && !isMine && !isSystem && isAI && onDislike;

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
              {new Date(comment.createdAt ?? '').toLocaleString('ru-RU', {
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
            isThreadClosed ? commentsBlockStyles.isClosed : '',
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
                {new Date(comment.createdAt ?? '').toLocaleString('ru-RU', {
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
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReplyText(event.target.value)}
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
                threadClosed={isThreadClosed}
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
  }: CommentsBlockProps) => {
    const humanComments = useMemo(() => comments.filter((comment) => comment.authorRole !== 'AI'), [comments]);
    const aiComments = useMemo(() => comments.filter((comment) => comment.authorRole === 'AI'), [comments]);

    const sortedHuman = useMemo(
      () =>
        [...humanComments].sort(
          (left, right) => new Date(left.createdAt ?? '').getTime() - new Date(right.createdAt ?? '').getTime()
        ),
      [humanComments]
    );

    if (comments.length === 0) {
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
              <div className={commentsBlockStyles.aiDivider}>
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
  }
);

export default CommentsBlock;
