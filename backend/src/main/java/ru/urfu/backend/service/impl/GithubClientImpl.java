package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ru.urfu.backend.service.GithubClient;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class GithubClientImpl implements GithubClient {

    private final RestTemplate restTemplate;

    @Autowired
    public GithubClientImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String fetchEmail(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<?> entity = new HttpEntity<>(headers);
        ResponseEntity<List<Map<String, Object>>> response =
                restTemplate.exchange(
                        "https://api.github.com/user/emails",
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<>() {}
                );

        return Objects.requireNonNull(response.getBody()).stream()
                .filter(email -> Boolean.TRUE.equals(email.get("primary")))
                .map(email -> email.get("email").toString())
                .findFirst()
                .orElse(null);
    }
}
