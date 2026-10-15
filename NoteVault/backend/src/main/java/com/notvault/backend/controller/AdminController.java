package com.notvault.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.notvault.backend.model.Note;
import com.notvault.backend.security.AuthContext;
import com.notvault.backend.service.EventService;
import com.notvault.backend.service.NoteService;
import com.notvault.backend.store.ClassRepository;
import com.notvault.backend.store.ModeratorRequestRepository;
import com.notvault.backend.store.NoteRepository;
import com.notvault.backend.store.ReportRepository;
import com.notvault.backend.store.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

/** Admin analytics dashboard + stream-pipeline observability cards. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Value("${notevault.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @Value("${notevault.streams.health-url:http://localhost:8081/api/health/streams}")
    private String streamsHealthUrl;

    private final RestClient restClient;

    private final AuthContext auth;
    private final NoteService noteService;
    private final EventService events;
    private final UserRepository users;
    private final NoteRepository notes;
    private final ReportRepository reports;
    private final ModeratorRequestRepository moderatorRequests;
    private final ClassRepository classes;

    public AdminController(AuthContext auth, NoteService noteService, EventService events,
                           UserRepository users, NoteRepository notes, ReportRepository reports,
                           ModeratorRequestRepository moderatorRequests, ClassRepository classes,
                           RestClient.Builder restClientBuilder) {
        this.auth = auth;
        this.noteService = noteService;
        this.events = events;
        this.users = users;
        this.notes = notes;
        this.reports = reports;
        this.moderatorRequests = moderatorRequests;
        this.classes = classes;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(1000);
        requestFactory.setReadTimeout(1000);
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics(HttpServletRequest request) {
        auth.requireRole(request, "admin");

        List<Note> live = noteService.allLive();
        List<Note> approved = live.stream().filter(n -> "approved".equals(n.status)).toList();
        List<Note> pending = live.stream().filter(n -> "pending".equals(n.status)).toList();

        Map<String, Long> perSubject = new LinkedHashMap<>();
        approved.forEach(n -> perSubject.merge(n.subject, 1L, Long::sum));

        List<com.notvault.backend.model.User> mods = users.findByRole("moderator");
        long trusted = mods.stream().filter(u -> u.trusted()).count();

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("notes", live.size());
        totals.put("approved", approved.size());
        totals.put("pending", pending.size());
        totals.put("classes", classes.count());
        totals.put("users", users.count());
        totals.put("openReports", reports.findAll().stream().filter(r -> "open".equals(r.status)).count());
        totals.put("pendingModeratorRequests",
                moderatorRequests.findAll().stream().filter(r -> "pending".equals(r.status)).count());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totals", totals);
        out.put("uploadsPerSubject", perSubject);
        out.put("trustedModerators", trusted);
        out.put("unprovenModerators", mods.size() - trusted);
        return out;
    }

    @GetMapping("/users")
    public Map<String, Object> users(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        List<Map<String, Object>> out = users.findAll().stream().map(u -> {
            Map<String, Object> row = new LinkedHashMap<>(AuthController.publicUser(u));
            row.put("createdAt", u.createdAt);
            return row;
        }).toList();
        return Map.of("users", out);
    }

    /** Recent audit trail (admin actions, trust changes, reports). */
    @GetMapping("/audit")
    public Map<String, Object> audit(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        return Map.of("logs", events.recentAudit(50));
    }

    /**
     * Reports the event mirror accurately. Consumer lag is unavailable until a
     * Kafka Streams heartbeat/metrics source is configured.
     */
    @GetMapping("/streams")
    public Map<String, Object> streams(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        Map<String, Object> processor;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> health = restClient.get().uri(streamsHealthUrl).retrieve().body(Map.class);
            processor = health == null ? Map.of("status", "UNAVAILABLE") : health;
        } catch (RuntimeException ex) {
            processor = Map.of("status", "UNREACHABLE", "processingEnabled", false);
        }
        return Map.of(
                "status", kafkaEnabled ? "KAFKA_CONFIGURED" : "MONGO_EVENT_MIRROR",
                "lastProcessedAt", events.lastEventTime(),
                "totalProcessed", events.totalEvents(),
                "consumerLag", -1,
                "instance", kafkaEnabled ? "backend-kafka-publisher" : "mongodb-event-mirror",
                "topics", List.of("notevault.events", "notevault.event-counts"),
                "processor", processor);
    }

    @GetMapping("/events")
    public Map<String, Object> events(HttpServletRequest request) {
        auth.requireRole(request, "admin");
        return Map.of("events", events.recentEvents(50));
    }
}
