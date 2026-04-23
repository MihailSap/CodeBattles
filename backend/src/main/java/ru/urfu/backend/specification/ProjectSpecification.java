package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.Project;

@Component
public class ProjectSpecification {

    public Specification<Project> withFilters(
            String search,
            String privacy,
            Long organizationId
    ) {
        return (root, query, cb) -> {

            var predicates = cb.conjunction();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Expression<String> title = cb.lower(root.get("title"));
                predicates = cb.and(predicates, cb.like(title, pattern));
            }

            if (privacy != null) {
                boolean isPrivate = privacy.equalsIgnoreCase("PRIVATE");
                predicates = cb.and(predicates,
                        cb.equal(root.get("isPrivate"), isPrivate));
            }

            if (organizationId != null) {
                predicates = cb.and(predicates,
                        cb.equal(root.get("organization").get("id"), organizationId));
            }

            return predicates;
        };
    }
}
