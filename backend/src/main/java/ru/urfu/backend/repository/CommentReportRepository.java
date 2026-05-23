package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.CommentReport;

@Repository
public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
}
