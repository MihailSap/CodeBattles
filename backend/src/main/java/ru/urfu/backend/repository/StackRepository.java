package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Stack;

import java.util.Optional;

@Repository
public interface StackRepository extends JpaRepository<Stack, Long> {

    Optional<Stack> findByTitle(String title);
}
