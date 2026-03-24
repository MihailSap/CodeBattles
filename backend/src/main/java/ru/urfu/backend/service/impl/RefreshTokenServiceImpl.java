package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.backend.model.RefreshToken;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.RefreshTokenRepository;
import ru.urfu.backend.service.RefreshTokenService;

import java.util.Optional;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Autowired
    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public RefreshToken getByBody(String body) throws RefreshTokenNotFoundException {
        return refreshTokenRepository.findByBody(body)
                .orElseThrow(() -> new RefreshTokenNotFoundException(
                        "Запрашиваемый токен некорректен"));
    }

    @Override
    public RefreshToken getByUser(User user) throws RefreshTokenNotFoundException {
        return refreshTokenRepository.findByUser(user)
                .orElseThrow(() -> new RefreshTokenNotFoundException(
                        "Ошибка при попытке получения токена пользователя"));
    }

    @Transactional
    @Override
    public RefreshToken save(RefreshToken refreshToken){
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    @Override
    public void delete(RefreshToken refreshToken){
        refreshTokenRepository.delete(refreshToken);
    }
}
