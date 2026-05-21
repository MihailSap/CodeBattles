import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import tasksCountIcon from '@/shared/assets/tasks-count-icon.svg';
import { CheckIcon } from '@/shared/ui/icons';
import FileTree from '@/shared/ui/file-tree';
import CodeViewer from '@/shared/ui/code-viewer';
import { CommentsBlock } from '@/widgets/solution-workspace';
import { ReviewResultsSidebar } from '@/widgets/review-workspace';
import ScrollToTopButton from '@/shared/ui/scroll-to-top-button';
import { projectsApi } from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import {
  REVIEW_STATUS_LABEL,
  getDeadlineInfo
} from '@/entities/review';
import { NOTIFICATION_COMPLETION_ACTION, NOTIFICATION_TARGET_KIND, useCompleteNotificationMutation } from '@/entities/notification';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { getLanguageByFileName, lazyNamed } from '@/shared/lib';
import { AvatarIcon, CommentIcon } from '@/shared/ui/icons';
import './ReviewPage.css';

const CommentModal = lazyNamed(() => import('@/features/comment-solution'), 'CommentModal');
const FinalReviewForm = lazyNamed(() => import('@/features/review-solution'), 'FinalReviewForm');
const ReportModal = lazyNamed(() => import('@/features/report-review'), 'ReportModal');

const ReviewPage = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { userId, user } = useAuth();

  const [task, setTask] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLineRange, setSelectedLineRange] = useState(null);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [contextLineData, setContextLineData] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [completeNotification] = useCompleteNotificationMutation();

  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentMap, setFileContentMap] = useState({});

  const numericUserId = Number(userId);
  const isAdmin = user?.role === 'ADMIN';

  const findFileByPath = useCallback((nodes, path) => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const loadData = useCallback(async () => {
    const findFirstFileInternal = (nodes) => {
      for (const node of nodes) {
        if (!node.isDirectory) return node;
        if (node.children) {
          const found = findFirstFileInternal(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    try {
      const reviewData = await projectsApi.getReviewById(reviewId);
      if (!reviewData) {
        navigate(ROUTES.reviews, { replace: true });
        return;
      }
      setReview(reviewData);

      const [taskData] = await Promise.all([
        projectsApi.getTaskById(reviewData.projectId, reviewData.taskId),
        projectsApi.getProjectById(reviewData.projectId)
      ]);
      setTask(taskData);

      const isUserReviewer = taskData.reviewerIds?.includes(numericUserId);

      if (!isUserReviewer && !isAdmin) {
        navigate(ROUTES.reviews, {
          replace: true,
          state: {
            snackbarMessage: 'У вас нет доступа к этому ревью',
            snackbarType: 'error'
          }
        });
        return;
      }

      if (reviewData.files?.length > 0) {
        setSelectedFile(prev => {
          if (prev) {
            const stillExists = findFileByPath(reviewData.files, prev.path);
            if (stillExists) return stillExists;
          }
          const firstFile = findFirstFileInternal(reviewData.files);
          return firstFile || reviewData.files[0];
        });
      }
    } catch (err) {
      console.error('Review data load error:', err);
      showSnackbar('Ошибка загрузки данных ревью', 'error');
    } finally {
      setLoading(false);
    }
  }, [reviewId, navigate, findFileByPath, isAdmin, numericUserId, showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchFileContent = useCallback(async (filePath) => {
    if (fileContentMap[filePath] && !fileContentMap[filePath].error) return;
    setFileContentLoading(true);
    try {
      const data = await projectsApi.getReviewFileContent(reviewId, filePath);
      setFileContentMap(prev => ({ ...prev, [filePath]: data }));
    } catch (err) {
      console.error('Failed to fetch file content:', err);
      setFileContentMap(prev => ({ ...prev, [filePath]: { error: true } }));
      showSnackbar('Ошибка загрузки содержимого файла', 'error');
    } finally {
      setFileContentLoading(false);
    }
  }, [reviewId, fileContentMap, showSnackbar]);

  const handleSelectFile = useCallback((file) => {
    setSelectedFile(file);
    setSelectedLineRange(null);
    if (!file.isDirectory) {
      fetchFileContent(file.path);
    }
  }, [fetchFileContent]);

  useEffect(() => {
    if (selectedFile && !selectedFile.isDirectory && !fileContentMap[selectedFile.path]) {
      fetchFileContent(selectedFile.path);
    }
  }, [selectedFile, fileContentMap, fetchFileContent]);

  const isReviewer = useMemo(() => {
    if (!task?.reviewerIds || userId === null || userId === undefined) return false;
    return task.reviewerIds.includes(numericUserId);
  }, [task?.reviewerIds, userId, numericUserId]);
  const isAdminReadOnlyView = isAdmin && !isReviewer;

  const isCompleted = review?.status === 'COMPLETED';
  const myFinalReview = useMemo(() => (review?.finalReviews || []).find(
    (fr) => fr.reviewerId === numericUserId
  ), [review?.finalReviews, numericUserId]);

  const alreadySubmittedReview = !!myFinalReview;
  const isReadOnlyMode = alreadySubmittedReview || isCompleted;
  const canAddNewComments = isReviewer && !isReadOnlyMode;
  const canDiscussThreads = isReviewer && (isCompleted || (!alreadySubmittedReview && !isCompleted));

  const taskId = review?.taskId;

  const handleLineContextMenu = useCallback((data) => {
    if (!canAddNewComments) return;
    setContextLineData({
      startLine: data.startLineNumber,
      endLine: data.endLineNumber
    });
    setIsCommentModalOpen(true);
  }, [canAddNewComments]);

  const handleLineClick = useCallback((range) => {
    setSelectedLineRange(range);
  }, []);

  const handleAddComment = async ({ text, category, severity }) => {
    if (!contextLineData || !selectedFile) return;

    setIsCommentSubmitting(true);
    try {
      await projectsApi.addReviewComment(taskId, {
        file: selectedFile.path,
        startLine: contextLineData.startLine,
        endLine: contextLineData.endLine,
        text,
        category,
        severity,
        authorId: numericUserId,
        authorName: 'Вы',
        authorRole: 'Reviewer',
        createdAt: new Date().toISOString()
      });
      await loadData();
      setIsCommentModalOpen(false);
      showSnackbar('Комментарий добавлен', 'success');
    } catch {
      showSnackbar('Ошибка отправки комментария. Попробуйте позже.', 'error');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReply = async (commentId, text) => {
    try {
      await projectsApi.replyToReviewComment(taskId, commentId, {
        authorId: numericUserId,
        authorName: 'Вы',
        authorRole: 'Reviewer',
        text,
        createdAt: new Date().toISOString()
      });
      await loadData();
      showSnackbar('Ответ отправлен', 'success');
    } catch {
      showSnackbar('Ошибка отправки ответа. Попробуйте позже.', 'error');
    }
  };

  const handleLike = async (commentId) => {
    try {
      await projectsApi.toggleCommentLike(taskId, commentId, numericUserId, false);
      await loadData();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = useCallback(async (commentId) => {
    try {
      await projectsApi.toggleCommentLike(taskId, commentId, numericUserId, true);
      await loadData();
    } catch (err) {
      console.error('Dislike error:', err);
    }
  }, [taskId, numericUserId, loadData]);

  const handleDeleteComment = async (commentId) => {
    try {
      await projectsApi.deleteReviewComment(taskId, commentId);
      await loadData();
      showSnackbar('Комментарий удален', 'success');
    } catch {
      showSnackbar('Ошибка удаления комментария', 'error');
    }
  };

  const handleCloseThread = async (commentId) => {
    try {
      await projectsApi.closeCommentThread(taskId, commentId, 'close');
      await loadData();
      showSnackbar('Тред закрыт', 'success');
    } catch {
      showSnackbar('Ошибка закрытия треда', 'error');
    }
  };

  const handleReopenThread = async (commentId) => {
    try {
      await projectsApi.closeCommentThread(taskId, commentId, 'open');
      await loadData();
      showSnackbar('Тред переоткрыт', 'success');
    } catch {
      showSnackbar('Ошибка открытия треда', 'error');
    }
  };

  const handleFinalSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await projectsApi.submitFinalReview(taskId, {
        ...payload,
        reviewerId: numericUserId,
        reviewerName: 'Вы'
      });
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_REVIEW_RESULT,
        target: {
          kind: NOTIFICATION_TARGET_KIND.REVIEW,
          reviewId: Number(reviewId),
          taskId
        }
      });
      await loadData();
      showSnackbar('Результаты ревью успешно сохранены', 'success');
    } catch {
      showSnackbar('Ошибка сохранения результатов ревью. Попробуйте позже.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (reason, comment) => {
    setIsSubmitting(true);
    try {
      await projectsApi.reportComment(taskId, reportingCommentId, { reason, comment });
      setIsReportModalOpen(false);
      showSnackbar('Жалоба отправлена', 'success');
    } catch {
      showSnackbar('Не удалось отправить жалобу', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReportModal = (commentId) => {
    setReportingCommentId(commentId);
    setIsReportModalOpen(true);
  };

  const allComments = useMemo(() => review?.comments || [], [review?.comments]);
  const visibleComments = useMemo(
    () => task?.aiReviewEnabled ? allComments : allComments.filter((comment) => comment.authorRole !== 'AI'),
    [allComments, task?.aiReviewEnabled]
  );
  const fileComments = visibleComments.filter((c) => c.file === selectedFile?.path);
  const commentedFiles = [...new Set(visibleComments.map((c) => c.file))];

  const displayedComments = selectedLineRange
    ? fileComments.filter(c =>
      c.startLine === selectedLineRange.startLine && c.endLine === selectedLineRange.endLine
    )
    : [];

  const showAssigneesName = isCompleted && review?.revealAuthorAfterReview;

  const assigneesToReveal = useMemo(() => {
    if (!task?.assignees) return null;

    if (isAdminReadOnlyView) {
      return task.assignees;
    }

    const isCompletedStatus = review?.status === 'COMPLETED';
    const finalReviews = review?.finalReviews || [];
    const allApproved = finalReviews.length > 0 && finalReviews.every(fr => fr.verdict === 'APPROVED');
    const shouldReveal = review?.revealAuthorAfterReview;

    if (isCompletedStatus && allApproved && shouldReveal) {
      return task.assignees;
    }

    return null;
  }, [isAdminReadOnlyView, task?.assignees, review?.status, review?.finalReviews, review?.revealAuthorAfterReview]);

  const commentsCount = visibleComments.length;

  const humanComments = useMemo(() => visibleComments.filter(c => c.authorRole !== 'AI'), [visibleComments]);
  const isAllResolved = useMemo(() => humanComments.length > 0 && humanComments.every(c => c.isClosed), [humanComments]);
  const allThreadsResolved = isAllResolved;

  const myHistoryComments = useMemo(() => {
    if (!review?.history) return [];
    return review.history.flatMap(h => h.comments || []).filter(c => c.authorId === numericUserId);
  }, [review?.history, numericUserId]);

  const deadlineInfo = useMemo(() => {
    if (!review?.deadline) return null;
    const info = getDeadlineInfo(review.deadline, review.status, review.reviewedAt);

    let colorClass = 'review-page__deadline--pending';
    if (info.isOverdue) {
      colorClass = 'review-page__deadline--error';
    } else if (review.status === 'COMPLETED') {
      colorClass = 'review-page__deadline--success';
    } else {
      colorClass = 'review-page__deadline--warning';
    }

    return { ...info, colorClass };
  }, [review?.deadline, review?.status, review?.reviewedAt]);

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-page__loader"><Spinner /></div>
      </div>
    );
  }

  if (!task || !review) {
    return (
      <div className="review-page">
        <div className="review-page__loader">Данные не найдены</div>
      </div>
    );
  }

  const currentFileContent = fileContentMap[selectedFile?.path];

  return (
    <div className="review-page">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <div className="project-page__content review-page__content">
        <section className="project-page__info section-card">
          <div className="project-page__title-row">
            <div className="project-page__title-wrap">
              <h1 className="project-page__title">{task?.name}</h1>
            </div>
            <span className="project-page__role-tag">{REVIEW_STATUS_LABEL[review?.status]}</span>
          </div>

          <p className="project-page__organization">{task?.projectName}</p>

          <p className="project-page__description">
            <span className="project-page__description-label">Загружено: </span>
            <span>
              {review?.uploadedAt ? new Date(review.uploadedAt).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : '—'}
            </span>
          </p>

          <p className="project-page__description">
            <span className="project-page__description-label">Дедлайн: </span>
            <span className={`review-page__meta-value ${deadlineInfo?.colorClass || ''}`}>
              {deadlineInfo ? `${deadlineInfo.date} (${deadlineInfo.label})` : '—'}
            </span>
          </p>

          {assigneesToReveal && (
            <div className="task-page__assignees-wrap task-page__offset-section">
              <h3 className="project-page__description-label">Исполнители:</h3>
              <div className="task-page__assignees-list">
                {assigneesToReveal.map((assignee) => (
                  <div key={assignee.id} className="task-page__assignee-item">
                    <span className="task-page__assignee-avatar">
                      {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                    </span>
                    <span className="task-page__assignee-meta">
                      <span className="task-page__assignee-name">{assignee.fullName}</span>
                      <span className="task-page__assignee-login">@{assignee.login}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!assigneesToReveal && (
            <p className="project-page__description task-page__offset-section">
              <span className="project-page__description-label">Исполнители: </span>
              <span>Анонимно</span>
            </p>
          )}

          <div className="project-page__metrics">
            <div className="project-page__metric-item">
              <CommentIcon />
              <span>Комментариев: {commentsCount}</span>
            </div>
            <div className="project-page__metric-item">
              <img src={tasksCountIcon} alt="Открытые задачи" />
              <span>
                <span>Решены все комментарии: </span>
                <span className={`review-page__metric-value ${isAllResolved ? 'success' : 'error'}`}>
                  {isAllResolved ? 'Да' : 'Нет'}
                </span>
              </span>
            </div>
          </div>
        </section>

        <div className="review-page__workspace">
          <div className="review-page__col-left">
            <div className="review-page__card">
              <FileTree
                files={review.files}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
                commentedFiles={commentedFiles}
              />
            </div>
          </div>

          <div className="review-page__col-center">
            {fileContentLoading ? (
              <div className="review-page__loader" style={{ height: '400px' }}><Spinner /></div>
            ) : currentFileContent?.error ? (
              <div className="review-page__loader" style={{ height: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p>Ошибка загрузки файла</p>
                  <button className="btn-manual" onClick={() => fetchFileContent(selectedFile.path)}>Повторить</button>
                </div>
              </div>
            ) : (
              <CodeViewer
                key={selectedFile?.path}
                value={currentFileContent?.content || (selectedFile?.isDirectory ? '' : '')}
                language={getLanguageByFileName(selectedFile?.name)}
                isDiff={selectedFile?.isDiff || currentFileContent?.isDiff}
                originalValue={currentFileContent?.originalContent || ''}
                comments={fileComments}
                onLineClick={handleLineClick}
                onLineContextMenu={canAddNewComments ? handleLineContextMenu : undefined}
                canComment={canAddNewComments}
              />
            )}

            {isReviewer && !alreadySubmittedReview && !isCompleted && (
              <Suspense fallback={null}>
                <FinalReviewForm
                  onSubmit={handleFinalSubmit}
                  isSubmitting={isSubmitting}
                  allThreadsResolved={allThreadsResolved}
                  taskId={review.id}
                />
              </Suspense>
            )}

            {isReviewer && alreadySubmittedReview && !isCompleted && (
              <>
                <div className="review-page__card review-page__submitted-card">
                  <h3 className="review-page__card-title">Ревью отправлено</h3>
                  <p className="review-page__submitted-text">Вы уже отправили свой вердикт. Ожидайте завершения ревью другими участниками.</p>
                </div>
                <Suspense fallback={null}>
                  <FinalReviewForm
                    isReadOnly
                    isSubmitting={false}
                    taskId={review.id}
                    initialData={myFinalReview}
                  />
                </Suspense>
              </>
            )}

            {isCompleted && (
              <ReviewResultsSidebar
                review={review}
                showAssigneesName={showAssigneesName}
                aiReviewEnabled={Boolean(task?.aiReviewEnabled)}
              />
            )}
          </div>

          <div className="review-page__col-right">
            <CommentsBlock
              comments={displayedComments}
              currentUser={{ id: numericUserId }}
              onReply={canDiscussThreads ? handleReply : undefined}
              onLike={canDiscussThreads ? handleLike : undefined}
              onDislike={canDiscussThreads ? handleDislike : undefined}
              onDelete={canAddNewComments ? handleDeleteComment : undefined}
              onReport={canDiscussThreads ? openReportModal : undefined}
              onCloseThread={handleCloseThread}
              onReopenThread={canDiscussThreads ? handleReopenThread : undefined}
              readOnly={!canDiscussThreads}
              pageContext="review"
              title="Комментарии"
              emptyText="Выберите строку или диапазон строк с комментариями"
            />

            {myHistoryComments.length > 0 && (
              <CommentsBlock
                comments={myHistoryComments}
                currentUser={{ id: numericUserId }}
                readOnly
                isHistory
                pageContext="review"
                title="Комментарии с прошлых ревью"
              />
            )}
          </div>
        </div>
      </div>

      <ScrollToTopButton />

      <Suspense fallback={null}>
        {isReportModalOpen && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onSubmit={handleReportSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {isCommentModalOpen && (
          <CommentModal
            isOpen={isCommentModalOpen}
            onClose={() => setIsCommentModalOpen(false)}
            onSubmit={handleAddComment}
            isSubmitting={isCommentSubmitting}
            lineData={contextLineData}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ReviewPage;
