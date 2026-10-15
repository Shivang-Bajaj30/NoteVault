package com.notvault.backend.service;

import java.time.Instant;

import com.notvault.backend.model.Note;
import com.notvault.backend.model.Report;
import com.notvault.backend.model.User;
import com.notvault.backend.store.NoteRepository;
import com.notvault.backend.store.ReportRepository;
import com.notvault.backend.store.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Report domain logic. A valid report sends the note back to the review queue
 * and (safety net per spec) resets a trusted moderator's reputation.
 */
@Service
public class ReportService {

    private final ReportRepository reports;
    private final NoteRepository notes;
    private final UserRepository users;
    private final TrustService trustService;
    private final EventService events;

    public ReportService(ReportRepository reports, NoteRepository notes, UserRepository users,
                         TrustService trustService, EventService events) {
        this.reports = reports;
        this.notes = notes;
        this.users = users;
        this.trustService = trustService;
        this.events = events;
    }

    public Report create(User reporter, String noteId, String reason) {
        if (noteId == null || reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason is required to report a note");
        }
        Note note = notes.findById(noteId)
                .filter(n -> !n.deleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));

        Report report = new Report();
        report.id = Ids.next("report");
        report.noteId = note.id;
        report.noteTitle = note.title;
        report.reportedBy = reporter.id;
        report.reportedByName = reporter.name;
        report.reason = reason.trim();
        report.status = "open";
        report.createdAt = Instant.now();
        reports.save(report);
        events.audit(reporter, "report.created", note.title);
        events.emit("note-events", "note.reported", note.id);
        return report;
    }

    public Report resolve(User admin, String reportId, boolean valid) {
        Report report = reports.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        if (!"open".equals(report.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Report already resolved");
        }

        report.status = valid ? "valid" : "dismissed";
        report.resolvedBy = admin.id;
        report.resolvedAt = Instant.now();
        reports.save(report);

        if (valid) {
            Note note = notes.findById(report.noteId).orElse(null);
            if (note != null) {
                note.status = "pending"; // back to the review queue
                notes.save(note);
                User uploader = note.uploadedBy == null ? null : users.findById(note.uploadedBy).orElse(null);
                if (trustService.resetTrust(uploader)) {
                    events.audit(admin, "moderator.trust_reset", uploader.name);
                    events.emit("note-events", "trust.updated", uploader.id);
                }
            }
            events.emit("note-events", "report.valid", report.id);
        } else {
            events.emit("note-events", "report.dismissed", report.id);
        }
        events.audit(admin, valid ? "report.valid" : "report.dismissed", report.noteTitle);
        return report;
    }
}
