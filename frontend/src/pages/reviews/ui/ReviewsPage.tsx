import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAssignedReviewsQuery, type AssignedReview, type ReviewSort, type ReviewStatus } from '@/entities/review';
import type { EntityId } from '@/entities/project';
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

const isStatusFilter = (value: string): value is '' | ReviewStatus =>
  value === '' ||
  value === REVIEW_STATUS.NEW ||
  value === REVIEW_STATUS.IN_PROGRESS ||
  value === REVIEW_STATUS.COMPLETED;

interface ProjectReviewGroup {
  id: EntityId;
  title: string;
  reviews: AssignedReview[];
}

interface OrganizationReviewGroup {
  id: EntityId | 'without-organization';
  title: string;
  projectsMap: Map<EntityId, ProjectReviewGroup>;
  reviewsCount: number;
}

interface DisplayOrganizationReviewGroup extends Omit<OrganizationReviewGroup, 'projectsMap'> {
  projects: ProjectReviewGroup[];
}

const groupReviews = (reviews: readonly AssignedReview[]): DisplayOrganizationReviewGroup[] => {
  const groupsMap = new Map<EntityId | 'without-organization', OrganizationReviewGroup>();

  reviews.forEach((review) => {
    const organizationId = review.organization?.id ?? 'without-organization';

    if (!groupsMap.has(organizationId)) {
      groupsMap.set(organizationId, {
        id: organizationId,
        title: review.organization?.name || 'Без организации',
        projectsMap: new Map(),
        reviewsCount: 0,
      });
    }

    const organizationGroup = groupsMap.get(organizationId);

    if (!organizationGroup) {
      return;
    }

    const projectId = review.project.id;

    if (!organizationGroup.projectsMap.has(projectId)) {
      organizationGroup.projectsMap.set(projectId, {
        id: projectId,
        title: review.project.name,
        reviews: [],
      });
    }

    organizationGroup.projectsMap.get(projectId)?.reviews.push(review);
    organizationGroup.reviewsCount += 1;
  });

  return [...groupsMap.values()]
    .map((group) => ({
      id: group.id,
      title: group.title,
      reviewsCount: group.reviewsCount,
      projects: [...group.projectsMap.values()].sort((left, right) =>
        left.title.localeCompare(right.title, 'ru', {
          sensitivity: 'base',
        })
      ),
    }))
    .sort((left, right) => {
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
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [sortDirection, setSortDirection] = useState<ReviewSort>(REVIEW_SORT.NEAREST_FIRST);

  const { data: reviews = [], isLoading } = useGetAssignedReviewsQuery(
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
    (reviewId: EntityId) => {
      navigate(ROUTES.reviewById.replace(':reviewId', String(reviewId)));
    },
    [navigate]
  );

  const groupedReviews = useMemo(() => groupReviews(reviews), [reviews]);

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
                onChange={(status) => {
                  if (isStatusFilter(status)) {
                    setStatusFilter(status);
                  }
                }}
              />
              <ReviewDropdown
                label="Сортировка:"
                value={sortDirection}
                options={SORT_OPTIONS}
                onChange={setSortDirection}
              />
            </div>

            <p className={reviewsPageStyles.total}>Всего {reviews.length} ревью</p>
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
            groupedReviews.map((organization) => (
              <ReviewSection key={organization.id} title={organization.title} reviewsCount={organization.reviewsCount}>
                <div className={reviewsPageStyles.projectsList}>
                  {organization.projects.map((project) => (
                    <ReviewSection key={project.id} title={project.title} reviewsCount={project.reviews.length} nested>
                      <div className={reviewsPageStyles.list}>
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
