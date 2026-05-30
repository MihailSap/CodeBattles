package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.UserOrganization;

import java.util.ArrayList;
import java.util.List;

@Component
public class OrganizationSpecification {

    public Specification<Organization> searchForJoin(Long currentUserId, String q) {
        return (root, query, cb) -> {
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                predicates.add(
                        cb.like(
                                cb.lower(root.get("title")),
                                "%" + q.toLowerCase() + "%"
                        )
                );
            }

            Subquery<Long> subquery = query.subquery(Long.class);
            Root<UserOrganization> userOrganizationRoot = subquery.from(UserOrganization.class);

            subquery.select(cb.literal(1L))
                    .where(
                            cb.equal(userOrganizationRoot.get("organization"), root),
                            cb.equal(userOrganizationRoot.get("user").get("id"), currentUserId),
                            cb.isTrue(userOrganizationRoot.get("isEnabled"))
                    );

            predicates.add(cb.not(cb.exists(subquery)));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
