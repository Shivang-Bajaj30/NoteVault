package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("reports")
public class Report {
    @Id
    public String id;
    public String noteId;
    public String noteTitle;
    public String reportedBy;
    public String reportedByName;
    public String reason;
    public String status; // open | valid | dismissed
    public Instant createdAt;
    public String resolvedBy;
    public Instant resolvedAt;

    public Report() {
    }
}
