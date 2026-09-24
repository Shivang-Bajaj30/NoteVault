package com.notvault.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Mirror of a Kafka event: in production these are published to the Aiven Kafka
 * topics (note-events, user-events, search-events, download-events, audit-stream).
 * Persisted so the admin Streams view survives restarts.
 */
@Document("streamEvents")
public class StreamEvent {
    @Id
    public String id;
    public String topic;   // note-events | user-events | search-events | download-events | audit-stream
    public String type;    // e.g. note.uploaded, trust.updated
    public String payload;
    public Instant createdAt;

    public StreamEvent() {
    }
}
