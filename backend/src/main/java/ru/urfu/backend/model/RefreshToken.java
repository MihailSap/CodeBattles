package ru.urfu.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "refresh_token")
public class RefreshToken extends BaseEntity {

    private String body;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public RefreshToken(String body, User user) {
        this.body = body;
        this.user = user;
    }

    public RefreshToken(){

    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
