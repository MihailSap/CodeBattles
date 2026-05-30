package ru.urfu.backend.specification;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;

import java.util.ArrayList;
import java.util.List;

@Component
public class PublicProjectSpecification {

    public Specification<Project> search(String q, User currentUser) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isPrivate"), false));

            predicates.add(
                    cb.not(
                            root.get("users")
                                    .get("user")
                                    .get("id")
                                    .in(currentUser.getId())
                    )
            );

            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.toLowerCase() + "%";

                predicates.add(
                        cb.like(cb.lower(root.get("title")), pattern)
                );
            }

            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public Specification<Project> publicProjects(Long currentUserId, String search) {
        return (root, query, cb) -> {

            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isPrivate"), false));

            if (search != null && !search.isBlank()) {
                predicates.add(
                        cb.like(
                                cb.lower(root.get("title")),
                                "%" + search.toLowerCase() + "%"
                        )
                );
            }

            Subquery<Long> subquery = query.subquery(Long.class);
            Root<UserProject> up = subquery.from(UserProject.class);

            subquery.select(cb.literal(1L))
                    .where(
                            cb.equal(up.get("project"), root),
                            cb.equal(up.get("user").get("id"), currentUserId)
                    );

            predicates.add(cb.not(cb.exists(subquery)));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
