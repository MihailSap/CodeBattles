package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.RefreshToken;
import ru.urfu.backend.model.User;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByBody(String body);

    Optional<RefreshToken> findByUser(User user);
}
