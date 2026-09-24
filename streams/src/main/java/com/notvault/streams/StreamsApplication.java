package com.notvault.streams;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StreamsApplication {

    public static void main(String[] args) {
        loadDotEnv(Path.of(".env"));
        SpringApplication.run(StreamsApplication.class, args);
    }

    /** Loads streams/.env for local runs; real environment variables take precedence. */
    private static void loadDotEnv(Path file) {
        if (!Files.exists(file)) {
            return;
        }
        try {
            for (String rawLine : Files.readAllLines(file)) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int separator = line.indexOf('=');
                String key = line.substring(0, separator).trim();
                String value = line.substring(separator + 1).trim();
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Could not load streams .env file", exception);
        }
    }
}
