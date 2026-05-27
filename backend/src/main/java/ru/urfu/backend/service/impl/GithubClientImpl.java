package ru.urfu.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import ru.urfu.backend.service.GithubClient;
import ru.urfu.backend.dto.solution.GithubPullRequestOptionResponse;
import ru.urfu.backend.dto.solution.SolutionGitPullRequestDto;
import ru.urfu.backend.exception.globalEx.InvalidException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GithubClientImpl implements GithubClient {

    private static final Pattern PULL_REQUEST_URL = Pattern.compile(
            "^https://github\\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/pull/(\\d+)/?$");

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

    @Override
    public String fetchLoginByGithubId(String githubId) {
        ResponseEntity<Map<String, Object>> response =
                restTemplate.exchange(
                        "https://api.github.com/user/" + githubId,
                        HttpMethod.GET,
                        null,
                        new ParameterizedTypeReference<>() {}
                );

        Map<String, Object> body = response.getBody();
        if (body == null || body.get("login") == null) {
            throw new RuntimeException("GitHub аккаунт не найден");
        }

        return body.get("login").toString();
    }

    @Override
    public SolutionGitPullRequestDto resolvePullRequest(String pullRequestUrl) throws InvalidException {
        Matcher matcher = PULL_REQUEST_URL.matcher(pullRequestUrl == null ? "" : pullRequestUrl.trim());
        if (!matcher.matches()) {
            throw new InvalidException("Укажите ссылку GitHub pull request вида https://github.com/owner/repo/pull/123");
        }

        String owner = matcher.group(1);
        String repository = matcher.group(2);
        String pullRequestNumber = matcher.group(3);
        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(
                    "https://api.github.com/repos/%s/%s/pulls/%s".formatted(owner, repository, pullRequestNumber),
                    HttpMethod.GET,
                    new HttpEntity<>(new HttpHeaders()),
                    JsonNode.class
            );
        } catch (RuntimeException exception) {
            throw new InvalidException("Не удалось получить public pull request с GitHub");
        }

        JsonNode body = response.getBody();
        if (body == null || body.path("html_url").asText().isBlank()) {
            throw new InvalidException("GitHub pull request не найден");
        }

        JsonNode baseRepository = body.path("base").path("repo");

        return new SolutionGitPullRequestDto(
                baseRepository.path("id").asText(),
                baseRepository.path("clone_url").asText(),
                body.path("id").asText(),
                body.path("number").asInt(),
                "refs/pull/" + body.path("number").asInt() + "/head",
                body.path("base").path("ref").asText(),
                body.path("html_url").asText()
        );
    }

    @Override
    public List<GithubPullRequestOptionResponse> fetchOpenPullRequestsByAuthor(String githubLogin) {
        java.net.URI url = UriComponentsBuilder.fromUriString("https://api.github.com/search/issues")
                .queryParam("q", "is:pr is:open author:" + githubLogin)
                .queryParam("sort", "updated")
                .queryParam("order", "desc")
                .queryParam("per_page", 10)
                .build()
                .encode()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "CodeBattles-Backend");

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        List<GithubPullRequestOptionResponse> pullRequests = new ArrayList<>();
        JsonNode items = response.getBody() == null ? null : response.getBody().path("items");
        if (items == null || !items.isArray()) {
            return pullRequests;
        }

        for (JsonNode item : items) {
            pullRequests.add(new GithubPullRequestOptionResponse(
                    item.path("title").asText(),
                    item.path("html_url").asText(),
                    item.path("number").asInt()
            ));
        }
        return pullRequests;
    }
}
