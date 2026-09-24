package com.notvault.backend.security;

import java.util.Map;

import com.notvault.backend.model.User;
import com.notvault.backend.store.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Resolves the caller from the Authorization: Bearer header.
 * JWT claims carry the user id; the fresh user record (current role, trust)
 * is always loaded from MongoDB so role changes take effect immediately.
 */
@Component
public class AuthContext {

    private final JwtService jwtService;
    private final UserRepository users;

    public AuthContext(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    public User require(HttpServletRequest request) {
        User user = optional(request);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }

    public User requireRole(HttpServletRequest request, String... allowedRoles) {
        User user = require(request);
        for (String role : allowedRoles) {
            if (user.role.equals(role)) {
                return user;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role");
    }

    public User optional(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        Map<String, Object> claims = jwtService.parse(header.substring(7));
        if (claims == null) {
            return null;
        }
        return users.findById((String) claims.get("sub")).orElse(null);
    }
}
