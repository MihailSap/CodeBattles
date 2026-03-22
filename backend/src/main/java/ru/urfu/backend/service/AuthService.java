package ru.urfu.backend.service;

import jakarta.security.auth.message.AuthException;
import ru.urfu.backend.dto.auth.LoginRequest;
import ru.urfu.backend.dto.auth.JwtResponse;
import ru.urfu.backend.exception.customEx.AccountNotEnabledException;
import ru.urfu.backend.exception.customEx.InvalidRefreshTokenException;
import ru.urfu.backend.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

public interface AuthService {

    boolean isCredentialsValid(LoginRequest authRequest, User user) throws AccountNotEnabledException;

    JwtResponse login(User user) throws AuthException;

    void logout(String refreshTokenBody) throws RefreshTokenNotFoundException;

    JwtResponse getAccessToken(String refreshToken) throws UserNotFoundException, RefreshTokenNotFoundException;

    JwtResponse refresh(String refreshToken) throws AuthException, UserNotFoundException, RefreshTokenNotFoundException, InvalidRefreshTokenException;

    String getAuthenticatedUserEmail();
}
