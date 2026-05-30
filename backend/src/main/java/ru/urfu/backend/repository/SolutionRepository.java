package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Solution;

import java.util.Optional;

@Repository
public interface SolutionRepository extends JpaRepository<Solution, Long> {

}
