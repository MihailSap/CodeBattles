package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROFILE)
public class ProfileController {

    private final AuthService authService;
    private final UserMapper userMapper;

    @Autowired
    public ProfileController(AuthService authService, UserMapper userMapper) {
        this.authService = authService;
        this.userMapper = userMapper;
    }

    @GetMapping("/me")
    public UserResponse getCurrentUserProfile() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return userMapper.mapToUserResponse(user);
    }
}
