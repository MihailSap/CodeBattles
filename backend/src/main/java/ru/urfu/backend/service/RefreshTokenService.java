package ru.urfu.backend.service;

import ru.urfu.backend.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.backend.model.RefreshToken;
import ru.urfu.backend.model.User;

import java.util.Optional;

public interface RefreshTokenService {

    RefreshToken getByBody(String body) throws RefreshTokenNotFoundException;

    RefreshToken getByUser(User user) throws RefreshTokenNotFoundException;

    RefreshToken save(RefreshToken refreshToken);

    void delete(RefreshToken refreshToken);
}
