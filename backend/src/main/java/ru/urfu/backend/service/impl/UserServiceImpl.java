package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Role;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.UserRepository;
import ru.urfu.backend.service.UserService;
import ru.urfu.backend.specification.UserSpecification;

import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSpecification userSpecification;

    @Autowired
    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserSpecification userSpecification
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSpecification = userSpecification;
    }

    @Override
    public Page<User> getAll(int page, int size, String filter) {
        Sort sort = Sort.by(
                Sort.Order.by("role").with(Sort.Direction.DESC),
                Sort.Order.by("id").with(Sort.Direction.ASC));

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<User> spec = userSpecification.loginOrEmailContains(filter);
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public User getByEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User getById(long id) throws UserNotFoundException {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User getByVerificationToken(String verificationToken) throws UserNotFoundException {
        return userRepository.findByVerificationToken(verificationToken)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User getByPasswordResetToken(String token) throws UserNotFoundException {
        return userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional
    @Override
    public User create(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.email());
        user.setLogin(registerRequest.login());
        user.setPassword(passwordEncoder.encode(registerRequest.password()));
        user.setRole(Role.USER);

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void create(String githubId, String login, String email, String avatar){
        User newUser = new User();
        newUser.setGithubId(githubId);
        newUser.setLogin(login);
        newUser.setEmail(email);
        newUser.setEnabled(true);
        newUser.setPassword("oauth");
        newUser.setRole(Role.USER);
        newUser.setAvatarUrl(avatar);
        userRepository.save(newUser);
    }

    @Transactional
    @Override
    public User makeAdmin(User user) {
        user.setRole(Role.ADMIN);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public User makeNotAdmin(User user) {
        user.setRole(Role.USER);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void delete(User user) {
        userRepository.delete(user);
    }

    @Override
    public User getByGithubId(String githubId) throws UserNotFoundException {
        return userRepository.findByGithubId(githubId)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional
    @Override
    public User save(User user){
        return userRepository.save(user);
    }

    @Override
    public boolean isExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    @Override
    public User updateLogin(User user, String login) {
        user.setLogin(login);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void updatePassword(User user, String newPassword) {
        String newEncodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(newEncodedPassword);
        userRepository.save(user);
    }

    @Override
    public User enableUser(User user) {
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Override
    public void setNullPasswordResetToken(User user){
        user.setPasswordResetToken(null);
        userRepository.save(user);
    }

    @Override
    public String setPasswordResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        userRepository.save(user);
        return token;
    }

    @Override
    public boolean isExistsByGithubId(String githubId) {
        return userRepository.findByGithubId(githubId).isPresent();
    }

    @Transactional
    @Override
    public void processGithubUser(String githubId, String login, String email, String avatar){
        if(isExistsByGithubId(githubId)) return;
        User user;
        try {
            user = getByEmail(email);
            user.setGithubId(githubId);
            userRepository.save(user);
        } catch (UserNotFoundException e) {
            create(githubId, login, email, avatar);
        }
    }
}
