package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import ru.urfu.backend.service.GithubClient;
import ru.urfu.backend.service.UserService;

@Service
public class GithubOauth2UserService extends DefaultOAuth2UserService {

    private final GithubClient githubClient;
    private final UserService userService;

    @Autowired
    public GithubOauth2UserService(GithubClient githubClient, UserService userService) {
        this.githubClient = githubClient;
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(userRequest);
        String accessToken = userRequest.getAccessToken().getTokenValue();
        String githubId = oauthUser.getAttribute("id").toString();
        String login = oauthUser.getAttribute("login");
        String email = githubClient.fetchEmail(accessToken);
        String avatar = oauthUser.getAttribute("avatar_url");

        userService.processGithubUser(githubId, login, email, avatar);

        return oauthUser;
    }
}
