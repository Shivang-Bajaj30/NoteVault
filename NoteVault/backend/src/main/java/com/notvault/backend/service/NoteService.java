package com.notvault.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.io.IOException;

import com.notvault.backend.model.Note;
import com.notvault.backend.model.User;
import com.notvault.backend.store.NoteRepository;
import com.notvault.backend.store.UserRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

/**
 * Note domain logic: upload gating by reputation, admin review, soft delete,
 * and catalog filtering. Controllers stay thin; streams jobs can reuse this.
 */
@Service
public class NoteService {

    private static final Sort NEWEST = Sort.by(Sort.Direction.DESC, "createdAt");

    private final NoteRepository notes;
    private final UserRepository users;
    private final TrustService trustService;
    private final EventService events;
    private final NoteFileStorage fileStorage;

    public NoteService(NoteRepository notes, UserRepository users, TrustService trustService, EventService events,
                       NoteFileStorage fileStorage) {
        this.notes = notes;
        this.users = users;
        this.trustService = trustService;
        this.events = events;
        this.fileStorage = fileStorage;
    }

    public record UploadResult(Note note, boolean autoPublished, boolean flaggedForReview) {
    }

    public UploadResult upload(User moderator, String title, String description, String subject,
                               String classId, String[] tags, MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A document file is required");
        }
        if (file.getSize() > 25L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File exceeds the 25 MB limit");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (!name.matches("(?i)^.+\\.(pdf|pptx?|docx?|png|jpe?g)$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported document type");
        }
        String hash;
        try {
            hash = java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(file.getBytes()));
        } catch (NoSuchAlgorithmException | IOException ex) {
            throw new IllegalStateException("Could not verify uploaded file", ex);
        }
        if (!notes.findByFileHashAndIsDeletedFalse(hash).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate file detected (same SHA-256 hash)");
        }
        String fileId = fileStorage.store(file);
        return upload(moderator, title, description, subject, classId, tags,
                name, fileId, hash);
    }

    private UploadResult upload(User moderator, String title, String description, String subject,
                               String classId, String[] tags, String fileName, String fileId, String fileHash) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        boolean autoPublish = trustService.canAutoPublish(moderator);

        Note note = new Note();
        note.id = Ids.next("note");
        note.title = title.trim();
        note.description = description == null ? "" : description.trim();
        note.subject = subject == null || subject.isBlank() ? "General" : subject.trim();
        note.classId = classId;
        note.tags = tags == null ? new String[0] : tags;
        note.fileName = fileName == null || fileName.isBlank()
                ? note.title.toLowerCase(Locale.ROOT).replace(' ', '-') + ".pdf"
                : fileName;
        note.fileId = fileId;
        note.fileUrl = fileId == null ? null : "/api/notes/" + note.id + "/file";
        note.fileHash = fileHash;
        note.uploadedBy = moderator.id;
        note.uploadedByName = moderator.name;
        note.createdAt = Instant.now();
        note.isDeleted = false;

        // SHA-256 duplicate safety net from the spec.
        if (fileHash != null && !notes.findByFileHashAndIsDeletedFalse(note.fileHash).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate file detected (same SHA-256 hash)");
        }

        // Trusted mods publish instantly unless content is near-empty (auto-flag, per spec).
        note.status = autoPublish && note.description.length() >= 20 ? "approved" : "pending";
        boolean flagged = autoPublish && "pending".equals(note.status);

        notes.save(note);

        events.emit("note-events", "note.uploaded", note.id);
        if ("approved".equals(note.status)) {
            events.emit("note-events", "note.approved", note.id);
        } else if (flagged) {
            events.emit("note-events", "note.flagged", note.id);
        }
        events.audit(moderator, "approved".equals(note.status) ? "note.auto_published" : "note.submitted", note.title);

        return new UploadResult(note, "approved".equals(note.status), flagged);
    }

    /** Admin approve/reject of a pending note; approvals feed the trust engine. */
    public Note review(User admin, String noteId, boolean approve) {
        Note note = findLive(noteId);
        if (!"pending".equals(note.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Note is not pending review");
        }
        note.status = approve ? "approved" : "rejected";
        note.reviewedAt = Instant.now();
        notes.save(note);

        if (approve) {
            User uploader = note.uploadedBy == null ? null : users.findById(note.uploadedBy).orElse(null);
            boolean newlyTrusted = trustService.awardCleanUpload(uploader);
            if (newlyTrusted) {
                events.audit(admin, "moderator.trusted", uploader.name);
                events.emit("note-events", "trust.updated", uploader.id);
            }
            events.emit("note-events", "note.approved", note.id);
        } else {
            events.emit("note-events", "note.rejected", note.id);
        }
        events.audit(admin, approve ? "note.approved" : "note.rejected", note.title);
        return note;
    }

    /** Soft delete: owner (moderator) or admin only. */
    public void delete(User actor, String noteId) {
        Note note = findLive(noteId);
        boolean owner = actor.id.equals(note.uploadedBy);
        if (!owner && !"admin".equals(actor.role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own notes");
        }
        note.isDeleted = true;
        notes.save(note);
        events.audit(actor, "note.deleted", note.title);
        events.emit("note-events", "note.deleted", note.id);
    }

    /** Catalog: approved + not deleted, filtered by keyword/class/subject. */
    public List<Note> catalog(String q, String classId, String subject) {
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);

        List<Note> approved;
        if (classId != null && !classId.isBlank()) {
            approved = notes.findByIsDeletedFalseAndStatusAndClassId("approved", classId, NEWEST);
        } else {
            approved = notes.findByIsDeletedFalseAndStatus("approved", NEWEST);
        }

        return approved.stream()
                .filter(n -> subject == null || subject.isBlank() || subject.equalsIgnoreCase(n.subject))
                .filter(n -> matchesKeyword(n, needle))
                .toList();
    }

    private boolean matchesKeyword(Note n, String needle) {
        if (needle.isEmpty()) {
            return true;
        }
        String haystack = (n.title + " " + n.description + " " + n.subject + " "
                + String.join(" ", n.tags == null ? new String[0] : n.tags)).toLowerCase(Locale.ROOT);
        return haystack.contains(needle);
    }

    public List<Note> uploadedBy(User user) {
        return notes.findByIsDeletedFalseAndUploadedBy(user.id, NEWEST);
    }

    public List<Note> pendingQueue() {
        return notes.findByIsDeletedFalseAndStatus("pending", NEWEST);
    }

    public List<Note> allLive() {
        return notes.findByIsDeletedFalse(NEWEST);
    }

    public Note requireLiveNote(String noteId) {
        return findLive(noteId);
    }

    private Note findLive(String noteId) {
        Note note = notes.findById(noteId).orElse(null);
        if (note == null || note.deleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
        }
        return note;
    }
}
