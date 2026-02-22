package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Role;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.UserRepository;
import ru.urfu.backend.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User getByEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User create(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.email());
        user.setLogin(registerRequest.login());
        user.setPassword(passwordEncoder.encode(registerRequest.password()));
        user.setRole(Role.USER);
        return userRepository.save(user);
    }

    public User save(User user){
        return userRepository.save(user);
    }

    @Override
    public boolean isExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
