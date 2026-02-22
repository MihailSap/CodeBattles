package ru.urfu.backend.filter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.GenericFilterBean;
import ru.urfu.backend.model.JwtAuthentication;
import ru.urfu.backend.service.impl.JwtProvider;
import ru.urfu.backend.utils.JwtUtils;

import java.io.IOException;

@Component
public class JwtFilter extends GenericFilterBean {

    private static final String AUTHORIZATION = "Authorization";

    private final JwtProvider jwtProvider;

    public JwtFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain fc)
            throws IOException, ServletException {
        final String token = getTokenFromRequest((HttpServletRequest) request);
        if (token != null && jwtProvider.validateAccessToken(token)) {
            final Claims claims = jwtProvider.getAccessClaims(token);
            JwtAuthentication jwtInfoToken = JwtUtils.generate(claims);
            jwtInfoToken.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(jwtInfoToken);
        }
        fc.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        final String bearer = request.getHeader(AUTHORIZATION);
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
