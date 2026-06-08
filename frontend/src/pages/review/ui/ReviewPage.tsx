import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import tasksCountIcon from '@/shared/assets/tasks-count-icon.svg';
import FileTree, { type FileTreeItem } from '@/shared/ui/file-tree';
import CodeViewer from '@/shared/ui/code-viewer';
import { CommentsBlock } from '@/widgets/solution-workspace';
import { ReviewResultsSidebar } from '@/widgets/review-workspace';
import ScrollToTopButton from '@/shared/ui/scroll-to-top-button';
import { taskApi, type Task } from '@/entities/task';
import type { TaskReviewType } from '@/entities/project';
import {
  REVIEW_STATUS,
  reviewApi,
  useInvalidateReviewMutation,
  type ReportReason,
  type ReviewDetail,
  type ReviewFile,
} from '@/entities/review';
import type { EntityId } from '@/entities/project';
import type { CommentPayload } from '@/features/comment-solution';
import type { FinalReviewSubmitPayload } from '@/features/review-solution';
import { ROUTES } from '@/shared/config/routes';
import { REVIEW_STATUS_LABEL, getDeadlineInfo } from '@/entities/review';
import { PROJECT_MEMBER_ROLE, PROJECT_PRIVACY, TASK_STATUS } from '@/entities/project';
import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  useCompleteNotificationMutation,
} from '@/entities/notification';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { getLanguageByFileName } from '@/shared/lib';
import { AvatarIcon, CommentIcon } from '@/shared/ui/icons';
import reviewPageStyles from './ReviewPage.module.scss';
import {
  detailLayoutStyles as projectPageStyles,
  taskDetailLayoutStyles as taskPageStyles,
} from '@/widgets/detail-layout';
import solutionTabStyles from '../../../widgets/solution-workspace/ui/solution-tab/SolutionTab.module.scss';

const CommentModal = lazy(() =>
  import('@/features/comment-solution').then(({ CommentModal }) => ({ default: CommentModal }))
);

const FinalReviewForm = lazy(() =>
  import('@/features/review-solution').then(({ FinalReviewForm }) => ({ default: FinalReviewForm }))
);

const ReportModal = lazy(() =>
  import('@/features/report-review').then(({ ReportModal }) => ({ default: ReportModal }))
);

interface SelectedLineRange {
  startLine: number;
  endLine: number;
}

interface ContextLineData {
  startLine: number;
  endLine: number;
}

interface LineSelectionPayload {
  startLineNumber: number;
  endLineNumber: number;
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

const findFileByPath = (nodes: readonly ReviewFile[], filePath: string): ReviewFile | null => {
  for (const node of nodes) {
    if (!node.isDirectory && node.path === filePath) {
      return node;
    }

    if (node.children) {
      const found = findFileByPath(node.children, filePath);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

interface LoadDataOptions {
  preserveSelectedFile?: boolean;
}

const ReviewPage = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { userId, user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);
  const [selectedLineRange, setSelectedLineRange] = useState<SelectedLineRange | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [contextLineData, setContextLineData] = useState<ContextLineData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<EntityId | null>(null);
  const [completeNotification] = useCompleteNotificationMutation();
  const [invalidateAssignedReviews] = useInvalidateReviewMutation();
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentMap, setFileContentMap] = useState<Record<string, LoadedReviewFile>>({});
  const numericUserId = Number(userId ?? 0);
  const isAdmin = user?.role === 'ADMIN';

  const loadData = useCallback(async (options: LoadDataOptions = {}) => {
    if (!reviewId) {
      navigate(ROUTES.reviews, { replace: true });

      return;
    }

    try {
      const reviewData = await reviewApi.getReviewById(reviewId);

      if (!reviewData) {
        navigate(ROUTES.reviews, {
          replace: true,
        });

        return;
      }

      setReview(reviewData);

      const taskData = await taskApi.getTaskById(reviewData.projectId, reviewData.taskId).catch((error: unknown) => {
        console.error('Task data load error:', error);

        if (!isAdmin) {
          throw error;
        }

        const fallbackTask: Task = {
          id: reviewData.taskId,
          projectId: reviewData.projectId,
          projectName: reviewData.projectName ?? '',
          projectPrivacy: PROJECT_PRIVACY.PRIVATE,
          name: reviewData.taskName ?? 'Ревью',
          status: TASK_STATUS.IN_REVIEW,
          deadline: reviewData.deadline,
          assigneeIds: [],
          reviewerIds: [],
          viewerRole: PROJECT_MEMBER_ROLE.GUEST,
          canViewTask: true,
          canManageSettings: false,
          canUploadSolution: false,
          canFinishReview: false,
          availableAssignees: [],
          availableReviewers: [],
        };

        if (reviewData.solutionId !== undefined) {
          fallbackTask.solutionId = reviewData.solutionId;
        }

        if (reviewData.reviewType !== undefined) {
          fallbackTask.reviewType = reviewData.reviewType as TaskReviewType;
        }

        return fallbackTask;
      });

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
        const firstFile = findFirstFileInSortedTree(reviewData.files);

        setSelectedFile((currentFile) => {
          if (options.preserveSelectedFile && currentFile) {
            return findFileByPath(reviewData.files, currentFile.path) ?? firstFile ?? null;
          }

          return firstFile ?? null;
        });
      } else {
        setSelectedFile(null);
      }
    } catch (err: unknown) {
      console.error('Review data load error:', err);
      showSnackbar('Ошибка загрузки данных ревью', reviewPageStyles.isError);
    } finally {
      setLoading(false);
    }
  }, [reviewId, navigate, isAdmin, numericUserId, showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const refetchOnFocus = () => {
      void loadData({ preserveSelectedFile: true });
    };

    const refetchOnVisible = () => {
      if (document.visibilityState === 'visible') {
        refetchOnFocus();
      }
    };

    window.addEventListener('focus', refetchOnFocus);
    document.addEventListener('visibilitychange', refetchOnVisible);

    return () => {
      window.removeEventListener('focus', refetchOnFocus);
      document.removeEventListener('visibilitychange', refetchOnVisible);
    };
  }, [loadData]);

  const fetchFileContent = useCallback(
    async (filePath: string) => {
      if (fileContentMap[filePath] && !fileContentMap[filePath].error) return;
      const contentReviewId = review?.id ?? reviewId;

      if (!contentReviewId) {
        return;
      }

      setFileContentLoading(true);

      try {
        const data = await reviewApi.getReviewFileContent(contentReviewId, filePath);

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

        showSnackbar('Ошибка загрузки содержимого файла', reviewPageStyles.isError);
      } finally {
        setFileContentLoading(false);
      }
    },
    [reviewId, review?.id, fileContentMap, showSnackbar]
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

  const isReviewer = useMemo(() => {
    if (!task?.reviewerIds || userId === null || userId === undefined) return false;

    return task.reviewerIds.includes(numericUserId);
  }, [task?.reviewerIds, userId, numericUserId]);

  const isAdminReadOnlyView = isAdmin && !isReviewer;
  const isCompleted = review?.status === REVIEW_STATUS.COMPLETED;
  const isTaskCompleted = task?.status === 'DONE';

  const myFinalReview = useMemo(
    () => (review?.finalReviews ?? []).find((finalReview) => Number(finalReview.reviewerId) === numericUserId),
    [review?.finalReviews, numericUserId]
  );

  const alreadySubmittedReview = !!myFinalReview;
  const isReadOnlyMode = alreadySubmittedReview || isCompleted;
  const canAddNewComments = isReviewer && !isReadOnlyMode;

  const canDiscussThreads = isReviewer && (isCompleted || (!alreadySubmittedReview && !isCompleted));

  const taskId = review?.taskId;

  const handleLineContextMenu = useCallback(
    (data: LineSelectionPayload) => {
      if (!canAddNewComments) return;

      setContextLineData({
        startLine: data.startLineNumber,
        endLine: data.endLineNumber,
      });

      setIsCommentModalOpen(true);
    },
    [canAddNewComments]
  );

  const handleLineClick = useCallback((range: SelectedLineRange) => {
    setSelectedLineRange(range);
  }, []);

  const handleAddComment = async ({ text, category, severity }: CommentPayload) => {
    if (!review || !contextLineData || !selectedFile) return;
    setIsCommentSubmitting(true);

    try {
      await reviewApi.addReviewComment(review.id, {
        file: selectedFile.path,
        startLine: contextLineData.startLine,
        endLine: contextLineData.endLine,
        text,
        category,
        severity,
      });

      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      setIsCommentModalOpen(false);
      showSnackbar('Комментарий добавлен', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка отправки комментария. Попробуйте позже.', reviewPageStyles.isError);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReply = async (commentId: EntityId, text: string) => {
    if (!taskId) {
      return;
    }

    try {
      await reviewApi.replyToReviewComment(taskId, commentId, {
        authorId: numericUserId,
        authorName: 'Вы',
        authorRole: 'Reviewer',
        text,
        createdAt: new Date().toISOString(),
      });

      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      showSnackbar('Ответ отправлен', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка отправки ответа. Попробуйте позже.', reviewPageStyles.isError);
    }
  };

  const handleLike = async (commentId: EntityId) => {
    if (!review) {
      return;
    }

    try {
      await reviewApi.toggleCommentLike(review.id, commentId, numericUserId, false);

      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
    } catch (err: unknown) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = useCallback(
    async (commentId: EntityId) => {
      if (!review) {
        return;
      }

      try {
        await reviewApi.toggleCommentLike(review.id, commentId, numericUserId, true);

        await loadData({ preserveSelectedFile: true });
        await invalidateAssignedReviews().unwrap();
      } catch (err: unknown) {
        console.error('Dislike error:', err);
      }
    },
    [review, numericUserId, loadData, invalidateAssignedReviews]
  );

  const handleDeleteComment = async (commentId: EntityId) => {
    if (!review) {
      return;
    }

    try {
      await reviewApi.deleteReviewComment(review.id, commentId);
      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      showSnackbar('Комментарий удален', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка удаления комментария', reviewPageStyles.isError);
    }
  };

  const handleCloseThread = async (commentId: EntityId) => {
    if (!review) {
      return;
    }

    try {
      await reviewApi.closeCommentThread(review.id, commentId, 'close');

      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      showSnackbar('Тред закрыт', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка закрытия треда', reviewPageStyles.isError);
    }
  };

  const handleReopenThread = async (commentId: EntityId) => {
    if (!review) {
      return;
    }

    try {
      await reviewApi.closeCommentThread(review.id, commentId, 'reopen');
      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      showSnackbar('Тред переоткрыт', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка открытия треда', reviewPageStyles.isError);
    }
  };

  const handleFinalSubmit = async (payload: FinalReviewSubmitPayload) => {
    if (!review || !taskId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewApi.submitFinalReview(review.id, {
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

      await loadData({ preserveSelectedFile: true });
      await invalidateAssignedReviews().unwrap();
      showSnackbar('Результаты ревью успешно сохранены', reviewPageStyles.success);
    } catch {
      showSnackbar('Ошибка сохранения результатов ревью. Попробуйте позже.', reviewPageStyles.isError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (reason: ReportReason, comment: string) => {
    if (!review || reportingCommentId === null) {
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewApi.reportComment(review.id, reportingCommentId, {
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

  const openReportModal = (commentId: EntityId) => {
    setReportingCommentId(commentId);
    setIsReportModalOpen(true);
  };

  const allComments = useMemo(() => review?.comments ?? [], [review?.comments]);
  const canShowAiComments = task?.status === 'DONE' || task?.status === 'REWORK';

  const visibleComments = useMemo(
    () =>
      canShowAiComments && task?.aiReviewEnabledAtCreation
        ? allComments
        : allComments.filter((comment) => comment.authorRole !== 'AI'),
    [allComments, canShowAiComments, task?.aiReviewEnabledAtCreation]
  );

  const fileComments = visibleComments.filter((comment) => comment.file === selectedFile?.path);

  const commentedFiles = [
    ...new Set(visibleComments.flatMap((comment) => (comment.file === undefined ? [] : [comment.file]))),
  ];

  const displayedComments = selectedLineRange
    ? fileComments.filter(
        (comment) => comment.startLine === selectedLineRange.startLine && comment.endLine === selectedLineRange.endLine
      )
    : [];

  const assigneesToReveal = useMemo(() => {
    if (!task?.assignees) return null;

    if (isAdminReadOnlyView) {
      return task.assignees;
    }

    const shouldReveal = review?.revealAuthorAfterReview;

    if (isTaskCompleted && shouldReveal) {
      return task.assignees;
    }

    return null;
  }, [isAdminReadOnlyView, isTaskCompleted, task?.assignees, review?.revealAuthorAfterReview]);

  const commentsCount = visibleComments.length;

  const humanComments = useMemo(
    () => visibleComments.filter((comment) => comment.authorRole !== 'AI'),
    [visibleComments]
  );

  const isAllResolved = useMemo(
    () => humanComments.filter((comment) => comment.parentId === null).every((comment) => comment.isClosed),
    [humanComments]
  );

  const historyComments = useMemo(
    () => review?.history.flatMap((history) => history.comments) ?? [],
    [review?.history]
  );

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

  const currentFileContent = selectedFile ? fileContentMap[selectedFile.path] : undefined;

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
                {assigneesToReveal.map((assignee) => (
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
                    onClick={() => selectedFile && fetchFileContent(selectedFile.path)}
                  >
                    Повторить
                  </button>
                </div>
              </div>
            ) : (
              <CodeViewer
                key={selectedFile?.path}
                value={currentFileContent?.content ?? ''}
                filePath={selectedFile?.path ?? ''}
                language={getLanguageByFileName(selectedFile?.name)}
                isDiff={currentFileContent?.isDiff === true}
                originalValue={currentFileContent?.originalContent ?? ''}
                comments={fileComments}
                onLineClick={handleLineClick}
                {...(canAddNewComments ? { onLineContextMenu: handleLineContextMenu } : {})}
                canComment={canAddNewComments}
              />
            )}

            {isReviewer && !alreadySubmittedReview && !isCompleted && (
              <Suspense fallback={null}>
                <FinalReviewForm onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} taskId={review.id} />
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
                aiReviewEnabled={Boolean(task?.aiReviewEnabledAtCreation)}
                canRevealReviewerNames={isTaskCompleted}
                currentReviewerId={numericUserId}
                showReviewerSummary={isTaskCompleted}
                showAiSolutionEvaluation={isTaskCompleted}
              />
            )}
          </div>

          <div className={reviewPageStyles.colRight}>
            <CommentsBlock
              comments={displayedComments}
              currentUser={user ?? { id: numericUserId, login: '' }}
              onReply={canDiscussThreads ? handleReply : undefined}
              onLike={canDiscussThreads ? handleLike : undefined}
              onDislike={canDiscussThreads ? handleDislike : undefined}
              onDelete={canAddNewComments ? handleDeleteComment : undefined}
              onReport={canDiscussThreads ? openReportModal : undefined}
              onCloseThread={handleCloseThread}
              onReopenThread={canDiscussThreads && !isTaskCompleted ? handleReopenThread : undefined}
              readOnly={!canDiscussThreads}
              pageContext="review"
              title="Комментарии"
              emptyText="Выберите строку или диапазон строк с комментариями"
            />

            {historyComments.length > 0 && (
              <CommentsBlock
                comments={historyComments}
                currentUser={user ?? { id: numericUserId, login: '' }}
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
            allowIncorrectTechnicalReason={task?.organizationId != null}
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
