package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.GithubLinkStartResponse;
import ru.urfu.backend.dto.LinkedAccountsResponse;
import ru.urfu.backend.dto.MessageResponse;
import ru.urfu.backend.dto.NotificationSettingsDto;
import ru.urfu.backend.dto.user.profile.*;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.exception.customEx.InvalidCurrentPasswordException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.NotificationSettingsMapper;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.NotificationSettings;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.GithubClient;
import ru.urfu.backend.service.NotificationSettingsService;
import ru.urfu.backend.service.UserService;

import java.time.Duration;

@Tag(name = "Управление профилем")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROFILE)
public class ProfileController {

    public static final String GITHUB_LINK_COOKIE = "github_link_intent";

    @Value("${app.public-url}")
    private String publicUrl;

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final NotificationSettingsService notificationSettingsService;
    private final NotificationSettingsMapper notificationSettingsMapper;
    private final GithubClient githubClient;

    @Autowired
    public ProfileController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper,
            NotificationSettingsService notificationSettingsService,
            NotificationSettingsMapper notificationSettingsMapper,
            GithubClient githubClient
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
        this.notificationSettingsService = notificationSettingsService;
        this.notificationSettingsMapper = notificationSettingsMapper;
        this.githubClient = githubClient;
    }

    @Operation(description = "Получение профиля текущего пользователя")
    @GetMapping("/me")
    public UserResponse getCurrentUserProfile() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return userMapper.mapToUserResponse(user, true);
    }

    @Operation(description = "Получение профиля пользователя по id")
    @GetMapping("/{userId}")
    public UserResponse getUserProfileById(@PathVariable("userId") Long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        return userMapper.mapToUserResponse(user);
    }

    @Operation(description = "Обновление имени и аватара текущего пользователя")
    @PatchMapping("/me")
    public NameAvatarUpdateResponse updateCurrentUserProfile(@ModelAttribute ProfileUpdateRequest request) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        User updatedUser = userService.updateUser(user, request);
        return new NameAvatarUpdateResponse(
                updatedUser.getFullName(), updatedUser.getAvatarFileTitle());
    }

    @Operation(description = "Получение связанных аккаунтов")
    @GetMapping("/me/linked-accounts")
    public LinkedAccountsResponse getLinkedAccounts() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        String githubId = user.getGithubId();
        if (githubId == null) {
            return new LinkedAccountsResponse("");
        }

        String githubLogin = user.getGithubLogin();
        if (githubLogin == null || githubLogin.isBlank()) {
            githubLogin = githubClient.fetchLoginByGithubId(githubId);
            user.setGithubLogin(githubLogin);
            userService.save(user);
        }
        return new LinkedAccountsResponse(githubLogin);
    }

    @Operation(description = "Запуск подтверждённой привязки GitHub к текущему пользователю")
    @PostMapping("/me/linked-accounts/github")
    public GithubLinkStartResponse startGithubLink(HttpServletResponse response) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        String intentToken = userService.createGithubLinkIntent(user);
        ResponseCookie cookie = ResponseCookie.from(GITHUB_LINK_COOKIE, intentToken)
                .httpOnly(true)
                .secure(publicUrl.startsWith("https://"))
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMinutes(10))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return new GithubLinkStartResponse("/oauth2/authorization/github");
    }

    @Operation(description = "Отвязка GitHub от текущего пользователя")
    @DeleteMapping("/me/linked-accounts/github")
    public LinkedAccountsResponse unlinkGithub() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        userService.unlinkGithub(user);
        return new LinkedAccountsResponse("");
    }

    @Operation(description = "Обновление аватара текущего пользователя")
    @PostMapping("/me/avatar")
    public AvatarUpdateResponse uploadAvatar(
            @ModelAttribute UpdateAvatarRequest updateAvatarRequest
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        User updatedUser = userService.updateImage(user, updateAvatarRequest.file());
        return new AvatarUpdateResponse(updatedUser.getAvatarFileTitle());
    }

    @Operation(description = "Удаление аватара текущего пользователя")
    @DeleteMapping("/me/avatar")
    public AvatarUpdateResponse deleteAvatar() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        userService.deleteImage(user);
        return new AvatarUpdateResponse("");
    }

    @Operation(description = "Обновление пароля текущего пользователя")
    @PatchMapping("/me/password")
    public MessageResponse updatePassword(
            @RequestBody ProfilePassportUpdateRequest request) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if(!userService.isCorrectPassword(request.currentPassword(), user.getPassword())){
            throw new InvalidCurrentPasswordException("409 INVALID_CURRENT_PASSWORD");
        }
        userService.updatePassword(user, request.newPassword());
        return new MessageResponse("Пароль успешно обновлён");
    }

    @Operation(description = "Получение настроек уведомлений текущего пользователя")
    @GetMapping("/me/notification-settings")
    public NotificationSettingsDto getNotificationSettings() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if(user.getNotificationSettings() == null){
            notificationSettingsService.create(user);
        }
        NotificationSettings notificationSettings = user.getNotificationSettings();
        return notificationSettingsMapper.mapToNotificationSettingsDto(notificationSettings);
    }

    @Operation(description = "Обновление настроек уведомлений текущего пользователя")
    @PutMapping("/me/notification-settings")
    public NotificationSettingsDto updateNotificationSettings(@RequestBody NotificationSettingsDto request)
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if(user.getNotificationSettings() == null){
            notificationSettingsService.create(user);
        }
        NotificationSettings notificationSettings = notificationSettingsService.update(
                user.getNotificationSettings(), request);
        return notificationSettingsMapper.mapToNotificationSettingsDto(notificationSettings);
    }
}
