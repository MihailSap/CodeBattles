package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.UserStack;

@Repository
public interface UserStackRepository extends JpaRepository<UserStack, Integer> {
}
