package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserOrganizationSpecification {

    public Specification<UserOrganization> byUser(User user) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("user"), user));
            predicates.add(cb.isTrue(root.get("isEnabled")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
