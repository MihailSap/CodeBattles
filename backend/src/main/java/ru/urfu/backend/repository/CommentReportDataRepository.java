package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.CommentReportData;

@Repository
public interface CommentReportDataRepository extends JpaRepository<CommentReportData, Long> {
}
