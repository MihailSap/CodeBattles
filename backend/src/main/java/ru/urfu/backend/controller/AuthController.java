package ru.urfu.backend.controller;

import jakarta.security.auth.message.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.auth.JwtRequest;
import ru.urfu.backend.dto.auth.JwtResponse;
import ru.urfu.backend.dto.auth.RefreshJwtRequest;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.exception.customEx.*;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.UserService;

@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.AUTH)
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;

    @Autowired
    public AuthController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/register")
    public UserResponse register(@RequestBody RegisterRequest request) throws UserAlreadyExistsException {
        if(userService.isExistsByEmail(request.email())){
            throw new UserAlreadyExistsException(
                    "Невозможно зарегистрировать пользователя под данным email");
        }
        User user = userService.create(request);
        return userMapper.mapToUserResponse(user);
    }

    @PostMapping("/login")
    public JwtResponse login(@RequestBody JwtRequest authRequest)
            throws AuthException, InvalidCredentialsException, UserNotFoundException {
        User user = userService.getByEmail(authRequest.email());
        if(authService.isCredentialsValid(authRequest, user)){
            return authService.login(user);
        }
        throw new InvalidCredentialsException("Ошибка входа");
    }

    @PostMapping("/token")
    public JwtResponse getNewAccessToken(@RequestBody RefreshJwtRequest request)
            throws UserNotFoundException, RefreshTokenNotFoundException {
        return authService.getAccessToken(request.refreshToken());
    }

    @PostMapping("/refresh")
    public JwtResponse getNewRefreshToken(@RequestBody RefreshJwtRequest request)
            throws AuthException, UserNotFoundException, InvalidRefreshTokenException, RefreshTokenNotFoundException {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public String logout(@RequestBody RefreshJwtRequest request)
            throws RefreshTokenNotFoundException {
        authService.logout(request.refreshToken());
        return "Вы вышли из аккаунта";
    }
}
