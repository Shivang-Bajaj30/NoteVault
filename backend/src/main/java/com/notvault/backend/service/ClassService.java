package com.notvault.backend.service;

import java.time.Instant;

import com.notvault.backend.model.StudyClass;
import com.notvault.backend.model.User;
import com.notvault.backend.store.ClassRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClassService {

    private final ClassRepository classes;
    private final EventService events;

    public ClassService(ClassRepository classes, EventService events) {
        this.classes = classes;
        this.events = events;
    }

    /** Class creation is admin-only per the spec. */
    public StudyClass create(User admin, String name, String subject, String description) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class name is required");
        }
        StudyClass created = new StudyClass(Ids.next("class"), name.trim(),
                subject == null || subject.isBlank() ? "General" : subject.trim(),
                description == null ? "" : description.trim(),
                admin.id, Instant.now());
        classes.save(created);
        events.audit(admin, "class.created", created.name);
        events.emit("user-events", "class.created", created.id);
        return created;
    }
}
