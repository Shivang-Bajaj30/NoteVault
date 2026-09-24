package com.notvault.backend.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import com.notvault.backend.model.User;
import com.notvault.backend.security.AuthContext;
import com.notvault.backend.security.JwtService;
import com.notvault.backend.security.PasswordHasher;
import com.notvault.backend.service.EventService;
import com.notvault.backend.service.Ids;
import com.notvault.backend.service.ModeratorVerificationService;
import com.notvault.backend.store.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final JwtService jwtService;
    private final PasswordHasher hasher;
    private final AuthContext auth;
    private final ModeratorVerificationService verifications;
    private final EventService events;

    public AuthController(UserRepository users, JwtService jwtService, PasswordHasher hasher, AuthContext auth,
            ModeratorVerificationService verifications, EventService events) {
        this.users = users;
        this.jwtService = jwtService;
        this.hasher = hasher;
        this.auth = auth;
        this.verifications = verifications;
        this.events = events;
    }

    public record SignupRequest(String name, String email, String password, String university,
            String role, String reason) {
    }

    public record LoginRequest(String email, String password) {
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest req) {
        if (req.name() == null || req.name().isBlank()
                || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email, and a 6+ char password are required");
        }
        if (req.email() != null && users.findByEmailIgnoreCase(req.email().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        // Spec: every account is created as student; moderator is a *request*, not a role.
        User user = new User(Ids.next("user"), req.name().trim(), req.email().trim().toLowerCase(),
                hasher.hash(req.password()), "student",
                req.university() == null ? "" : req.university().trim(), Instant.now());
        users.save(user);

        if ("moderator".equalsIgnoreCase(req.role())) {
            verifications.createRequest(user, req.reason());
        }

        events.emit("user-events", "user.signup", user.email);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", jwtService.issue(user),
                "user", publicUser(user),
                "moderatorRequestPending", "moderator".equalsIgnoreCase(req.role())));
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        User user = req.email() == null ? null
                : users.findByEmailIgnoreCase(req.email().trim()).orElse(null);
        if (user == null || !hasher.matches(req.password() == null ? "" : req.password(), user.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        events.emit("user-events", "user.login", user.email);
        return Map.of("token", jwtService.issue(user), "user", publicUser(user));
    }

    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        User user = auth.require(request);
        return Map.of("user", publicUser(user));
    }

    public static Map<String, Object> publicUser(User user) {
        Map<String, Object> out = new HashMap<>();
        out.put("id", user.id);
        out.put("name", user.name);
        out.put("email", user.email);
        out.put("role", user.role);
        out.put("university", user.university == null ? "" : user.university);
        if ("moderator".equals(user.role)) {
            out.put("cleanUploadCount", user.cleanCount());
            out.put("isTrusted", user.trusted());
            out.put("trustThreshold", User.TRUST_THRESHOLD);
        }
        return out;
    }
}
