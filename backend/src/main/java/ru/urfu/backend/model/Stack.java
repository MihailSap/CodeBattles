package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.enums.StackType;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "stack")
public class Stack extends BaseEntity{

    private String title;

    @Enumerated(EnumType.STRING)
    private StackType type;

    @OneToMany(mappedBy = "stack", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserStack> users = new HashSet<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public StackType getType() {
        return type;
    }

    public void setType(StackType stackType) {
        this.type = stackType;
    }

    public Set<UserStack> getUsers() {
        return users;
    }

    public void setUsers(Set<UserStack> users) {
        this.users = users;
    }
}
