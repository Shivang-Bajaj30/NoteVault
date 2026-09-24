package com.notvault.backend.config;

import java.time.Instant;
import java.util.List;

import com.notvault.backend.model.ModeratorRequest;
import com.notvault.backend.model.Note;
import com.notvault.backend.model.Report;
import com.notvault.backend.model.StudyClass;
import com.notvault.backend.model.User;
import com.notvault.backend.security.PasswordHasher;
import com.notvault.backend.service.EventService;
import com.notvault.backend.service.Ids;
import com.notvault.backend.store.ClassRepository;
import com.notvault.backend.store.ModeratorRequestRepository;
import com.notvault.backend.store.NoteRepository;
import com.notvault.backend.store.ReportRepository;
import com.notvault.backend.store.UserRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds demo data once, only when the database is fresh (no users yet).
 * Existing Atlas data is never touched on restart.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private final UserRepository users;
    private final ClassRepository classes;
    private final NoteRepository notes;
    private final ReportRepository reports;
    private final ModeratorRequestRepository requests;
    private final PasswordHasher hasher;
    private final EventService events;

    public DataSeeder(UserRepository users, ClassRepository classes, NoteRepository notes,
                      ReportRepository reports, ModeratorRequestRepository requests,
                      PasswordHasher hasher, EventService events) {
        this.users = users;
        this.classes = classes;
        this.notes = notes;
        this.reports = reports;
        this.requests = requests;
        this.hasher = hasher;
        this.events = events;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return; // database already has data
        }

        Instant now = Instant.now();
        String hash = hasher.hash("password123");

        User admin = new User(Ids.next("user"), "Nova Admin", "admin@notevault.com", hash, "admin",
                "NoteVault HQ", now.minusSeconds(60L * 60 * 24 * 90));

        User trusted = new User(Ids.next("user"), "Aisha Khan", "aisha@notevault.com", hash, "moderator",
                "Northeastern University", now.minusSeconds(60L * 60 * 24 * 40));
        trusted.cleanUploadCount = 6;
        trusted.isTrusted = true;

        User unproven = new User(Ids.next("user"), "Diego Alvarez", "diego@notevault.com", hash, "moderator",
                "University of Texas", now.minusSeconds(60L * 60 * 24 * 12));
        unproven.cleanUploadCount = 2;
        unproven.isTrusted = false;

        User student = new User(Ids.next("user"), "Sam Lee", "student@notevault.com", hash, "student",
                "University of Washington", now.minusSeconds(60L * 60 * 24 * 20));

        users.saveAll(List.of(admin, trusted, unproven, student));

        StudyClass c1 = new StudyClass(Ids.next("class"), "CS 201 — Data Structures", "Computer Science",
                "Core algorithms, trees, graphs, and problem solving.", admin.id, now.minusSeconds(86_400 * 30));
        StudyClass c2 = new StudyClass(Ids.next("class"), "CS 301 — Data Engineering", "Data Engineering",
                "Streaming pipelines, Kafka, and analytics workflows.", admin.id, now.minusSeconds(86_400 * 25));
        StudyClass c3 = new StudyClass(Ids.next("class"), "BIO 110 — Cell Biology", "Biology",
                "Cells, organelles, membranes, and energy cycles.", admin.id, now.minusSeconds(86_400 * 15));
        classes.saveAll(List.of(c1, c2, c3));

        Note n1 = note(Ids.next("note"), "Kafka Fundamentals", "Producer-consumer patterns and event-driven architecture.",
                "Data Engineering", trusted, c2.id, "approved", now.minusSeconds(86_400 * 9));
        n1.tags = new String[] { "kafka", "events" };
        Note n2 = note(Ids.next("note"), "Trust & moderation flows", "How reputation gates uploads in the vault.",
                "System Design", trusted, c2.id, "approved", now.minusSeconds(86_400 * 6));
        n2.tags = new String[] { "moderation", "trust" };
        Note n3 = note(Ids.next("note"), "Binary Trees Cheat Sheet", "Traversal orders and balanced-tree properties in one page.",
                "Computer Science", unproven, c1.id, "approved", now.minusSeconds(86_400 * 3));
        n3.tags = new String[] { "trees", "dsa" };
        Note n4 = note(Ids.next("note"), "Kafka Streams Windowing", "Event-time windows and aggregate semantics for stream jobs.",
                "Data Engineering", unproven, c2.id, "pending", now.minusSeconds(3_600));
        n4.tags = new String[] { "kafka", "streams" };
        Note n5 = note(Ids.next("note"), "Mitosis vs Meiosis", "Side-by-side comparison of the two division processes.",
                "Biology", trusted, c3.id, "approved", now.minusSeconds(86_400 * 2));
        notes.saveAll(List.of(n1, n2, n3, n4, n5));

        Report r1 = new Report();
        r1.id = Ids.next("report");
        r1.noteId = n5.id;
        r1.noteTitle = n5.title;
        r1.reportedBy = student.id;
        r1.reportedByName = student.name;
        r1.reason = "Diagrams look mislabeled — stages don't match the textbook.";
        r1.status = "open";
        r1.createdAt = now.minusSeconds(7_200);
        reports.save(r1);

        ModeratorRequest pendingMod = new ModeratorRequest();
        pendingMod.id = Ids.next("mreq");
        pendingMod.userId = student.id;
        pendingMod.userName = student.name;
        pendingMod.userEmail = student.email;
        pendingMod.status = "pending";
        pendingMod.reason = "I TA two sections of CS 201 and share weekly notes.";
        pendingMod.createdAt = now.minusSeconds(86_400);
        requests.save(pendingMod);

        events.audit(admin, "system.seed", "notevault");
    }

    private Note note(String id, String title, String description, String subject, User uploader,
                      String classId, String status, Instant createdAt) {
        Note note = new Note();
        note.id = id;
        note.title = title;
        note.description = description;
        note.subject = subject;
        note.uploadedBy = uploader.id;
        note.uploadedByName = uploader.name;
        note.classId = classId;
        note.status = status;
        note.createdAt = createdAt;
        note.fileName = title.toLowerCase().replace(' ', '-') + ".pdf";
        note.fileUrl = null; // Seeded examples have metadata only; uploaded files use GridFS.
        note.fileHash = "sha256-" + id;
        return note;
    }
}
