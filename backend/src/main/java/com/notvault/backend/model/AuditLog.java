package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("auditLogs")
public class AuditLog {
    @Id
    public String id;
    public String userId;
    public String userName;
    public String action;
    public String target;
    public Instant createdAt;

    public AuditLog() {
    }
}
