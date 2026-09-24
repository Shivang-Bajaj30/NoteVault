package com.notvault.backend.model;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {
    @Id
    public String id;
    public String name;
    @Indexed(unique = true)
    public String email;
    @JsonIgnore
    public String passwordHash;
    public String role; // student | moderator | admin
    public String university;
    public Instant createdAt;

    // Moderator-only reputation fields
    public Integer cleanUploadCount = 0;
    public Boolean isTrusted = false;

    public static final int TRUST_THRESHOLD = 5;

    public User() {
    }

    public User(String id, String name, String email, String passwordHash, String role,
                String university, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.university = university;
        this.createdAt = createdAt;
    }

    // Mongo-friendly accessors (fields may deserialize as null)
    public int cleanCount() {
        return cleanUploadCount == null ? 0 : cleanUploadCount;
    }

    public boolean trusted() {
        return Boolean.TRUE.equals(isTrusted);
    }
}
