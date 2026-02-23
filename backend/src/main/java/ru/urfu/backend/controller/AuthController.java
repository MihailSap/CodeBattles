package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.security.auth.message.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.auth.*;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.exception.customEx.*;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.EmailService;
import ru.urfu.backend.service.UserService;

@Tag(name = "Управление аутентификацией")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.AUTH)
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Autowired
    public AuthController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper,
            EmailService emailService
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
        this.emailService = emailService;
    }

    @Operation(description = "Регистрация нового пользователя по электронной почте")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/register")
    public UserResponse register(@RequestBody RegisterRequest request)
            throws UserAlreadyExistsException {
        if(userService.isExistsByEmail(request.email())){
            throw new UserAlreadyExistsException(
                    "Невозможно зарегистрировать пользователя под данным email");
        }
        User user = userService.create(request);
        emailService.sendEmailConfirmEmail(user.getEmail(), user.getVerificationToken());
        return userMapper.mapToUserResponse(user);
    }

    @Operation(description = "Вход пользователя в существующий аккаунт, получение токенов")
    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest authRequest)
            throws AuthException, InvalidCredentialsException, UserNotFoundException, AccountNotEnabledException {
        User user = userService.getByEmail(authRequest.email());
        if(authService.isCredentialsValid(authRequest, user)){
            return authService.login(user);
        }
        throw new InvalidCredentialsException("Ошибка входа");
    }

    @Operation(description = "Получение нового access-токена по refresh-токену")
    @PostMapping("/token")
    public JwtResponse getNewAccessToken(@RequestBody RefreshJwtRequest request)
            throws UserNotFoundException, RefreshTokenNotFoundException {
        return authService.getAccessToken(request.refreshToken());
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Замена использованного refresh-токена на новый")
    @PostMapping("/refresh")
    public JwtResponse getNewRefreshToken(@RequestBody RefreshJwtRequest request)
            throws AuthException, UserNotFoundException, InvalidRefreshTokenException, RefreshTokenNotFoundException {
        return authService.refresh(request.refreshToken());
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Выход пользователя из аккаунта - удаление токенов")
    @PostMapping("/logout")
    public String logout(@RequestBody RefreshJwtRequest request)
            throws RefreshTokenNotFoundException {
        authService.logout(request.refreshToken());
        return "Вы вышли из аккаунта";
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Получение авторизованного пользователя")
    @GetMapping("/current-user")
    public UserResponse getCurrentUser() throws UserNotFoundException {
        String personEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(personEmail);
        return userMapper.mapToUserResponse(user);
    }

    @Operation(description = "Подтверждение почты по токену из письма")
    @PostMapping("/verify-email")
    public JwtResponse verifyEmail(@RequestParam("token") String token)
            throws UserNotFoundException, AuthException {
        User user = userService.getByVerificationToken(token);
        User enabledUser = userService.enableUser(user);
        return authService.login(enabledUser);
    }

    @Operation(description = "Восстановление аккаунта с забытым паролем")
    @PostMapping("/forgot-password")
    public String requestForResetPassword(@RequestParam("email") String email)
            throws UserNotFoundException {
        User user = userService.getByEmail(email);
        String token = userService.setPasswordResetToken(user);
        emailService.sendPasswordResetEmail(email, token);
        return "Запрос на обновление пароля отправлен на указанный email";
    }

    @Operation(description = "Смена пароля при восстановлении")
    @PatchMapping("/reset-password")
    public String resetPassword(@RequestBody PasswordResetRequest resetPasswordDTO)
            throws UserNotFoundException {
        User user = userService.getByPasswordResetToken(resetPasswordDTO.token());
        userService.setNullPasswordResetToken(user);
        userService.updatePassword(user, resetPasswordDTO.password());
        return "Пароль успешно обновлен";
    }
}
