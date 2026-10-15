package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("moderatorRequests")
public class ModeratorRequest {
    @Id
    public String id;
    public String userId;
    public String userName;
    public String userEmail;
    public String status; // pending | approved | rejected
    public String reason;
    public Instant createdAt;
    public String reviewedBy;
    public Instant reviewedAt;

    public ModeratorRequest() {
    }
}
