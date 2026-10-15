package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Document("notes")
public class Note {
    @Id
    public String id;
    public String title;
    public String description;
    public String subject;
    public String fileUrl;      // signed URL or mock reference
    public String fileName;
    @JsonIgnore
    public String fileId;       // MongoDB GridFS object id
    @JsonIgnore
    public String fileHash;     // SHA-256 for duplicate detection
    public String uploadedBy;
    public String uploadedByName;
    public String classId;
    public String[] tags = {};
    public String status;       // pending | approved | rejected
    public Boolean isDeleted = false;
    public Instant createdAt;
    public Instant reviewedAt;

    public Note() {
    }

    public boolean deleted() {
        return Boolean.TRUE.equals(isDeleted);
    }
}
