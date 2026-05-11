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
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.dto.stack.StackRequest;
import ru.urfu.backend.dto.user.profile.ProfilePassportUpdateRequest;
import ru.urfu.backend.dto.user.profile.ProfileSkillsUpdateDto;
import ru.urfu.backend.dto.user.profile.ProfileUpdateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.NotificationSettings;
import ru.urfu.backend.model.Stack;
import ru.urfu.backend.model.UserStack;
import ru.urfu.backend.model.enums.Role;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.enums.StackType;
import ru.urfu.backend.repository.UserRepository;
import ru.urfu.backend.repository.UserStackRepository;
import ru.urfu.backend.service.FileService;
import ru.urfu.backend.service.NotificationSettingsService;
import ru.urfu.backend.service.StackService;
import ru.urfu.backend.service.UserService;
import ru.urfu.backend.specification.UserSpecification;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserStackRepository userStackRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSpecification userSpecification;
    private final StackService stackService;
    private final FileService fileService;
    private final NotificationSettingsService notificationSettingsService;

    @Autowired
    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserSpecification userSpecification,
            StackService stackService,
            UserStackRepository userStackRepository,
            FileService fileService,
            NotificationSettingsService notificationSettingsService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSpecification = userSpecification;
        this.stackService = stackService;
        this.userStackRepository = userStackRepository;
        this.fileService = fileService;
        this.notificationSettingsService = notificationSettingsService;
    }

    @Transactional(readOnly = true)
    @Override
    public User getByGithubId(String githubId) throws UserNotFoundException {
        return userRepository.findByGithubId(githubId)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional(readOnly = true)
    @Override
    public Page<User> getAll(int page, int size, String filter) {
        Sort sort = Sort.by(
                Sort.Order.by("role").with(Sort.Direction.DESC),
                Sort.Order.by("id").with(Sort.Direction.ASC));

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<User> spec = userSpecification.loginOrEmailContains(filter);
        return userRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public User getByEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("403 FORBIDDEN"));
    }

    @Transactional(readOnly = true)
    @Override
    public User getById(long id) throws UserNotFoundException {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional(readOnly = true)
    @Override
    public User getByVerificationToken(String verificationToken) throws UserNotFoundException {
        return userRepository.findByVerificationToken(verificationToken)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional(readOnly = true)
    @Override
    public User getByPasswordResetToken(String token) throws UserNotFoundException {
        return userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Transactional
    @Override
    public User create(RegisterRequest registerRequest) {
        User user = new User();
        user.setRole(Role.USER);
        user.setEmail(registerRequest.email());
        user.setLogin(registerRequest.login());
        user.setPassword(passwordEncoder.encode(registerRequest.password()));
        user.setNotificationSettings(notificationSettingsService.create(user));

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
        newUser.setAvatarFileTitle(avatar);
        newUser.setNotificationSettings(notificationSettingsService.create(newUser));
        userRepository.save(newUser);
    }

    @Transactional
    @Override
    public User updateImage(User user, MultipartFile imageFile) {
        String oldUserAvatarUrl = user.getAvatarFileTitle();
        if(oldUserAvatarUrl != null){
            fileService.delete(oldUserAvatarUrl);
        }

        String newUserAvatarUrl = fileService.save(imageFile);
        user.setAvatarFileTitle(newUserAvatarUrl);
        userRepository.save(user);

        return user;
    }

    @Transactional
    @Override
    public User deleteImage(User user) {
        String avatarFileTitle = user.getAvatarFileTitle();
        if(avatarFileTitle == null || avatarFileTitle.isEmpty()){
            return user;
        }
        fileService.delete(avatarFileTitle);
        user.setAvatarFileTitle(null);
        return userRepository.save(user);
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

    @Transactional
    @Override
    public User save(User user){
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
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

    @Transactional
    @Override
    public void updateStack(User user, List<StackRequest> stackRequests){
        for(StackRequest stackRequest : stackRequests){
            Stack stack = stackService.getOrUpdate(stackRequest.title(), stackRequest.type());

            UserStack userStack = new UserStack();
            userStack.setStack(stack);
            userStack.setUser(user);
            userStackRepository.save(userStack);
        }
    }

    @Transactional
    @Override
    public User enableUser(User user) {
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void setNullPasswordResetToken(User user){
        user.setPasswordResetToken(null);
        userRepository.save(user);
    }

    @Transactional
    @Override
    public String setPasswordResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        userRepository.save(user);
        return token;
    }

    @Transactional(readOnly = true)
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

    @Transactional
    @Override
    public User updateUser(User user, ProfileUpdateRequest request){
        String fullName = request.name();
        if(fullName != null){
            user.setFullName(fullName);
        }

        MultipartFile avatar = request.avatar();
        if(avatar != null){
            fileService.delete(avatar.getOriginalFilename());
            String avatarFileTitle = fileService.save(avatar);
            user.setAvatarFileTitle(avatarFileTitle);
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isCorrectPassword(String rawPassword, String encodedPassword){
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Transactional
    @Override
    public User updateSkills(User user, ProfileSkillsUpdateDto request) {
        user.getStacks().clear();

        ProfileSkillsUpdateDto.SkillsByGroup skillsByGroup = request.getSkillsByGroup();
        if (skillsByGroup == null) {
            return userRepository.save(user);
        }

        validateSkills(skillsByGroup);

        userStackRepository.flush();

        saveSkills(user, skillsByGroup.getLanguages(), StackType.LANGUAGES);
        saveSkills(user, skillsByGroup.getFrameworks(), StackType.FRAMEWORKS);
        saveSkills(user, skillsByGroup.getTools(), StackType.TOOLS);

        return userRepository.save(user);
    }

    private void validateSkills(ProfileSkillsUpdateDto.SkillsByGroup skillsByGroup) {
        validateGroup(skillsByGroup.getLanguages(), "languages");
        validateGroup(skillsByGroup.getFrameworks(), "frameworks");
        validateGroup(skillsByGroup.getTools(), "tools");
    }

    private void validateGroup(List<String> skills, String groupName) {
        if (skills == null) return;
        Set<String> uniqueValues = new HashSet<>();
        for (String skill : skills) {
            if (skill == null || skill.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Группа навыков '%s' не должна быть пустой".formatted(groupName)
                );
            }
            String normalizedSkill = skill.trim().toLowerCase();
            if (!uniqueValues.add(normalizedSkill)) {
                throw new IllegalArgumentException(
                        "Дубликат навыка '%s' в категории '%s'".formatted(skill, groupName)
                );
            }
        }
    }

    private void saveSkills(User user, List<String> skills, StackType type) {
        if (skills == null || skills.isEmpty()) return;
        for (String skillTitle : skills) {
            Stack stack = stackService.getOrUpdate(skillTitle.trim(), type);
            UserStack userStack = new UserStack();
            userStack.setUser(user);
            userStack.setStack(stack);
            user.getStacks().add(userStack);
        }
    }
}
