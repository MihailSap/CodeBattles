package ru.urfu.backend.specification;

import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.urfu.backend.model.User;

@Component
public class UserSpecification {

    public Specification<User> loginOrEmailContains(String filter) {
        return (root, query, cb) -> {
            if (filter == null || filter.isBlank()) return null;
            String pattern = "%" + filter.trim().toLowerCase() + "%";
            Expression<String> login = cb.lower(root.get("login"));
            Expression<String> email = cb.lower(root.get("email"));
            return cb.or(cb.like(login, pattern), cb.like(email, pattern));
        };
    }
}
