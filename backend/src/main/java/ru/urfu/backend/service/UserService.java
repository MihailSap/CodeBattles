package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

public interface UserService {

    User save(User user);

    Page<User> getAll(int page, int size, String filter);

    User getByEmail(String email) throws UserNotFoundException;

    User getById(long id) throws UserNotFoundException;

    User create(RegisterRequest registerRequest);

    User makeAdmin(User user);

    User makeNotAdmin(User user);

    void delete(User user);

    boolean isExistsByEmail(String email);

    User updateLogin(User user, String login);

    void updatePassword(User user, String newPassword);
}
