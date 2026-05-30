package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import ru.urfu.backend.service.GithubClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class GithubOauth2UserService extends DefaultOAuth2UserService {

    private final GithubClient githubClient;
    @Autowired
    public GithubOauth2UserService(GithubClient githubClient) {
        this.githubClient = githubClient;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(userRequest);
        String accessToken = userRequest.getAccessToken().getTokenValue();
        String githubId = oauthUser.getAttribute("id").toString();
        String email = githubClient.fetchEmail(accessToken);
        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("id", githubId);
        attributes.put("verified_email", email);
        return new DefaultOAuth2User(oauthUser.getAuthorities(), attributes, "login");
    }
}
