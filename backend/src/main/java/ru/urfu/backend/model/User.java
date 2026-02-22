package ru.urfu.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User extends BaseEntity{

    private String login;

    private String email;

    private String password;

    private Role role;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private RefreshToken refreshToken;

    public User(String login, String email, String password, Role roles) {
        this.login = login;
        this.email = email;
        this.password = password;
        this.role = roles;
    }

    public User() {
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public RefreshToken getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(RefreshToken refreshToken) {
        this.refreshToken = refreshToken;
    }
}
