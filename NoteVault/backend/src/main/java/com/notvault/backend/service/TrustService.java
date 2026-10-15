package com.notvault.backend.service;

import java.time.Instant;

import com.notvault.backend.model.User;
import com.notvault.backend.store.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Owns the reputation rules from the spec:
 *  - every admin-approved upload = +1 clean upload for the moderator
 *  - at TRUST_THRESHOLD (5) the moderator flips to trusted (auto-publish enabled)
 *  - a valid report against a trusted moderator resets trust to zero
 */
@Service
public class TrustService {

    public static final int TRUST_THRESHOLD = User.TRUST_THRESHOLD;

    private final UserRepository users;

    public TrustService(UserRepository users) {
        this.users = users;
    }

    /** Called after an admin approves a pending upload. Returns true when trust was newly granted. */
    public boolean awardCleanUpload(User moderator) {
        if (moderator == null || !"moderator".equals(moderator.role)) {
            return false;
        }
        moderator.cleanUploadCount = moderator.cleanCount() + 1;
        boolean newlyTrusted = !moderator.trusted() && moderator.cleanCount() >= TRUST_THRESHOLD;
        if (newlyTrusted) {
            moderator.isTrusted = true;
        }
        users.save(moderator);
        return newlyTrusted;
    }

    /** Safety net: a valid report resets a trusted moderator's reputation. */
    public boolean resetTrust(User moderator) {
        if (moderator == null || !"moderator".equals(moderator.role) || !moderator.trusted()) {
            return false;
        }
        moderator.isTrusted = false;
        moderator.cleanUploadCount = 0;
        users.save(moderator);
        return true;
    }

    /** True when this moderator's uploads skip the review queue. */
    public boolean canAutoPublish(User moderator) {
        return moderator != null && "moderator".equals(moderator.role) && moderator.trusted();
    }
}
