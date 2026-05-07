package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.enums.ProjectMembershipFilter;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.ProjectPrivacy;

import java.util.ArrayList;
import java.util.List;

@Component
public class ProjectSpecification {

    public Specification<Project> withFilters(
            String search,
            ProjectPrivacy privacy,
            Long organizationId,
            ProjectMembershipFilter membership,
            Long currentUserId
    ) {
        return (root, query, cb) -> {

            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            Join<Project, UserProject> userProjectJoin =
                    root.join("users", JoinType.INNER);

            predicates.add(
                    cb.equal(
                            userProjectJoin.get("user").get("id"),
                            currentUserId
                    )
            );

            if (search != null && !search.isBlank()) {

                predicates.add(
                        cb.like(
                                cb.lower(root.get("title")),
                                "%" + search.toLowerCase() + "%"
                        )
                );
            }

            if (privacy != null) {

                boolean isPrivate =
                        privacy == ProjectPrivacy.PRIVATE;

                predicates.add(
                        cb.equal(
                                root.get("isPrivate"),
                                isPrivate
                        )
                );
            }

            if (organizationId != null) {

                predicates.add(
                        cb.equal(
                                root.get("organization").get("id"),
                                organizationId
                        )
                );
            }

            if (membership != null
                    && membership != ProjectMembershipFilter.ALL) {

                if (membership == ProjectMembershipFilter.OWNER) {

                    predicates.add(
                            cb.equal(
                                    userProjectJoin.get("projectMemberRole"),
                                    ProjectMemberRole.OWNER
                            )
                    );
                }

                else if (membership == ProjectMembershipFilter.MEMBER) {

                    predicates.add(
                            cb.equal(
                                    userProjectJoin.get("projectMemberRole"),
                                    ProjectMemberRole.MEMBER
                            )
                    );
                }

                else if (membership == ProjectMembershipFilter.GUEST) {

                    predicates.add(
                            cb.equal(
                                    userProjectJoin.get("projectMemberRole"),
                                    ProjectMemberRole.GUEST
                            )
                    );
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}