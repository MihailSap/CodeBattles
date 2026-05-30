package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.backend.dto.auth.RegisterRequest;
import ru.urfu.backend.dto.stack.StackRequest;
import ru.urfu.backend.dto.user.profile.ProfileSkillsUpdateDto;
import ru.urfu.backend.dto.user.profile.ProfileUpdateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

import java.util.List;

public interface UserService {

    void create(String githubId, String login, String email, String avatar);

    User create(RegisterRequest registerRequest);

    User save(User user);

    Page<User> getAll(int page, int size, String filter);

    User getByEmail(String email) throws UserNotFoundException;

    User getById(long id) throws UserNotFoundException;

    User getByGithubId(String githubId) throws UserNotFoundException;

    User getByVerificationToken(String verificationToken) throws UserNotFoundException;

    User getByPasswordResetToken(String token) throws UserNotFoundException;

    User updateLogin(User user, String login);

    void updatePassword(User user, String newPassword);

    User enableUser(User user);

//    User resetRating(User user);

    User makeAdmin(User user);

    void updateStack(User user, List<StackRequest> stackRequests);

    User updateUser(User user, ProfileUpdateRequest request);

    User updateSkills(User user, ProfileSkillsUpdateDto request);

    User makeNotAdmin(User user);

    User updateImage(User user, MultipartFile imageFile);

    User deleteImage(User user);

    void processGithubUser(String githubId, String login, String email, String avatar);

    String createGithubLinkIntent(User user);

    User completeGithubLink(String intentToken, String githubId, String githubLogin);

    User unlinkGithub(User user);

    void setNullPasswordResetToken(User user);

    String setPasswordResetToken(User user);

    void delete(User user);

    boolean isExistsByGithubId(String githubId);

    boolean isExistsByEmail(String email);

    boolean isCorrectPassword(String rawPassword, String encodedPassword);
}
