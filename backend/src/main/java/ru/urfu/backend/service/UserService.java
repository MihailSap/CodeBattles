package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

public interface UserService {

    void create(String githubId, String login, String email, String avatar);

    User create(RegisterRequest registerRequest);

    User save(User user);

    Page<User> getAll(int page, int size, String filter);

    User getByEmail(String email) throws UserNotFoundException;

    User getById(long id) throws UserNotFoundException;

    User getByGithubId(String githubId) throws UserNotFoundException;

    User getByVerificationToken(String verificationToken) throws UserNotFoundException;

    User getByPasswordResetToken(String token) throws UserNotFoundException;

    User updateLogin(User user, String login);

    void updatePassword(User user, String newPassword);

    User enableUser(User user);

    User makeAdmin(User user);

    User makeNotAdmin(User user);

    void processGithubUser(String githubId, String login, String email, String avatar);

    void setNullPasswordResetToken(User user);

    String setPasswordResetToken(User user);

    void delete(User user);

    boolean isExistsByGithubId(String githubId);

    boolean isExistsByEmail(String email);
}
