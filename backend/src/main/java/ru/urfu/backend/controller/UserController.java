package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.PagedResponse;
import ru.urfu.backend.dto.user.UpdatePasswordRequest;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.dto.user.UpdateLoginRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.PageMapper;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.UserService;

@Tag(name = "Управление пользователями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.USERS)
public class UserController {

    private final UserService userService;

    private final UserMapper userMapper;

    private final PageMapper pageMapper;

    @Autowired
    public UserController(
            UserService userService,
            UserMapper userMapper, PageMapper pageMapper
    ) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.pageMapper = pageMapper;
    }

    @Operation(description = "Смена логина пользователя")
    @PatchMapping("/{userId}/login")
    public UserResponse updateLogin(
            @PathVariable("userId") long userId, @RequestBody UpdateLoginRequest updateLoginRequest)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        User updatedUser = userService.updateLogin(user, updateLoginRequest.newLogin());
        return userMapper.mapToUserResponse(updatedUser);
    }

    @Operation(description = "Смена пароля пользователя")
    @PatchMapping("/{userId}/password")
    public String updatePassword(
            @PathVariable("userId") long userId, @RequestBody UpdatePasswordRequest updatePasswordRequest)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        userService.updatePassword(user, updatePasswordRequest.newPassword());
        return "Пароль успешно обновлён";
    }

    @Operation(description = "Получение всех пользователей с пагинацией")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public PagedResponse<UserResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String filter
    ){
        Page<UserResponse> users = userService.getAll(page, size, filter)
                .map(userMapper::mapToUserResponse);
        return pageMapper.mapToPagedResponse(users);
    }

    @Operation(description = "Получение пользователя по id")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/{userId}")
    public UserResponse getById(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        return userMapper.mapToUserResponse(user);
    }

    @Operation(description = "Удаление пользователя")
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{userId}")
    public String delete(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        userService.delete(user);
        return "Пользователь удален";
    }

    @Operation(description = "Добавление пользователю роли 'ADMIN'")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/admin")
    public UserResponse makeAdmin(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        User updatedUser = userService.makeAdmin(user);
        return userMapper.mapToUserResponse(updatedUser);
    }

    @Operation(description = "Удаление у пользователя роли 'ADMIN'")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/not-admin")
    public UserResponse makeNotAdmin(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        User updatedUser = userService.makeNotAdmin(user);
        return userMapper.mapToUserResponse(updatedUser);
    }
}
