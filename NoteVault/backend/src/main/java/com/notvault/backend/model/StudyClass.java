package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("classes")
public class StudyClass {
    @Id
    public String id;
    public String name;
    public String subject;
    public String description;
    public String createdBy;
    public Instant createdAt;

    public StudyClass() {
    }

    public StudyClass(String id, String name, String subject, String description, String createdBy,
                      Instant createdAt) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.description = description;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
