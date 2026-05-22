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
import { REVIEW_STATUS_LABEL, getDeadlineInfo } from '@/entities/review';
import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  useCompleteNotificationMutation,
} from '@/entities/notification';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { getLanguageByFileName, lazyNamed } from '@/shared/lib';
import { AvatarIcon, CommentIcon } from '@/shared/ui/icons';
import reviewPageStyles from './ReviewPage.module.scss';
import projectPageStyles from '../../project/ui/ProjectPage.module.scss';
import taskPageStyles from '../../task/ui/TaskPage.module.scss';
import solutionTabStyles from '../../../widgets/solution-workspace/ui/solution-tab/SolutionTab.module.scss';

const CommentModal = lazyNamed(() => import('@/features/comment-solution'), 'CommentModal');
const FinalReviewForm = lazyNamed(() => import('@/features/review-solution'), 'FinalReviewForm');
const ReportModal = lazyNamed(() => import('@/features/report-review'), 'ReportModal');

const ReviewPage = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { userId, user } = useAuth();
  const [task, setTask] = useState<LegacyValue>(null);
  const [review, setReview] = useState<LegacyValue>(null);
  const [loading, setLoading] = useState(true);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<LegacyValue>(null);
  const [selectedLineRange, setSelectedLineRange] = useState<LegacyValue>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [contextLineData, setContextLineData] = useState<LegacyValue>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<LegacyValue>(null);
  const [completeNotification] = useCompleteNotificationMutation();
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentMap, setFileContentMap] = useState<LegacyValue>({});
  const numericUserId = Number(userId);
  const isAdmin = user?.role === 'ADMIN';

  const findFileByPath = useCallback((nodes: LegacyValue, path: LegacyValue): LegacyValue => {
    for (const node of nodes) {
      if (node.path === path) return node;

      if (node.children) {
        const found: LegacyValue = findFileByPath(node.children, path);
        if (found) return found;
      }
    }

    return null;
  }, []);

  const loadData = useCallback(async () => {
    const findFirstFileInternal = (nodes: LegacyValue): LegacyValue => {
      for (const node of nodes) {
        if (!node.isDirectory) return node;

        if (node.children) {
          const found: LegacyValue = findFirstFileInternal(node.children);
          if (found) return found;
        }
      }

      return null;
    };

    try {
      const reviewData = await projectsApi.getReviewById(reviewId);

      if (!reviewData) {
        navigate(ROUTES.reviews, {
          replace: true,
        });

        return;
      }

      setReview(reviewData);

      const [taskData] = await Promise.all([
        projectsApi.getTaskById(reviewData.projectId, reviewData.taskId),
        projectsApi.getProjectById(reviewData.projectId),
      ]);

      setTask(taskData);
      const isUserReviewer = taskData.reviewerIds?.includes(numericUserId);

      if (!isUserReviewer && !isAdmin) {
        navigate(ROUTES.reviews, {
          replace: true,
          state: {
            snackbarMessage: 'У вас нет доступа к этому ревью',
            snackbarType: reviewPageStyles.isError,
          },
        });

        return;
      }

      if (reviewData.files?.length > 0) {
        setSelectedFile((prev: LegacyValue) => {
          if (prev) {
            const stillExists = findFileByPath(reviewData.files, prev.path);
            if (stillExists) return stillExists;
          }

          const firstFile = findFirstFileInternal(reviewData.files);

          return firstFile || reviewData.files[0];
        });
      }
    } catch (err: LegacyValue) {
      console.error('Review data load error:', err);
      showSnackbar('Ошибка загрузки данных ревью', reviewPageStyles.isError);
    } finally {
      setLoading(false);
    }
  }, [reviewId, navigate, findFileByPath, isAdmin, numericUserId, showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchFileContent = useCallback(
    async (filePath: LegacyValue) => {
      if (fileContentMap[filePath] && !fileContentMap[filePath].error) return;
      setFileContentLoading(true);

      try {
        const data = await projectsApi.getReviewFileContent(reviewId, filePath);

        setFileContentMap((prev: LegacyValue) => ({
          ...prev,
          [filePath]: data,
        }));
      } catch (err: LegacyValue) {
        console.error('Failed to fetch file content:', err);

        setFileContentMap((prev: LegacyValue) => ({
          ...prev,
          [filePath]: {
            error: true,
          },
        }));

        showSnackbar('Ошибка загрузки содержимого файла', reviewPageStyles.isError);
      } finally {
        setFileContentLoading(false);
      }
    },
    [reviewId, fileContentMap, showSnackbar]
  );

  const handleSelectFile = useCallback(
    (file: LegacyValue) => {
      setSelectedFile(file);
      setSelectedLineRange(null);

      if (!file.isDirectory) {
        fetchFileContent(file.path);
      }
    },
    [fetchFileContent]
  );

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

  const myFinalReview = useMemo(
    () => (review?.finalReviews || []).find((fr: LegacyValue) => fr.reviewerId === numericUserId),
    [review?.finalReviews, numericUserId]
  );

  const alreadySubmittedReview = !!myFinalReview;
  const isReadOnlyMode = alreadySubmittedReview || isCompleted;
  const canAddNewComments = isReviewer && !isReadOnlyMode;
  const canDiscussThreads = isReviewer && (isCompleted || (!alreadySubmittedReview && !isCompleted));
  const taskId = review?.taskId;

  const handleLineContextMenu = useCallback(
    (data: LegacyValue) => {
      if (!canAddNewComments) return;

      setContextLineData({
        startLine: data.startLineNumber,
        endLine: data.endLineNumber,
      });

      setIsCommentModalOpen(true);
    },
    [canAddNewComments]
  );

  const handleLineClick = useCallback((range: LegacyValue) => {
    setSelectedLineRange(range);
  }, []);

  const handleAddComment = async ({ text, category, severity }: LegacyValue) => {
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
        createdAt: new Date().toISOString(),
      });

      await loadData();
      setIsCommentModalOpen(false);
      showSnackbar('Комментарий добавлен', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка отправки комментария. Попробуйте позже.', reviewPageStyles.isError);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReply = async (commentId: LegacyValue, text: LegacyValue) => {
    try {
      await projectsApi.replyToReviewComment(taskId, commentId, {
        authorId: numericUserId,
        authorName: 'Вы',
        authorRole: 'Reviewer',
        text,
        createdAt: new Date().toISOString(),
      });

      await loadData();
      showSnackbar('Ответ отправлен', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка отправки ответа. Попробуйте позже.', reviewPageStyles.isError);
    }
  };

  const handleLike = async (commentId: LegacyValue) => {
    try {
      await projectsApi.toggleCommentLike(taskId, commentId, numericUserId, false);
      await loadData();
    } catch (err: LegacyValue) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = useCallback(
    async (commentId: LegacyValue) => {
      try {
        await projectsApi.toggleCommentLike(taskId, commentId, numericUserId, true);
        await loadData();
      } catch (err: LegacyValue) {
        console.error('Dislike error:', err);
      }
    },
    [taskId, numericUserId, loadData]
  );

  const handleDeleteComment = async (commentId: LegacyValue) => {
    try {
      await projectsApi.deleteReviewComment(taskId, commentId);
      await loadData();
      showSnackbar('Комментарий удален', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка удаления комментария', reviewPageStyles.isError);
    }
  };

  const handleCloseThread = async (commentId: LegacyValue) => {
    try {
      await projectsApi.closeCommentThread(taskId, commentId, 'close');
      await loadData();
      showSnackbar('Тред закрыт', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка закрытия треда', reviewPageStyles.isError);
    }
  };

  const handleReopenThread = async (commentId: LegacyValue) => {
    try {
      await projectsApi.closeCommentThread(taskId, commentId, 'open');
      await loadData();
      showSnackbar('Тред переоткрыт', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка открытия треда', reviewPageStyles.isError);
    }
  };

  const handleFinalSubmit = async (payload: LegacyValue) => {
    setIsSubmitting(true);

    try {
      await projectsApi.submitFinalReview(taskId, {
        ...payload,
        reviewerId: numericUserId,
        reviewerName: 'Вы',
      });

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_REVIEW_RESULT,
        target: {
          kind: NOTIFICATION_TARGET_KIND.REVIEW,
          reviewId: Number(reviewId),
          taskId,
        },
      });

      await loadData();
      showSnackbar('Результаты ревью успешно сохранены', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка сохранения результатов ревью. Попробуйте позже.', reviewPageStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (reason: LegacyValue, comment: LegacyValue) => {
    setIsSubmitting(true);

    try {
      await projectsApi.reportComment(taskId, reportingCommentId, {
        reason,
        comment,
      });

      setIsReportModalOpen(false);
      showSnackbar('Жалоба отправлена', reviewPageStyles.success);
    } catch {
      showSnackbar('Не удалось отправить жалобу', reviewPageStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReportModal = (commentId: LegacyValue) => {
    setReportingCommentId(commentId);
    setIsReportModalOpen(true);
  };

  const allComments = useMemo(() => review?.comments || [], [review?.comments]);

  const visibleComments = useMemo(
    () =>
      task?.aiReviewEnabled ? allComments : allComments.filter((comment: LegacyValue) => comment.authorRole !== 'AI'),
    [allComments, task?.aiReviewEnabled]
  );

  const fileComments = visibleComments.filter((c: LegacyValue) => c.file === selectedFile?.path);
  const commentedFiles = [...new Set(visibleComments.map((c: LegacyValue) => c.file))];

  const displayedComments = selectedLineRange
    ? fileComments.filter(
        (c: LegacyValue) => c.startLine === selectedLineRange.startLine && c.endLine === selectedLineRange.endLine
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
    const allApproved = finalReviews.length > 0 && finalReviews.every((fr: LegacyValue) => fr.verdict === 'APPROVED');
    const shouldReveal = review?.revealAuthorAfterReview;

    if (isCompletedStatus && allApproved && shouldReveal) {
      return task.assignees;
    }

    return null;
  }, [isAdminReadOnlyView, task?.assignees, review?.status, review?.finalReviews, review?.revealAuthorAfterReview]);

  const commentsCount = visibleComments.length;

  const humanComments = useMemo(
    () => visibleComments.filter((c: LegacyValue) => c.authorRole !== 'AI'),
    [visibleComments]
  );

  const isAllResolved = useMemo(
    () => humanComments.length > 0 && humanComments.every((c: LegacyValue) => c.isClosed),
    [humanComments]
  );

  const allThreadsResolved = isAllResolved;

  const myHistoryComments = useMemo(() => {
    if (!review?.history) return [];

    return review.history
      .flatMap((h: LegacyValue) => h.comments || [])
      .filter((c: LegacyValue) => c.authorId === numericUserId);
  }, [review?.history, numericUserId]);

  const deadlineInfo = useMemo(() => {
    if (!review?.deadline) return null;
    const info = getDeadlineInfo(review.deadline, review.status, review.reviewedAt);
    let colorClass = reviewPageStyles.isPending;

    if (info?.isOverdue) {
      colorClass = reviewPageStyles.deadlineError;
    } else if (review.status === 'COMPLETED') {
      colorClass = reviewPageStyles.isSuccess;
    } else {
      colorClass = reviewPageStyles.isWarning;
    }

    return {
      ...info,
      colorClass,
    };
  }, [review?.deadline, review?.status, review?.reviewedAt]);

  if (loading) {
    return (
      <div className={reviewPageStyles.root}>
        <div className={reviewPageStyles.loader}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!task || !review) {
    return (
      <div className={reviewPageStyles.root}>
        <div className={reviewPageStyles.loader}>Данные не найдены</div>
      </div>
    );
  }

  const currentFileContent = fileContentMap[selectedFile?.path];

  return (
    <div className={reviewPageStyles.root}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <div className={[projectPageStyles.content, reviewPageStyles.content2].join(' ')}>
        <section className={[projectPageStyles.info, reviewPageStyles.sectionCard].join(' ')}>
          <div className={projectPageStyles.titleRow}>
            <div className={projectPageStyles.titleWrap}>
              <h1 className={projectPageStyles.title}>{task?.name}</h1>
            </div>
            <span className={projectPageStyles.roleTag}>{REVIEW_STATUS_LABEL[review?.status]}</span>
          </div>

          <p className={projectPageStyles.organization}>{task?.projectName}</p>

          <p className={projectPageStyles.description}>
            <span className={projectPageStyles.descriptionLabel}>Загружено: </span>
            <span>
              {review?.uploadedAt
                ? new Date(review.uploadedAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
          </p>

          <p className={projectPageStyles.description}>
            <span className={projectPageStyles.descriptionLabel}>Дедлайн: </span>
            <span className={[reviewPageStyles.metaValue, deadlineInfo?.colorClass || ''].filter(Boolean).join(' ')}>
              {deadlineInfo ? `${deadlineInfo.date} (${deadlineInfo.label})` : '—'}
            </span>
          </p>

          {assigneesToReveal && (
            <div className={[taskPageStyles.assigneesWrap, taskPageStyles.offsetSection].join(' ')}>
              <h3 className={projectPageStyles.descriptionLabel}>Исполнители:</h3>
              <div className={taskPageStyles.assigneesList}>
                {assigneesToReveal.map((assignee: LegacyValue) => (
                  <div key={assignee.id} className={taskPageStyles.assigneeItem}>
                    <span className={taskPageStyles.assigneeAvatar}>
                      {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                    </span>
                    <span className={taskPageStyles.assigneeMeta}>
                      <span className={taskPageStyles.assigneeName}>{assignee.fullName}</span>
                      <span className={taskPageStyles.assigneeLogin}>@{assignee.login}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!assigneesToReveal && (
            <p className={[projectPageStyles.description, taskPageStyles.offsetSection].join(' ')}>
              <span className={projectPageStyles.descriptionLabel}>Исполнители: </span>
              <span>Анонимно</span>
            </p>
          )}

          <div className={projectPageStyles.metrics}>
            <div className={projectPageStyles.metricItem}>
              <CommentIcon />
              <span>Комментариев: {commentsCount}</span>
            </div>
            <div className={projectPageStyles.metricItem}>
              <img src={tasksCountIcon} alt="Открытые задачи" />
              <span>
                <span>Решены все комментарии: </span>
                <span
                  className={[
                    reviewPageStyles.metricValue,
                    isAllResolved ? reviewPageStyles.success : reviewPageStyles.isError,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isAllResolved ? 'Да' : 'Нет'}
                </span>
              </span>
            </div>
          </div>
        </section>

        <div className={reviewPageStyles.workspace}>
          <div className={reviewPageStyles.colLeft}>
            <div className={reviewPageStyles.card}>
              <FileTree
                files={review.files}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
                commentedFiles={commentedFiles}
              />
            </div>
          </div>

          <div className={reviewPageStyles.colCenter}>
            {fileContentLoading ? (
              <div
                className={reviewPageStyles.loader}
                style={{
                  height: '400px',
                }}
              >
                <Spinner />
              </div>
            ) : currentFileContent?.error ? (
              <div
                className={reviewPageStyles.loader}
                style={{
                  height: '400px',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <p>Ошибка загрузки файла</p>
                  <button
                    className={solutionTabStyles.manualButton}
                    onClick={() => fetchFileContent(selectedFile.path)}
                  >
                    Повторить
                  </button>
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
                <div className={[reviewPageStyles.card, reviewPageStyles.submittedCard].join(' ')}>
                  <h3 className={reviewPageStyles.cardTitle}>Ревью отправлено</h3>
                  <p className={reviewPageStyles.submittedText}>
                    Вы уже отправили свой вердикт. Ожидайте завершения ревью другими участниками.
                  </p>
                </div>
                <Suspense fallback={null}>
                  <FinalReviewForm isReadOnly isSubmitting={false} taskId={review.id} initialData={myFinalReview} />
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

          <div className={reviewPageStyles.colRight}>
            <CommentsBlock
              comments={displayedComments}
              currentUser={{
                id: numericUserId,
              }}
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
                currentUser={{
                  id: numericUserId,
                }}
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
