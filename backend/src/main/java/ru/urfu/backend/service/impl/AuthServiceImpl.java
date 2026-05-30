package ru.urfu.backend.service.impl;

import io.jsonwebtoken.Claims;
import jakarta.security.auth.message.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.auth.PasswordResetRequest;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.dto.auth.LoginRequest;
import ru.urfu.backend.dto.auth.JwtResponse;
import ru.urfu.backend.exception.customEx.AccountNotEnabledException;
import ru.urfu.backend.exception.customEx.InvalidRefreshTokenException;
import ru.urfu.backend.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.backend.exception.customEx.UserAlreadyExistsException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.RefreshToken;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.EmailService;
import ru.urfu.backend.service.RefreshTokenService;
import ru.urfu.backend.service.UserService;


@Service
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public AuthServiceImpl(
            UserService userService,
            JwtProvider jwtProvider,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.userService = userService;
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    @Override
    public User register(RegisterRequest request) throws UserAlreadyExistsException {
        if (userService.isExistsByEmail(request.email())) {
            throw new UserAlreadyExistsException(
                    "Невозможно зарегистрировать пользователя под данным email");
        }
        User user = userService.create(request);
        emailService.sendEmailConfirmEmail(user.getEmail(), user.getVerificationToken());
        return user;
    }

    @Override
    public boolean isCredentialsValid(LoginRequest authRequest, User user) throws AccountNotEnabledException {
        if(!user.isEnabled()){
            throw new AccountNotEnabledException("Аккаунт не подтвержден");
        }
        return passwordEncoder.matches(authRequest.password(), user.getPassword());
    }

    @Transactional(rollbackFor = AuthException.class)
    @Override
    public JwtResponse verifyEmail(String token) throws UserNotFoundException, AuthException {
        User user = userService.getByVerificationToken(token);
        User enabledUser = userService.enableUser(user);
        return login(enabledUser);
    }

    @Transactional
    @Override
    public JwtResponse login(User user) throws AuthException {
        String accessTokenBody = jwtProvider.generateAccessToken(user);
        String refreshTokenBody = jwtProvider.generateRefreshToken(user);

        if(user.getRefreshToken() != null){
            user.getRefreshToken().setBody(refreshTokenBody);
        } else {
            user.setRefreshToken(new RefreshToken(refreshTokenBody, user));
        }

        userService.save(user);
        return new JwtResponse(accessTokenBody, refreshTokenBody);
    }

    @Transactional
    @Override
    public void logout(String refreshTokenBody) throws RefreshTokenNotFoundException {
        RefreshToken refreshToken = refreshTokenService.getByBody(refreshTokenBody);
        User user = refreshToken.getUser();
        user.setRefreshToken(null);
        refreshTokenService.delete(refreshToken);
    }

    @Override
    public JwtResponse getAccessToken(String refreshToken) throws UserNotFoundException, RefreshTokenNotFoundException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String email = claims.getSubject();
            User user = userService.getByEmail(email);
            RefreshToken saveRefreshToken = refreshTokenService.getByUser(user);
            if (saveRefreshToken != null && refreshToken.equals(saveRefreshToken.getBody())) {
                final String accessToken = jwtProvider.generateAccessToken(user);
                return new JwtResponse(accessToken, null);
            }
        }
        return new JwtResponse(null, null);
    }

    @Transactional
    @Override
    public JwtResponse refresh(String refreshToken)
            throws UserNotFoundException, RefreshTokenNotFoundException, InvalidRefreshTokenException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            String email = claims.getSubject();
            User user = userService.getByEmail(email);
            RefreshToken saveRefreshRefreshToken = refreshTokenService.getByUser(user);
            if (refreshToken.equals(saveRefreshRefreshToken.getBody())) {
                String accessToken = jwtProvider.generateAccessToken(user);
                String newRefreshToken = jwtProvider.generateRefreshToken(user);

                saveRefreshRefreshToken.setBody(newRefreshToken);
                refreshTokenService.save(saveRefreshRefreshToken);
                return new JwtResponse(accessToken, newRefreshToken);
            }
        }
        throw new InvalidRefreshTokenException("Невалидный JWT токен");
    }

    @Override
    public User getAuthenticatedUser() throws UserNotFoundException {
        String email = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        return userService.getByEmail(email);
    }

    @Transactional
    @Override
    public void requestPasswordReset(String email) throws UserNotFoundException {
        User user = userService.getByEmail(email);
        String token = userService.setPasswordResetToken(user);
        emailService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    @Override
    public void resetPassword(PasswordResetRequest request) throws UserNotFoundException {
        User user = userService.getByPasswordResetToken(request.token());
        userService.updatePassword(user, request.password());
        userService.setNullPasswordResetToken(user);
    }
}
