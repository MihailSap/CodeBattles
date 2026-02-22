package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.model.User;

@Component
public class UserMapper {

    public UserResponse mapToUserResponse(User user) {
        return new UserResponse(user.getEmail(), user.getLogin());
    }
}
