package ru.urfu.backend.service.impl;

import jakarta.security.auth.message.AuthException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.auth.JwtResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.JsonMapper;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.UserService;

import java.io.IOException;

@Component
public class Oauth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JsonMapper jsonMapper;
    private final AuthService authService;

    @Autowired
    public Oauth2SuccessHandler(
            UserService userService, JsonMapper jsonMapper, AuthService authService) {
        this.userService = userService;
        this.jsonMapper = jsonMapper;
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String githubId = oauthUser.getAttribute("id").toString();

        User user;
        try {
            user = userService.getByGithubId(githubId);
        } catch (UserNotFoundException e) {
            throw new RuntimeException(e);
        }

        try {
            JwtResponse jwtResponse = authService.login(user);
            response.setContentType("application/json");
            response.getWriter().write(jsonMapper.mapToJson(jwtResponse));
        } catch (AuthException e) {
            throw new RuntimeException(e);
        }
    }
}
