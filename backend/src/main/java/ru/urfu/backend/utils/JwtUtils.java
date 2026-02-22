package ru.urfu.backend.utils;

import io.jsonwebtoken.Claims;
import ru.urfu.backend.model.JwtAuthentication;
import ru.urfu.backend.model.Role;

public class JwtUtils {

    private JwtUtils(){

    }

    public static JwtAuthentication generate(Claims claims) {
        JwtAuthentication jwtInfoToken = new JwtAuthentication();
        jwtInfoToken.setRole(getRole(claims));
        jwtInfoToken.setLogin(claims.get("login", String.class));
        jwtInfoToken.setEmail(claims.getSubject());
        return jwtInfoToken;
    }

    private static Role getRole(Claims claims) {
        String role = claims.get("role", String.class);
        if (role == null) {
            return null;
        }
        return Role.valueOf(role);
    }
}
