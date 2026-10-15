package com.notvault.backend;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

    private static final String DEFAULT_DB = "notevault";

    /**
     * Loads backend/.env (if present) into system properties before Spring starts,
     * so MONGODB_URI etc. work locally without shell exports. Real env vars win.
     * Also appends the default database name when the Mongo URI omits one —
     * Spring's MongoDatabaseFactory rejects a URI with an empty database path.
     */
    public static void main(String[] args) {
        loadDotEnv(Path.of(".env"));
        fixMongoUri();
        SpringApplication.run(BackendApplication.class, args);
    }

    private static void loadDotEnv(Path file) {
        if (!Files.exists(file)) {
            return;
        }
        try {
            for (String line : Files.readAllLines(file)) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int eq = line.indexOf('=');
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (Exception e) {
            System.err.println("Could not load .env: " + e.getMessage());
        }
    }

    /**
     * Ensures the MongoDB URI carries a database name: mongodb+srv://host/ -> mongodb+srv://host/notevault
     * Handles the path falling before the '?' query separator (and preserves any credentials, which
     * appear before the '@' and therefore never contain a '/').
     */
    private static void fixMongoUri() {
        String key = "spring.data.mongodb.uri";
        String uri = System.getProperty(key);
        if (uri == null || uri.isBlank()) {
            return;
        }
        int schemeEnd = uri.indexOf("://");
        int query = uri.indexOf('?');
        String path = query < 0 ? uri.substring(schemeEnd + 3) : uri.substring(schemeEnd + 3, query);
        int slash = path.indexOf('/');
        if (slash < 0 || slash == path.length() - 1) {
            String dbPath = slash < 0 ? "/" + DEFAULT_DB : "/" + DEFAULT_DB + path.substring(slash + 1);
            String newUri = query < 0
                    ? uri.substring(0, schemeEnd + 3) + path.substring(0, Math.max(slash, 0)) + dbPath
                    : uri.substring(0, schemeEnd + 3) + path.substring(0, Math.max(slash, 0)) + dbPath + uri.substring(query);
            System.setProperty(key, newUri);
            System.out.println("Mongo URI had no database name — defaulted to \"" + DEFAULT_DB + "\"");
        }
    }
}
