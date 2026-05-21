import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAssignedReviewsQuery } from '@/entities/review';
import { ReviewCard } from '@/entities/review';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import { ReviewSection } from '@/entities/review';
import Spinner from '@/shared/ui/spinner';
import { REVIEW_SORT, REVIEW_SORT_LABEL, REVIEW_STATUS, REVIEW_STATUS_LABEL } from '@/entities/review';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import './ReviewsPage.css';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Все' },
  { value: REVIEW_STATUS.NEW, label: REVIEW_STATUS_LABEL[REVIEW_STATUS.NEW] },
  { value: REVIEW_STATUS.IN_PROGRESS, label: REVIEW_STATUS_LABEL[REVIEW_STATUS.IN_PROGRESS] },
  { value: REVIEW_STATUS.COMPLETED, label: REVIEW_STATUS_LABEL[REVIEW_STATUS.COMPLETED] },
];

const SORT_OPTIONS = [
  { value: REVIEW_SORT.NEAREST_FIRST, label: REVIEW_SORT_LABEL[REVIEW_SORT.NEAREST_FIRST] },
  { value: REVIEW_SORT.FARTHEST_FIRST, label: REVIEW_SORT_LABEL[REVIEW_SORT.FARTHEST_FIRST] },
];

const groupReviews = (reviews) => {
  const groupsMap = new Map();

  reviews.forEach((review) => {
    const organizationId = review.organization?.id || 'without-organization';

    if (!groupsMap.has(organizationId)) {
      groupsMap.set(organizationId, {
        id: organizationId,
        title: review.organization?.name || 'Без организации',
        projectsMap: new Map(),
        reviewsCount: 0,
      });
    }

    const organizationGroup = groupsMap.get(organizationId);
    const projectId = review.project.id;

    if (!organizationGroup.projectsMap.has(projectId)) {
      organizationGroup.projectsMap.set(projectId, {
        id: projectId,
        title: review.project.name,
        reviews: [],
      });
    }

    organizationGroup.projectsMap.get(projectId).reviews.push(review);
    organizationGroup.reviewsCount += 1;
  });

  return [...groupsMap.values()]
    .map((group) => ({
      ...group,
      projects: [...group.projectsMap.values()].sort((left, right) =>
        left.title.localeCompare(right.title, 'ru', { sensitivity: 'base' })
      ),
    }))
    .sort((left, right) => {
      if (left.id === 'without-organization') {
        return 1;
      }

      if (right.id === 'without-organization') {
        return -1;
      }

      return left.title.localeCompare(right.title, 'ru', { sensitivity: 'base' });
    });
};

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [sortDirection, setSortDirection] = useState(REVIEW_SORT.NEAREST_FIRST);
  const { data: pageData = { items: [], totalItems: 0 }, isLoading } = useGetAssignedReviewsQuery(
    {
      viewerId: Number(userId),
      params: {
        status: statusFilter,
        sort: sortDirection,
      },
    },
    {
      skip: !userId,
      refetchOnMountOrArgChange: 30,
    }
  );
  const openReview = useCallback(
    (reviewId) => {
      navigate(ROUTES.reviewById.replace(':reviewId', reviewId));
    },
    [navigate]
  );

  const groupedReviews = useMemo(() => groupReviews(pageData.items), [pageData.items]);

  return (
    <div className="reviews-page">
      <main className="reviews-page__content">
        <section className="reviews-page__controls">
          <h1 className="reviews-page__title">Активные ревью</h1>

          <div className="reviews-page__controls-row">
            <div className="reviews-page__filters">
              <ReviewDropdown
                label="Статус:"
                placeholder="Все"
                value={statusFilter}
                options={STATUS_FILTER_OPTIONS}
                onChange={setStatusFilter}
              />
              <ReviewDropdown
                label="Сортировка:"
                value={sortDirection}
                options={SORT_OPTIONS}
                onChange={setSortDirection}
              />
            </div>

            <p className="reviews-page__total">Всего {pageData.totalItems} ревью</p>
          </div>
        </section>

        <section className="reviews-page__sections">
          {isLoading ? (
            <div className="reviews-page__loader">
              <Spinner />
            </div>
          ) : groupedReviews.length === 0 ? (
            <p className="reviews-page__empty">Нет назначенных ревью</p>
          ) : (
            groupedReviews.map((organization) => (
              <ReviewSection key={organization.id} title={organization.title} reviewsCount={organization.reviewsCount}>
                <div className="reviews-page__projects-list">
                  {organization.projects.map((project) => (
                    <ReviewSection key={project.id} title={project.title} reviewsCount={project.reviews.length} nested>
                      <div className="reviews-page__reviews-list">
                        {project.reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} onOpen={openReview} />
                        ))}
                      </div>
                    </ReviewSection>
                  ))}
                </div>
              </ReviewSection>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default ReviewsPage;
