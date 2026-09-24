package com.notvault.backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.notvault.backend.model.Report;
import com.notvault.backend.model.StudyClass;
import com.notvault.backend.model.User;
import com.notvault.backend.security.AuthContext;
import com.notvault.backend.service.ClassService;
import com.notvault.backend.service.ModeratorVerificationService;
import com.notvault.backend.service.ReportService;
import com.notvault.backend.store.ClassRepository;
import com.notvault.backend.store.ModeratorRequestRepository;
import com.notvault.backend.store.NoteRepository;
import com.notvault.backend.store.ReportRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** HTTP layer for classes, reports, and moderator verification. */
@RestController
@RequestMapping("/api")
public class CommunityController {

    private static final Sort NEWEST = Sort.by(Sort.Direction.DESC, "createdAt");

    private final AuthContext auth;
    private final ClassService classes;
    private final ReportService reportService;
    private final ModeratorVerificationService verifications;
    private final ClassRepository classRepo;
    private final NoteRepository noteRepo;
    private final ReportRepository reportRepo;
    private final ModeratorRequestRepository requestRepo;

    public CommunityController(AuthContext auth, ClassService classes, ReportService reportService,
                               ModeratorVerificationService verifications, ClassRepository classRepo,
                               NoteRepository noteRepo, ReportRepository reportRepo,
                               ModeratorRequestRepository requestRepo) {
        this.auth = auth;
        this.classes = classes;
        this.reportService = reportService;
        this.verifications = verifications;
        this.classRepo = classRepo;
        this.noteRepo = noteRepo;
        this.reportRepo = reportRepo;
        this.requestRepo = requestRepo;
    }

    public record ClassRequest(String name, String subject, String description) {
    }

    public record ReportRequest(String noteId, String reason) {
    }

    public record ResolveReportRequest(String decision) {
    }

    public record ModeratorReviewRequest(String decision) {
    }

    // ---------- Classes ----------

    @GetMapping("/classes")
    public Map<String, Object> listClasses() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (StudyClass c : classRepo.findAll(NEWEST)) {
            long noteCount = noteRepo.findByIsDeletedFalseAndStatusAndClassId("approved", c.id, Sort.unsorted()).size();
            out.add(Map.of(
                    "id", c.id,
                    "name", c.name,
                    "subject", c.subject,
                    "description", c.description == null ? "" : c.description,
                    "noteCount", noteCount));
        }
        return Map.of("classes", out);
    }

    @PostMapping("/classes")
    public Map<String, Object> createClass(HttpServletRequest request, @RequestBody ClassRequest req) {
        User admin = auth.requireRole(request, "admin");
        StudyClass created = classes.create(admin, req.name(), req.subject(), req.description());
        return Map.of("class", Map.of(
                "id", created.id,
                "name", created.name,
                "subject", created.subject,
                "description", created.description,
                "noteCount", 0));
    }

    // ---------- Reports ----------

    @GetMapping("/reports")
    public Map<String, Object> listReports(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        return Map.of("reports", reportRepo.findAll(NEWEST));
    }

    @PostMapping("/reports")
    public Map<String, Object> createReport(HttpServletRequest request, @RequestBody ReportRequest req) {
        User user = auth.require(request);
        return Map.of("report", reportService.create(user, req.noteId(), req.reason()));
    }

    @PostMapping("/reports/{id}/resolve")
    public Map<String, Object> resolveReport(HttpServletRequest request, @PathVariable String id,
            @RequestBody ResolveReportRequest req) {
        User admin = auth.requireRole(request, "admin");
        return Map.of("report", reportService.resolve(admin, id, "valid".equalsIgnoreCase(req.decision())));
    }

    // ---------- Moderator verification ----------

    @GetMapping("/moderator-requests")
    public Map<String, Object> listModeratorRequests(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        return Map.of("requests", requestRepo.findAll(NEWEST));
    }

    @PostMapping("/moderator-requests/{id}/review")
    public Map<String, Object> reviewModeratorRequest(HttpServletRequest request, @PathVariable String id,
            @RequestBody ModeratorReviewRequest req) {
        User admin = auth.requireRole(request, "admin");
        if (!"approved".equalsIgnoreCase(req.decision()) && !"rejected".equalsIgnoreCase(req.decision())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Decision must be approved or rejected");
        }
        return Map.of("request", verifications.review(admin, id, "approved".equalsIgnoreCase(req.decision())));
    }
}
