package ru.urfu.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.model.JwtAuthentication;
import ru.urfu.backend.service.AuthService;

@RestController
@RequestMapping(PathsConstants.ROOT)
public class HelloController {

    private final AuthService authService;

    @Autowired
    public HelloController(AuthService authService) {
        this.authService = authService;
    }

    @PreAuthorize("hasAuthority('USER')")
    @GetMapping("/hello/user")
    public ResponseEntity<String> helloUser() {
        JwtAuthentication authInfo = authService.getAuthInfo();
        return ResponseEntity.ok("Hello user " + authInfo.getPrincipal() + "!");
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/hello/admin")
    public ResponseEntity<String> helloAdmin() {
        JwtAuthentication authInfo = authService.getAuthInfo();
        return ResponseEntity.ok("Hello admin " + authInfo.getPrincipal() + "!");
    }
}
