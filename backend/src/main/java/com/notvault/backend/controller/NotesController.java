package com.notvault.backend.controller;

import java.util.Map;

import com.notvault.backend.model.Note;
import com.notvault.backend.model.User;
import com.notvault.backend.security.AuthContext;
import com.notvault.backend.service.NoteService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import java.nio.charset.StandardCharsets;
import com.notvault.backend.service.NoteFileStorage;
import org.springframework.web.bind.annotation.RestController;

/** HTTP layer only: RBAC + request/response mapping. Logic lives in NoteService. */
@RestController
@RequestMapping("/api")
public class NotesController {

    private final NoteService notes;
    private final AuthContext auth;
    private final NoteFileStorage fileStorage;

    public NotesController(NoteService notes, AuthContext auth, NoteFileStorage fileStorage) {
        this.notes = notes;
        this.auth = auth;
        this.fileStorage = fileStorage;
    }

    public record ReviewRequest(String decision) {
    }

    @GetMapping("/notes")
    public Map<String, Object> listNotes(@RequestParam(required = false) String q,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String subject) {
        return Map.of("notes", notes.catalog(q, classId, subject));
    }

    /** Semantic-search stub today; swaps to $vectorSearch when embeddings are wired. */
    @GetMapping("/notes/search")
    public Map<String, Object> semanticSearch(@RequestParam(required = false) String q) {
        return Map.of("notes", notes.catalog(q, null, null));
    }

    @GetMapping("/notes/mine")
    public Map<String, Object> myNotes(HttpServletRequest request) {
        User user = auth.requireRole(request, "moderator", "admin");
        return Map.of("notes", notes.uploadedBy(user));
    }

    @GetMapping("/admin/notes")
    public Map<String, Object> allNotes(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        return Map.of("notes", notes.pendingQueue());
    }

    @PostMapping(value = "/notes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadFile(HttpServletRequest request,
            @RequestParam String title, @RequestParam(required = false) String description,
            @RequestParam(required = false) String subject, @RequestParam(required = false) String classId,
            @RequestParam(required = false) String[] tags, @RequestParam("file") MultipartFile file) {
        User user = auth.requireRole(request, "moderator", "admin");
        NoteService.UploadResult result = notes.upload(user, title, description, subject, classId, tags, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "note", result.note(), "autoPublished", result.autoPublished()));
    }

    @GetMapping("/notes/{id}/file")
    public ResponseEntity<Resource> downloadFile(HttpServletRequest request, @PathVariable String id) {
        Note note = notes.requireLiveNote(id);
        if (!"approved".equals(note.status)) {
            User user = auth.require(request);
            if (!user.id.equals(note.uploadedBy) && !"admin".equals(user.role)) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
        if (note.fileId == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "File is not available");
        }
        NoteFileStorage.StoredFile file = fileStorage.load(note.fileId);
        if (file == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (file.contentType() != null) {
            try { mediaType = MediaType.parseMediaType(file.contentType()); } catch (IllegalArgumentException ignored) { }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(note.fileName, StandardCharsets.UTF_8).build().toString())
                .body(file.resource());
    }

    @PostMapping("/notes/{id}/delete")
    public Map<String, Object> deleteNote(HttpServletRequest request, @PathVariable String id) {
        User user = auth.require(request);
        notes.delete(user, id);
        return Map.of("ok", true);
    }

    @PostMapping("/admin/notes/{id}/review")
    public Map<String, Object> review(HttpServletRequest request, @PathVariable String id,
            @RequestBody ReviewRequest req) {
        User admin = auth.requireRole(request, "admin");
        Note note = notes.review(admin, id, "approve".equalsIgnoreCase(req.decision()));
        return Map.of("note", note);
    }
}
