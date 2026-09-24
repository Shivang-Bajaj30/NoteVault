package com.notvault.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "service", "notevault-backend",
            "environment", "local-dev"
        );
    }

    @GetMapping("/notes/health")
    public Map<String, String> noteHealth() {
        return Map.of(
            "status", "UP",
            "module", "notes-service"
        );
    }
}
