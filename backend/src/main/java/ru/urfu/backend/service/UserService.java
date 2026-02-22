package ru.urfu.backend.service;

import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

public interface UserService {

    User save(User user);

    User getByEmail(String email) throws UserNotFoundException;

    User create(RegisterRequest registerRequest);

    boolean isExistsByEmail(String email);
}
