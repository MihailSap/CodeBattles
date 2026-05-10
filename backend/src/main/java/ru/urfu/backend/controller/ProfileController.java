package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.user.UpdateAvatarRequest;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.UserService;

@Tag(name = "Управление профилем")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROFILE)
public class ProfileController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;

    @Autowired
    public ProfileController(AuthService authService, UserService userService, UserMapper userMapper) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @Operation(description = "Получение профиля текущего пользователя")
    @GetMapping("/me")
    public UserResponse getCurrentUserProfile() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return userMapper.mapToUserResponse(user);
    }

    @PatchMapping("/{userId}/image")
    public UserResponse updateImage(
            @PathVariable("userId") Long userId,
            @ModelAttribute UpdateAvatarRequest updateAvatarRequest
    ) throws UserNotFoundException {
        User user = userService.getById(userId);
        User updatedUser = userService.updateImage(user, updateAvatarRequest.avatar());
        return userMapper.mapToUserResponse(updatedUser);
    }
}
