package ru.urfu.backend.service.impl;

import jakarta.security.auth.message.AuthException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import ru.urfu.backend.controller.ProfileController;
import ru.urfu.backend.dto.auth.JwtResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.UserService;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;

@Component
public class Oauth2SuccessHandler implements AuthenticationSuccessHandler {

    @Value("${app.public-url}")
    private String publicUrl;

    private final UserService userService;
    private final AuthService authService;

    @Autowired
    public Oauth2SuccessHandler(
            UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String githubId = oauthUser.getAttribute("id").toString();
        String githubLogin = oauthUser.getAttribute("login");
        String email = oauthUser.getAttribute("verified_email");
        String avatar = oauthUser.getAttribute("avatar_url");

        String linkIntent = request.getCookies() == null ? null : Arrays.stream(request.getCookies())
                .filter(cookie -> ProfileController.GITHUB_LINK_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);

        if (linkIntent != null && !linkIntent.isBlank()) {
            clearLinkIntentCookie(response);
            try {
                userService.completeGithubLink(linkIntent, githubId, githubLogin);
                response.sendRedirect("%s/profile?githubLinked=success".formatted(publicUrl));
            } catch (RuntimeException exception) {
                response.sendRedirect("%s/profile?githubLinked=error".formatted(publicUrl));
            }
            return;
        }

        User user;
        try {
            userService.processGithubUser(githubId, githubLogin, email, avatar);
            user = userService.getByGithubId(githubId);
        } catch (UserNotFoundException e) {
            throw new RuntimeException(e);
        }

        try {
            JwtResponse jwtResponse = authService.login(user);
            String redirectUrl = "%s/login?accessToken=%s&refreshToken=%s".formatted(
                    publicUrl, jwtResponse.accessToken(), jwtResponse.refreshToken());
            response.sendRedirect(redirectUrl);
        } catch (AuthException e) {
            throw new RuntimeException(e);
        }
    }

    private void clearLinkIntentCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(ProfileController.GITHUB_LINK_COOKIE, "")
                .httpOnly(true)
                .secure(publicUrl.startsWith("https://"))
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
