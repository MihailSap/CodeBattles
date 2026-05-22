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
import reviewsPageStyles from './ReviewsPage.module.scss';

const STATUS_FILTER_OPTIONS = [
  {
    value: '',
    label: 'Все',
  },
  {
    value: REVIEW_STATUS.NEW,
    label: REVIEW_STATUS_LABEL[REVIEW_STATUS.NEW],
  },
  {
    value: REVIEW_STATUS.IN_PROGRESS,
    label: REVIEW_STATUS_LABEL[REVIEW_STATUS.IN_PROGRESS],
  },
  {
    value: REVIEW_STATUS.COMPLETED,
    label: REVIEW_STATUS_LABEL[REVIEW_STATUS.COMPLETED],
  },
];

const SORT_OPTIONS = [
  {
    value: REVIEW_SORT.NEAREST_FIRST,
    label: REVIEW_SORT_LABEL[REVIEW_SORT.NEAREST_FIRST],
  },
  {
    value: REVIEW_SORT.FARTHEST_FIRST,
    label: REVIEW_SORT_LABEL[REVIEW_SORT.FARTHEST_FIRST],
  },
];

const groupReviews = (reviews: LegacyValue) => {
  const groupsMap = new Map();

  reviews.forEach((review: LegacyValue) => {
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
    .map((group: LegacyValue) => ({
      ...group,
      projects: [...group.projectsMap.values()].sort((left: LegacyValue, right: LegacyValue) =>
        left.title.localeCompare(right.title, 'ru', {
          sensitivity: 'base',
        })
      ),
    }))
    .sort((left: LegacyValue, right: LegacyValue) => {
      if (left.id === 'without-organization') {
        return 1;
      }

      if (right.id === 'without-organization') {
        return -1;
      }

      return left.title.localeCompare(right.title, 'ru', {
        sensitivity: 'base',
      });
    });
};

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [sortDirection, setSortDirection] = useState(REVIEW_SORT.NEAREST_FIRST);

  const {
    data: pageData = {
      items: [],
      totalItems: 0,
    },
    isLoading,
  } = useGetAssignedReviewsQuery(
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
    (reviewId: LegacyValue) => {
      navigate(ROUTES.reviewById.replace(':reviewId', reviewId));
    },
    [navigate]
  );

  const groupedReviews = useMemo(() => groupReviews(pageData.items), [pageData.items]);

  return (
    <div className={reviewsPageStyles.root}>
      <main className={reviewsPageStyles.content}>
        <section className={reviewsPageStyles.controls}>
          <h1 className={reviewsPageStyles.title}>Активные ревью</h1>

          <div className={reviewsPageStyles.controlsRow}>
            <div className={reviewsPageStyles.filters}>
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

            <p className={reviewsPageStyles.total}>Всего {pageData.totalItems} ревью</p>
          </div>
        </section>

        <section className={reviewsPageStyles.sections}>
          {isLoading ? (
            <div className={reviewsPageStyles.loader}>
              <Spinner />
            </div>
          ) : groupedReviews.length === 0 ? (
            <p className={reviewsPageStyles.isEmpty}>Нет назначенных ревью</p>
          ) : (
            groupedReviews.map((organization: LegacyValue) => (
              <ReviewSection key={organization.id} title={organization.title} reviewsCount={organization.reviewsCount}>
                <div className={reviewsPageStyles.projectsList}>
                  {organization.projects.map((project: LegacyValue) => (
                    <ReviewSection key={project.id} title={project.title} reviewsCount={project.reviews.length} nested>
                      <div className={reviewsPageStyles.list}>
                        {project.reviews.map((review: LegacyValue) => (
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
