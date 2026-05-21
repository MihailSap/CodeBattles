import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { projectsApi } from '@/entities/project';
import { NOTIFICATION_COMPLETION_ACTION, NOTIFICATION_TARGET_KIND, useCompleteNotificationMutation } from '@/entities/notification';
import FileTree from '@/shared/ui/file-tree';
import CodeViewer from '@/shared/ui/code-viewer';
import { CommentsBlock } from '@/widgets/solution-workspace';
import { ReviewResultsSidebar } from '@/widgets/review-workspace';
import ScrollToTopButton from '@/shared/ui/scroll-to-top-button';
import Spinner from '@/shared/ui/spinner';
import { getLanguageByFileName, lazyNamed } from '@/shared/lib';
import { UnwrapIcon } from '@/shared/ui/icons';

import { MOCK_LARGE_FILE_TREE } from '@/entities/project/api/mocks/content';
import './SolutionTab.css';

const GitUploadModal = lazyNamed(() => import('@/features/upload-solution'), 'GitUploadModal');
const ReportModal = lazyNamed(() => import('@/features/report-review'), 'ReportModal');
const SolutionUploadModal = lazyNamed(() => import('@/features/upload-solution'), 'SolutionUploadModal');

const SolutionTab = ({ task, currentUser, aiReviewEnabled, onSnackbar, readOnly = false }) => {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLineRange, setSelectedLineRange] = useState(null);
  const [revealName, setRevealName] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);

  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentMap, setFileContentMap] = useState({});
  const [completeNotification] = useCompleteNotificationMutation();

  const isAssignee = !readOnly && task.assigneeIds?.includes(currentUser?.id);

  const showSnackbar = useCallback(
    (message, type = 'success') => {
      if (onSnackbar) onSnackbar(message, type);
    },
    [onSnackbar]
  );

  const loadReview = useCallback(async () => {
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
      const data = await projectsApi.getReviewByTaskId(task.id);
      setReview(data);
      if (data?.files?.length > 0) {
        setSelectedFile(prev => {
          if (prev) return prev;
          const firstFile = findFirstFileInternal(data.files);
          return firstFile || data.files[0];
        });
      }
    } catch (err) {
      console.error('Load review error:', err);
      showSnackbar('Ошибка загрузки данных решения', 'error');
    } finally {
      setLoading(false);
    }
  }, [task.id, showSnackbar]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const fetchFileContent = useCallback(async (filePath) => {
    if (fileContentMap[filePath] && !fileContentMap[filePath].error) return;
    setFileContentLoading(true);
    try {
      const data = await projectsApi.getReviewFileContent(task.id, filePath);
      setFileContentMap(prev => ({ ...prev, [filePath]: data }));
    } catch (err) {
      console.error('Failed to fetch file content:', err);
      setFileContentMap(prev => ({ ...prev, [filePath]: { error: true } }));
    } finally {
      setFileContentLoading(false);
    }
  }, [task.id, fileContentMap]);

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

  const handleUploadSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await projectsApi.submitSolution(task.id, { ...payload, revealAuthorAfterReview: revealName });
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id
        }
      });
      await loadReview();
      setIsManualModalOpen(false);
      setIsGitModalOpen(false);
      showSnackbar('Решение успешно отправлено на ревью');
    } catch {
      showSnackbar('Возникла непредвиденная ошибка. Попробуйте еще раз.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await projectsApi.resubmitSolution(task.id, payload);
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id
        }
      });
      await loadReview();
      setIsManualModalOpen(false);
      setIsGitModalOpen(false);
      showSnackbar('Решение переотправлено на ревью');
    } catch {
      showSnackbar('Ошибка при переотправке', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishReview = async () => {
    try {
      await projectsApi.finishReview(task.id);
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.ACCEPT_REVIEW_RESULT,
        target: {
          kind: NOTIFICATION_TARGET_KIND.TASK,
          projectId: task.projectId,
          taskId: task.id
        }
      });
      await loadReview();
      showSnackbar('Ревью завершено');
    } catch {
      showSnackbar('Ошибка завершения ревью', 'error');
    }
  };

  const handleReply = useCallback(async (commentId, text) => {
    try {
      await projectsApi.replyToReviewComment(task.id, commentId, {
        authorId: currentUser.id,
        authorName: currentUser.fullName || 'Вы',
        text,
        createdAt: new Date().toISOString(),
        authorRole: 'Assignee'
      });
      await loadReview();
      showSnackbar('Ответ отправлен');
    } catch {
      showSnackbar('Ошибка отправки ответа. Попробуйте позже.', 'error');
    }
  }, [task.id, currentUser.id, currentUser.fullName, loadReview, showSnackbar]);

  const handleLike = async (commentId) => {
    try {
      await projectsApi.toggleCommentLike(task.id, commentId, currentUser.id, false);
      await loadReview();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = useCallback(async (commentId) => {
    try {
      await projectsApi.toggleCommentLike(task.id, commentId, currentUser.id, true);
      await loadReview();
    } catch (err) {
      console.error('Dislike error:', err);
    }
  }, [task.id, currentUser.id, loadReview]);

  const handleDeleteComment = async (commentId) => {
    try {
      await projectsApi.deleteReviewComment(task.id, commentId);
      await loadReview();
      showSnackbar('Комментарий удалён');
    } catch {
      showSnackbar('Ошибка удаления', 'error');
    }
  };

  const handleCloseThread = async (commentId) => {
    try {
      await projectsApi.closeCommentThread(task.id, commentId, 'close');
      await loadReview();
      showSnackbar('Тред закрыт');
    } catch {
      showSnackbar('Ошибка закрытия треда', 'error');
    }
  };

  const handleReportSubmit = async (reason, comment) => {
    setIsSubmitting(true);
    try {
      await projectsApi.reportComment(task.id, reportingCommentId, { reason, comment });
      setIsReportModalOpen(false);
      showSnackbar('Жалоба отправлена');
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

  const handleLineClick = (range) => {
    setSelectedLineRange(range);
  };

  const isNotUploaded = !review;
  const isWaiting = task.status === 'IN_REVIEW';
  const isCompleted = task.status === 'DONE';
  const isRework = task.status === 'REWORK';

  const allReviewersApproved = useMemo(() => review?.finalReviews?.length > 0 &&
    review.finalReviews.every(fr => fr.verdict === 'APPROVED'), [review?.finalReviews]);

  const isExpiredWithoutReview = useMemo(() => isWaiting && review?.deadline && new Date(review.deadline) < new Date()
    && review.reviewType !== 'AI_ONLY', [isWaiting, review?.deadline, review?.reviewType]);

  const allComments = useMemo(() => review?.comments || [], [review?.comments]);
  const visibleComments = useMemo(
    () => aiReviewEnabled ? allComments : allComments.filter((comment) => comment.authorRole !== 'AI'),
    [aiReviewEnabled, allComments]
  );
  const hasReviewResults = isCompleted || isRework;
  const showExpiredAiResults = isExpiredWithoutReview && aiReviewEnabled;
  const showCodeComments = hasReviewResults || showExpiredAiResults;
  const shouldShowFinishReview = isWaiting && !isExpiredWithoutReview && allReviewersApproved;
  const shouldShowWaitingState = isWaiting && !isExpiredWithoutReview && !allReviewersApproved;
  const fileComments = useMemo(() => visibleComments.filter((c) => c.file === selectedFile?.path), [visibleComments, selectedFile?.path]);

  const displayedComments = useMemo(() => selectedLineRange
    ? fileComments.filter(c =>
      c.startLine === selectedLineRange.startLine && c.endLine === selectedLineRange.endLine
    )
    : [], [fileComments, selectedLineRange]);

  const commentedFiles = useMemo(() => [...new Set(visibleComments.map((c) => c.file))], [visibleComments]);

  if (loading) {
    return (
      <div className="solution-tab-loading">
        <Spinner />
      </div>
    );
  }

  const fileTreeData = review?.files?.length > 0 ? review.files : MOCK_LARGE_FILE_TREE;
  const currentFileContent = fileContentMap[selectedFile?.path];
  const codeContent = currentFileContent?.content || '';
  const originalCodeContent = currentFileContent?.originalContent || (currentFileContent?.isDiff ? 'Старый код' : '');

  const hasHistory = review?.history && review.history.length > 0;
  const aiFileComments = fileComments.filter(c => c.authorRole === 'AI');
  const revealedReviewers = review?.finalReviews?.filter(fr => fr.revealName) || [];

  return (
    <div className="solution-tab">

      {isNotUploaded && isAssignee && (
        <div className="solution-tab__upload-block">
          <div className="solution-tab__upload-text">Загрузите решение задачи</div>
          <div className="solution-tab__upload-actions">
            <button className="btn-git" type="button" onClick={() => setIsGitModalOpen(true)}>
              Git-репозиторий
            </button>
            <button className="btn-manual" type="button" onClick={() => setIsManualModalOpen(true)}>
              Вручную
            </button>
          </div>
        </div>
      )}

      {isNotUploaded && !isAssignee && (
        <div className="solution-tab__upload-block">
          <div className="solution-tab__upload-text">Решение ещё не загружено</div>
        </div>
      )}

      {review && (isWaiting || isCompleted || isRework) && (
        <>
          <div className="solution-tab__content">
            <div className="solution-tab__col-left">
              <div className="solution-tab__file-tree-card">
                <FileTree
                  files={fileTreeData}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  commentedFiles={showCodeComments ? commentedFiles : []}
                />
              </div>
            </div>

            <div className="solution-tab__col-center">
              {fileContentLoading ? (
                <div className="solution-tab__loader" style={{ height: '400px' }}><Spinner /></div>
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
                  value={codeContent || (selectedFile?.isDirectory ? '' : '')}
                  language={getLanguageByFileName(selectedFile?.name)}
                  isDiff={selectedFile?.isDiff || currentFileContent?.isDiff}
                  originalValue={originalCodeContent}
                  comments={showCodeComments ? fileComments : []}
                  onLineClick={handleLineClick}
                  canComment={false}
                />
              )}

              {(hasReviewResults || showExpiredAiResults) && (
                <div className="solution-tab__under-code">
                  <ReviewResultsSidebar review={review} aiReviewEnabled={aiReviewEnabled} />
                </div>
              )}
            </div>

            <div className="solution-tab__col-right">
              <>
                {isRework && isAssignee && (
                  <div className="solution-tab__card">
                    <h3 className="solution-tab__card-title">Отправить на проверку</h3>
                    <div className="solution-tab__upload-actions">
                      <button className="btn-git" type="button" onClick={() => setIsGitModalOpen(true)}>
                        Git-репозиторий
                      </button>
                      <button className="btn-manual" type="button" onClick={() => setIsManualModalOpen(true)}>
                        Вручную
                      </button>
                    </div>
                  </div>
                )}

                {isExpiredWithoutReview && isAssignee && (
                  <div className="solution-tab__card">
                    <div className="solution-tab__card-text solution-tab__card-text--error">
                      Ни один назначенный ревьюер не выполнил ревью
                    </div>
                    <button
                      className="btn-finish"
                      type="button"
                      onClick={() => handleResubmit({ type: 'resend' })}
                      style={{ marginTop: 20 }}
                    >
                      Переотправить
                    </button>
                  </div>
                )}

                {shouldShowWaitingState && isAssignee && (
                  <div className="solution-tab__card">
                    <label className="solution-tab__checkbox-label" style={{ marginBottom: 12 }}>
                      <input
                        type="checkbox"
                        checked={revealName}
                        onChange={(e) => setRevealName(e.target.checked)}
                      />
                      Раскрыть моё имя ревьюерам после завершения ревью
                    </label>
                    <div className="solution-tab__waiting-text">Ожидание ревью</div>
                  </div>
                )}

                {shouldShowFinishReview && isAssignee && (
                  <div className="solution-tab__card">
                    <button className="btn-finish" type="button" onClick={handleFinishReview}>
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
                      <div className="solution-tab__reviewers-names">
                        <h3 className="solution-tab__reviewers-title">Ревьюеры</h3>
                        <div className="solution-tab__reviewers-list">
                          {revealedReviewers.map(fr => (
                            <span className="solution-tab__reviewer-name" key={fr.id || fr.reviewerId}>
                              {fr.reviewerName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <CommentsBlock
                      comments={displayedComments}
                      currentUser={currentUser}
                      onReply={isAssignee ? handleReply : undefined}
                      onLike={isAssignee ? handleLike : undefined}
                      onDislike={isAssignee ? handleDislike : undefined}
                      onDelete={isAssignee ? handleDeleteComment : undefined}
                      onReport={isAssignee ? openReportModal : undefined}
                      onCloseThread={isAssignee ? handleCloseThread : undefined}
                      readOnly={!isAssignee}
                      pageContext="task"
                      emptyText="Выберите строку или диапазон строк с комментариями"
                    />
                  </>
                )}

                {(isWaiting || isRework || isCompleted) && hasHistory && (
                  <CommentsBlock
                    comments={review.history.flatMap(h => h.comments || [])}
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
        {isManualModalOpen && (
          <SolutionUploadModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            onSubmit={isRework ? handleResubmit : handleUploadSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {isGitModalOpen && (
          <GitUploadModal
            isOpen={isGitModalOpen}
            onClose={() => setIsGitModalOpen(false)}
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
          />
        )}
      </Suspense>

      <ScrollToTopButton />
    </div>
  );
};

export default SolutionTab;
