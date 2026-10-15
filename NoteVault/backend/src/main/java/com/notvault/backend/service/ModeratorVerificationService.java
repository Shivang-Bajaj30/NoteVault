package com.notvault.backend.service;

import java.time.Instant;

import com.notvault.backend.model.ModeratorRequest;
import com.notvault.backend.model.User;
import com.notvault.backend.store.ModeratorRequestRepository;
import com.notvault.backend.store.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Moderator verification workflow from the spec:
 * signup creates a pending request while the user stays a student;
 * admin approval flips the role and starts an unproven moderator.
 */
@Service
public class ModeratorVerificationService {

    private final ModeratorRequestRepository requests;
    private final UserRepository users;
    private final EventService events;

    public ModeratorVerificationService(ModeratorRequestRepository requests, UserRepository users,
                                        EventService events) {
        this.requests = requests;
        this.users = users;
        this.events = events;
    }

    public ModeratorRequest createRequest(User applicant, String reason) {
        ModeratorRequest request = new ModeratorRequest();
        request.id = Ids.next("mreq");
        request.userId = applicant.id;
        request.userName = applicant.name;
        request.userEmail = applicant.email;
        request.status = "pending";
        request.reason = reason == null ? "" : reason.trim();
        request.createdAt = Instant.now();
        requests.save(request);
        events.audit(applicant, "moderator.requested", applicant.email);
        return request;
    }

    public ModeratorRequest review(User admin, String requestId, boolean approve) {
        ModeratorRequest request = requests.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already reviewed");
        }

        request.status = approve ? "approved" : "rejected";
        request.reviewedBy = admin.id;
        request.reviewedAt = Instant.now();
        requests.save(request);

        User applicant = users.findById(request.userId).orElse(null);
        if (applicant != null) {
            if (approve) {
                applicant.role = "moderator";
                applicant.isTrusted = false;     // starts unproven
                applicant.cleanUploadCount = 0;
                users.save(applicant);
                events.audit(admin, "moderator.approved", applicant.name);
            } else {
                events.audit(admin, "moderator.rejected", applicant.name);
            }
        }
        events.emit("user-events", "moderator." + (approve ? "approved" : "rejected"), request.userEmail);
        return request;
    }
}
