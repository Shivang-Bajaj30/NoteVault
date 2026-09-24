package com.notvault.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.notvault.backend.model.User;

/**
 * Minimal dependency-free HS256 JWT. Signs {sub, name, role, exp} and verifies
 * signature + expiry. Swappable for jjwt/nimbus later without changing callers.
 */
@Service
public class JwtService {

    private static final long TTL_MS = 24 * 60 * 60 * 1000; // 24h
    private final byte[] secret;

    public JwtService(@Value("${notevault.jwt-secret:notevault-dev-secret-change-me}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String issue(User user) {
        long now = Instant.now().toEpochMilli();
        String header = b64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = b64(("{" +
                "\"sub\":\"" + user.id + "\"," +
                "\"name\":\"" + escape(user.name) + "\"," +
                "\"role\":\"" + user.role + "\"," +
                "\"iat\":" + now + "," +
                "\"exp\":" + (now + TTL_MS) + "}").getBytes(StandardCharsets.UTF_8));
        String signature = b64(hmac(header + "." + payload));
        return header + "." + payload + "." + signature;
    }

    /** Returns claims map or null when the token is invalid/expired. */
    public Map<String, Object> parse(String token) {
        if (token == null) {
            return null;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        byte[] expected = hmac(parts[0] + "." + parts[1]);
        byte[] provided;
        try {
            provided = Base64.getUrlDecoder().decode(parts[2]);
        } catch (IllegalArgumentException e) {
            return null;
        }
        if (!MessageDigest.isEqual(expected, provided)) {
            return null;
        }
        try {
            String json = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            long exp = Long.parseLong(extract(json, "exp"));
            if (exp < Instant.now().toEpochMilli()) {
                return null;
            }
            return Map.of(
                    "sub", extract(json, "sub"),
                    "role", extract(json, "role"));
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String extract(String json, String field) {
        String needle = "\"" + field + "\":";
        int start = json.indexOf(needle);
        if (start < 0) {
            throw new IllegalArgumentException("missing field " + field);
        }
        start += needle.length();
        if (json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return json.substring(start + 1, end);
        }
        int end = start;
        while (end < json.length() && "0123456789-".indexOf(json.charAt(end)) >= 0) {
            end++;
        }
        return json.substring(start, end);
    }
}
