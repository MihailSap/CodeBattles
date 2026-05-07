package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserProjectSpecification {

    public Specification<UserProject> withFilters(
            Project project,
            String search,
            ProjectMemberRole role,
            List<Long> excludeSelectedIds
    ) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            Join<UserProject, User> userJoin = root.join("user");

            predicates.add(
                    cb.equal(root.get("project"), project)
            );

            if (search != null && !search.isBlank()) {

                String pattern = "%" + search.toLowerCase() + "%";

                predicates.add(
                        cb.or(
                                cb.like(
                                        cb.lower(userJoin.get("fullName")),
                                        pattern
                                ),
                                cb.like(
                                        cb.lower(userJoin.get("login")),
                                        pattern
                                )
                        )
                );
            }

            if (role != null) {
                predicates.add(
                        cb.equal(root.get("projectMemberRole"), role)
                );
            }

            if (excludeSelectedIds != null && !excludeSelectedIds.isEmpty()) {
                predicates.add(
                        cb.not(
                                userJoin.get("id").in(excludeSelectedIds)
                        )
                );
            }

            query.orderBy(
                    cb.asc(
                            cb.selectCase()
                                    .when(
                                            cb.equal(
                                                    root.get("projectMemberRole"),
                                                    ProjectMemberRole.OWNER
                                            ),
                                            0
                                    )
                                    .when(
                                            cb.equal(
                                                    root.get("projectMemberRole"),
                                                    ProjectMemberRole.MEMBER
                                            ),
                                            1
                                    )
                                    .otherwise(999)
                    ),
                    cb.asc(userJoin.get("fullName"))
            );

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
