package com.notvault.streams.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class StreamHealthController {

    @Value("${notevault.streams.enabled:false}")
    private boolean processingEnabled;

    @GetMapping("/health/streams")
    public Map<String, Object> health() {
        return Map.of(
            "status", processingEnabled ? "CONFIGURED" : "DISABLED",
            "service", "notevault-streams",
            "inputTopic", "notevault.events",
            "outputTopic", "notevault.event-counts",
            "processingEnabled", processingEnabled
        );
    }
}
