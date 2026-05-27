import { type ChangeEvent, lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { taskApi, type SubmitSolutionPayload, type Task } from '@/entities/task';
import {
  reviewApi,
  useGetAssignedReviewsQuery,
  type ReportReason,
  type ReviewComment,
  type ReviewDetail,
  type ReviewFile,
} from '@/entities/review';
import type { EntityId } from '@/entities/project';
import type { User } from '@/entities/user';
import type { SolutionUploadPayload } from '@/features/upload-solution';
import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  useCompleteNotificationMutation,
} from '@/entities/notification';
import { ROUTES } from '@/shared/config/routes';
import FileTree, { type FileTreeItem } from '@/shared/ui/file-tree';
import CodeViewer from '@/shared/ui/code-viewer';
import { CommentsBlock } from '@/widgets/solution-workspace';
import { ReviewResultsSidebar } from '@/widgets/review-workspace';
import ScrollToTopButton from '@/shared/ui/scroll-to-top-button';
import Spinner from '@/shared/ui/spinner';
import { getLanguageByFileName } from '@/shared/lib';
import solutionTabStyles from './SolutionTab.module.scss';

const ReportModal = lazy(() =>
  import('@/features/report-review').then(({ ReportModal }) => ({ default: ReportModal }))
);

const SolutionUploadModal = lazy(() =>
  import('@/features/upload-solution').then(({ SolutionUploadModal }) => ({ default: SolutionUploadModal }))
);

interface SelectedLineRange {
  startLine: number;
  endLine: number;
}

interface LoadedReviewFile {
  content?: string;
  originalContent?: string;
  isDiff?: boolean;
  error?: boolean;
}

const sortReviewFilesByName = (nodes: readonly ReviewFile[]): ReviewFile[] =>
  [...nodes]
    .sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }

      return a.isDirectory ? -1 : 1;
    })
    .map((node) => ({
      ...node,
      ...(node.children ? { children: sortReviewFilesByName(node.children) } : {}),
    }));

const findFirstFileInSortedTree = (nodes: readonly ReviewFile[]): ReviewFile | null => {
  for (const node of sortReviewFilesByName(nodes)) {
    if (!node.isDirectory) return node;

    if (node.children) {
      const found = findFirstFileInSortedTree(node.children);
      if (found) return found;
    }
  }

  return null;
};

interface SolutionTabProps {
  task: Task;
  currentUser: User;
  aiReviewEnabled?: boolean;
  onSnackbar?: (message: string, type: string) => void;
  onTaskUpdated?: () => void | Promise<void>;
  readOnly?: boolean;
}

const toSubmitSolutionPayload = (
  payload: SolutionUploadPayload,
  revealAuthorAfterReview: boolean
): SubmitSolutionPayload | null => {
  if (payload.type === 'manual') {
    return {
      uploadType: payload.uploadType,
      manualCode: payload.manualCode,
      revealAuthorAfterReview,
    };
  }

  if (payload.type === 'git') {
    return {
      uploadType: payload.uploadType,
      git: payload.git,
      revealAuthorAfterReview,
    };
  }

  return null;
};

const hasLineLocation = (
  comment: ReviewComment
): comment is ReviewComment & { file: string; startLine: number; endLine: number } =>
  comment.file !== undefined && comment.startLine !== undefined && comment.endLine !== undefined;

const SolutionTab = ({
  task,
  currentUser,
  aiReviewEnabled,
  onSnackbar,
  onTaskUpdated,
  readOnly = false,
}: SolutionTabProps) => {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);
  const [selectedLineRange, setSelectedLineRange] = useState<SelectedLineRange | null>(null);
  const [revealName, setRevealName] = useState(false);
  const [isVisibilityUpdating, setIsVisibilityUpdating] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<EntityId | null>(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentMap, setFileContentMap] = useState<Record<string, LoadedReviewFile>>({});
  const [completeNotification] = useCompleteNotificationMutation();
  const isAssignee = !readOnly && Boolean(task.assigneeIds?.includes(currentUser.id));
  const isRealTaskReviewer = !task.isMock && !readOnly && Boolean(task.reviewerIds?.includes(currentUser.id));

  const {
    data: assignedReviews = [],
    isFetching: isAssignedReviewsFetching,
    isError: isAssignedReviewsError,
  } = useGetAssignedReviewsQuery(
    {
      viewerId: currentUser.id,
    },
    {
      skip: !isRealTaskReviewer,
    }
  );

  const assignedTaskReview = assignedReviews.find(
    (assignedReview) => Number(assignedReview.taskId) === Number(task.id)
  );

  const showSnackbar = useCallback(
    (message: string, type: string = solutionTabStyles.isSuccess) => {
      if (onSnackbar) onSnackbar(message, type);
    },
    [onSnackbar]
  );

  const loadReview = useCallback(async () => {
    if (task.isMock || isRealTaskReviewer || task.status === 'IN_PROGRESS') {
      setReview(null);
      setLoading(false);

      return;
    }

    try {
      const data = await reviewApi.getReviewByTaskId(task.id);
      setReview(data);
      setRevealName(Boolean(data?.revealAuthorAfterReview));

      if (data?.files?.length > 0) {
        const firstFile = findFirstFileInSortedTree(data.files);
        setSelectedFile(firstFile ?? null);
      } else {
        setSelectedFile(null);
      }
    } catch (err: unknown) {
      console.error('Load review error:', err);
      showSnackbar('Ошибка загрузки данных решения', solutionTabStyles.isError);
    } finally {
      setLoading(false);
    }
  }, [task.id, task.isMock, task.status, isRealTaskReviewer, showSnackbar]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const fetchFileContent = useCallback(
    async (filePath: string) => {
      if (fileContentMap[filePath] && !fileContentMap[filePath].error) return;
      setFileContentLoading(true);

      try {
        const data = await reviewApi.getReviewFileContent(review?.id || task.id, filePath);

        setFileContentMap((prev) => ({
          ...prev,
          [filePath]: data,
        }));
      } catch (err: unknown) {
        console.error('Failed to fetch file content:', err);

        setFileContentMap((prev) => ({
          ...prev,
          [filePath]: {
            error: true,
          },
        }));
      } finally {
        setFileContentLoading(false);
      }
    },
    [task.id, review?.id, fileContentMap]
  );

  const handleSelectFile = useCallback(
    (file: FileTreeItem) => {
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

  const handleUploadSubmit = async (payload: SolutionUploadPayload) => {
    const requestPayload = toSubmitSolutionPayload(payload, revealName);

    if (requestPayload === null) {
      showSnackbar('Этот способ отправки пока не поддерживается API', solutionTabStyles.isError);

      return;
    }

    setIsSubmitting(true);

    try {
      await taskApi.submitSolution(task.id, requestPayload);

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id,
        },
      });

      await onTaskUpdated?.();

      setIsUploadModalOpen(false);
      showSnackbar('Решение успешно отправлено на ревью');
    } catch {
      showSnackbar('Возникла непредвиденная ошибка. Попробуйте еще раз.', solutionTabStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async (payload: SolutionUploadPayload) => {
    const requestPayload = toSubmitSolutionPayload(payload, revealName);

    if (requestPayload === null) {
      showSnackbar('Этот способ отправки пока не поддерживается API', solutionTabStyles.isError);

      return;
    }

    setIsSubmitting(true);

    try {
      await taskApi.resubmitSolution(task.id, requestPayload);

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id,
        },
      });

      await onTaskUpdated?.();

      setIsUploadModalOpen(false);
      showSnackbar('Решение переотправлено на ревью');
    } catch {
      showSnackbar('Ошибка при переотправке', solutionTabStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishReview = async () => {
    try {
      await taskApi.finishReview(task.id);

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.ACCEPT_REVIEW_RESULT,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id,
        },
      });

      await onTaskUpdated?.();

      showSnackbar('Ревью завершено');
    } catch {
      showSnackbar('Ошибка завершения ревью', solutionTabStyles.isError);
    }
  };

  const handleReply = useCallback(
    async (commentId: EntityId, text: string) => {
      try {
        await reviewApi.replyToReviewComment(task.id, commentId, {
          authorId: currentUser.id,
          authorName: currentUser.fullName || 'Вы',
          text,
          createdAt: new Date().toISOString(),
          authorRole: 'Assignee',
        });

        await loadReview();
        showSnackbar('Ответ отправлен');
      } catch {
        showSnackbar('Ошибка отправки ответа. Попробуйте позже.', solutionTabStyles.isError);
      }
    },
    [task.id, currentUser.id, currentUser.fullName, loadReview, showSnackbar]
  );

  const handleLike = async (commentId: EntityId) => {
    try {
      await reviewApi.toggleCommentLike(review?.id || task.id, commentId, currentUser.id, false);
      await loadReview();
    } catch (err: unknown) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = useCallback(
    async (commentId: EntityId) => {
      try {
        await reviewApi.toggleCommentLike(review?.id || task.id, commentId, currentUser.id, true);
        await loadReview();
      } catch (err: unknown) {
        console.error('Dislike error:', err);
      }
    },
    [task.id, review?.id, currentUser.id, loadReview]
  );

  const handleDeleteComment = async (commentId: EntityId) => {
    try {
      await reviewApi.deleteReviewComment(review?.id || task.id, commentId);
      await loadReview();
      showSnackbar('Комментарий удалён');
    } catch {
      showSnackbar('Ошибка удаления', solutionTabStyles.isError);
    }
  };

  const handleCloseThread = async (commentId: EntityId) => {
    try {
      await reviewApi.closeCommentThread(review?.id || task.id, commentId, 'close');
      await loadReview();
      showSnackbar('Тред закрыт');
    } catch {
      showSnackbar('Ошибка закрытия треда', solutionTabStyles.isError);
    }
  };

  const handleReportSubmit = async (reason: ReportReason, comment: string) => {
    if (reportingCommentId === null) {
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewApi.reportComment(review?.id || task.id, reportingCommentId, {
        reason,
        comment,
      });

      setIsReportModalOpen(false);
      showSnackbar('Жалоба отправлена');
    } catch {
      showSnackbar('Не удалось отправить жалобу', solutionTabStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReportModal = (commentId: EntityId) => {
    setReportingCommentId(commentId);
    setIsReportModalOpen(true);
  };

  const handleResend = async () => {
    setIsSubmitting(true);

    try {
      await taskApi.resendSolution(task.id, task.reviewerIds ?? []);
      await onTaskUpdated?.();
      showSnackbar('Решение переотправлено на ревью');
    } catch {
      showSnackbar('Ошибка при переотправке', solutionTabStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLineClick = (range: SelectedLineRange) => {
    setSelectedLineRange(range);
  };

  const handleVisibilityChange = async (checked: boolean) => {
    if (!review?.solutionId) {
      showSnackbar('Не удалось определить решение для изменения настройки', solutionTabStyles.isError);

      return;
    }

    const previousValue = revealName;
    setRevealName(checked);
    setIsVisibilityUpdating(true);

    try {
      await taskApi.updateAuthorVisibility(review.solutionId, checked);

      setReview((currentReview) =>
        currentReview
          ? {
              ...currentReview,
              revealAuthorAfterReview: checked,
            }
          : null
      );
    } catch {
      setRevealName(previousValue);
      showSnackbar('Не удалось изменить настройку раскрытия имени', solutionTabStyles.isError);
    } finally {
      setIsVisibilityUpdating(false);
    }
  };

  const isNotUploaded = !review;
  const canUploadInitialSolution = !task.isMock && isNotUploaded && task.status === 'IN_PROGRESS';
  const isWaiting = task.status === 'IN_REVIEW';
  const isCompleted = task.status === 'DONE';
  const isRework = task.status === 'REWORK';

  const isExpiredWithoutReview = useMemo(
    () =>
      isWaiting &&
      !task.canFinishReview &&
      review?.deadline &&
      new Date(review.deadline) < new Date() &&
      review.reviewType !== 'AI_ONLY',
    [isWaiting, review?.deadline, review?.reviewType, task.canFinishReview]
  );

  const allComments = useMemo(() => review?.comments || [], [review?.comments]);

  const visibleComments = useMemo(
    () => (aiReviewEnabled ? allComments : allComments.filter((comment) => comment.authorRole !== 'AI')),
    [aiReviewEnabled, allComments]
  );

  const hasReviewResults = isCompleted || isRework;
  const showExpiredAiResults = isExpiredWithoutReview && aiReviewEnabled;
  const showCodeComments = hasReviewResults || showExpiredAiResults;
  const shouldShowFinishReview = isWaiting && Boolean(task.canFinishReview);
  const shouldShowWaitingState = isWaiting && !isExpiredWithoutReview && !task.canFinishReview;

  const fileComments = useMemo(
    () => visibleComments.filter((comment) => hasLineLocation(comment) && comment.file === selectedFile?.path),
    [visibleComments, selectedFile?.path]
  );

  const displayedComments = useMemo(
    () =>
      selectedLineRange
        ? fileComments.filter(
            (comment) =>
              comment.startLine === selectedLineRange.startLine && comment.endLine === selectedLineRange.endLine
          )
        : [],
    [fileComments, selectedLineRange]
  );

  const commentedFiles = useMemo(
    () => [...new Set(visibleComments.flatMap((comment) => (comment.file ? [comment.file] : [])))],
    [visibleComments]
  );

  const historyComments = useMemo(
    () => review?.history?.flatMap((historyItem) => historyItem.comments) ?? [],
    [review?.history]
  );

  if (loading) {
    return (
      <div className={solutionTabStyles.loading}>
        <Spinner />
      </div>
    );
  }

  const fileTreeData = review?.files || [];
  const currentFileContent = selectedFile ? fileContentMap[selectedFile.path] : undefined;
  const codeContent = currentFileContent?.content ?? '';
  const originalCodeContent = currentFileContent?.originalContent ?? '';
  const hasHistoryComments = historyComments.length > 0;
  const aiFileComments = fileComments.filter((comment) => comment.authorRole === 'AI');

  const revealedReviewers = isCompleted
    ? (review?.finalReviews.filter((finalReview) => finalReview.revealName) ?? [])
    : [];

  return (
    <div className={solutionTabStyles.root}>
      {isRealTaskReviewer && (
        <div className={solutionTabStyles.uploadBlock}>
          <div className={solutionTabStyles.uploadText}>Вы являетесь ревьюером этой задачи</div>
          {assignedTaskReview && (
            <Link
              className={solutionTabStyles.manualButton}
              to={ROUTES.reviewById.replace(':reviewId', String(assignedTaskReview.id))}
            >
              Перейти на ревью
            </Link>
          )}
          {!assignedTaskReview && isAssignedReviewsFetching && <Spinner />}
          {!assignedTaskReview && !isAssignedReviewsFetching && !isAssignedReviewsError && (
            <div className={solutionTabStyles.cardText}>Ревью появится после отправки решения</div>
          )}
          {!assignedTaskReview && isAssignedReviewsError && (
            <div className={[solutionTabStyles.cardText, solutionTabStyles.cardTextError].join(' ')}>
              Не удалось получить ссылку на ревью
            </div>
          )}
        </div>
      )}

      {!isRealTaskReviewer && canUploadInitialSolution && isAssignee && (
        <div className={solutionTabStyles.uploadBlock}>
          <div className={solutionTabStyles.uploadText}>Загрузите решение задачи</div>
          <div className={solutionTabStyles.uploadActions}>
            <button className={solutionTabStyles.manualButton} type="button" onClick={() => setIsUploadModalOpen(true)}>
              Загрузить
            </button>
          </div>
        </div>
      )}

      {!isRealTaskReviewer && canUploadInitialSolution && !isAssignee && (
        <div className={solutionTabStyles.uploadBlock}>
          <div className={solutionTabStyles.uploadText}>Решение ещё не загружено</div>
        </div>
      )}

      {!isRealTaskReviewer && isNotUploaded && (task.isMock || task.status !== 'IN_PROGRESS') && (
        <div className={solutionTabStyles.uploadBlock}>
          <div className={solutionTabStyles.uploadText}>
            {task.isMock ? 'Для демонстрационной задачи ревью недоступно' : 'Данные решения временно недоступны'}
          </div>
        </div>
      )}

      {!isRealTaskReviewer && review && (isWaiting || isCompleted || isRework) && (
        <>
          <div className={solutionTabStyles.content}>
            <div className={solutionTabStyles.colLeft}>
              <div className={solutionTabStyles.fileTreeCard}>
                <FileTree
                  files={fileTreeData}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  commentedFiles={showCodeComments ? commentedFiles : []}
                />
              </div>
            </div>

            <div className={solutionTabStyles.colCenter}>
              {fileContentLoading ? (
                <div
                  className={solutionTabStyles.loader}
                  style={{
                    height: '400px',
                  }}
                >
                  <Spinner />
                </div>
              ) : currentFileContent?.error ? (
                <div
                  className={solutionTabStyles.loader}
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
                      onClick={() => selectedFile && fetchFileContent(selectedFile.path)}
                    >
                      Повторить
                    </button>
                  </div>
                </div>
              ) : (
                <CodeViewer
                  key={selectedFile?.path}
                  value={codeContent}
                  filePath={selectedFile?.path ?? ''}
                  language={getLanguageByFileName(selectedFile?.name)}
                  isDiff={currentFileContent?.isDiff === true}
                  originalValue={originalCodeContent}
                  comments={showCodeComments ? fileComments : []}
                  onLineClick={handleLineClick}
                  canComment={false}
                />
              )}

              {(hasReviewResults || showExpiredAiResults) && (
                <div className={solutionTabStyles.underCode}>
                  <ReviewResultsSidebar
                    review={review}
                    aiReviewEnabled={Boolean(aiReviewEnabled)}
                    canRevealReviewerNames={isCompleted}
                  />
                </div>
              )}
            </div>

            <div className={solutionTabStyles.colRight}>
              <>
                {isRework && isAssignee && (
                  <div className={solutionTabStyles.card}>
                    <h3 className={solutionTabStyles.cardTitle}>Отправить на проверку</h3>
                    <div className={solutionTabStyles.uploadActions}>
                      <button
                        className={solutionTabStyles.manualButton}
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        Загрузить
                      </button>
                    </div>
                  </div>
                )}

                {isExpiredWithoutReview && isAssignee && (
                  <div className={solutionTabStyles.card}>
                    <div className={[solutionTabStyles.cardText, solutionTabStyles.cardTextError].join(' ')}>
                      Ни один назначенный ревьюер не выполнил ревью
                    </div>
                    <button
                      className={solutionTabStyles.finishButton}
                      type="button"
                      onClick={handleResend}
                      style={{
                        marginTop: 20,
                      }}
                    >
                      Переотправить
                    </button>
                  </div>
                )}

                {shouldShowWaitingState && isAssignee && (
                  <div className={solutionTabStyles.card}>
                    <label
                      className={solutionTabStyles.checkboxLabel}
                      style={{
                        marginBottom: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={revealName}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVisibilityChange(event.target.checked)
                        }
                        disabled={isVisibilityUpdating}
                      />
                      Раскрыть моё имя ревьюерам после завершения ревью
                    </label>
                    <div className={solutionTabStyles.waitingText}>Ожидание ревью</div>
                  </div>
                )}

                {shouldShowFinishReview && isAssignee && (
                  <div className={solutionTabStyles.card}>
                    <button className={solutionTabStyles.finishButton} type="button" onClick={handleFinishReview}>
                      Завершить ревью
                    </button>
                  </div>
                )}

                {isExpiredWithoutReview && aiReviewEnabled && aiFileComments.length > 0 && (
                  <CommentsBlock
                    comments={aiFileComments}
                    currentUser={currentUser}
                    onLike={isAssignee ? handleLike : undefined}
                    onDislike={isAssignee ? handleDislike : undefined}
                    readOnly
                    pageContext="task"
                    title="AI-комментарии"
                  />
                )}

                {showCodeComments && (
                  <>
                    {hasReviewResults && revealedReviewers.length > 0 && (
                      <div className={solutionTabStyles.reviewersNames}>
                        <h3 className={solutionTabStyles.reviewersTitle}>Ревьюеры</h3>
                        <div className={solutionTabStyles.reviewersList}>
                          {revealedReviewers.map((fr) =>
                            fr.reviewerId !== null && fr.reviewerId !== undefined ? (
                              <Link
                                className={solutionTabStyles.reviewerName}
                                key={fr.id || fr.reviewerId}
                                to={ROUTES.profileByUserId.replace(':userId', String(fr.reviewerId))}
                              >
                                {fr.reviewerName}
                              </Link>
                            ) : (
                              <span className={solutionTabStyles.reviewerName} key={fr.id || fr.reviewerName}>
                                {fr.reviewerName}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    <CommentsBlock
                      comments={displayedComments}
                      currentUser={currentUser}
                      onReply={isAssignee && (isRework || isCompleted) ? handleReply : undefined}
                      onLike={isAssignee ? handleLike : undefined}
                      onDislike={isAssignee ? handleDislike : undefined}
                      onDelete={isAssignee ? handleDeleteComment : undefined}
                      onReport={isAssignee ? openReportModal : undefined}
                      onCloseThread={isAssignee && hasReviewResults ? handleCloseThread : undefined}
                      readOnly={!isAssignee}
                      pageContext="task"
                      emptyText="Выберите строку или диапазон строк с комментариями"
                    />
                  </>
                )}

                {(isWaiting || isRework || isCompleted) && hasHistoryComments && (
                  <CommentsBlock
                    comments={historyComments}
                    currentUser={currentUser}
                    readOnly
                    isHistory
                    pageContext="task"
                    title="Комментарии с прошлых ревью"
                  />
                )}
              </>
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        {isUploadModalOpen && (
          <SolutionUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSubmit={isRework ? handleResubmit : handleUploadSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {isReportModalOpen && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onSubmit={handleReportSubmit}
            isSubmitting={isSubmitting}
            allowIncorrectTechnicalReason={task.organizationId != null}
          />
        )}
      </Suspense>

      <ScrollToTopButton />
    </div>
  );
};

export default SolutionTab;
