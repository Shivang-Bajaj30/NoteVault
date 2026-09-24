package com.notvault.streams.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import com.notvault.streams.service.StreamProcessingMonitor;

@RestController
@RequestMapping("/api")
public class StreamHealthController {

    @Value("${notevault.streams.enabled:false}")
    private boolean processingEnabled;

    private final StreamProcessingMonitor monitor;

    public StreamHealthController(StreamProcessingMonitor monitor) {
        this.monitor = monitor;
    }

    @GetMapping("/health/streams")
    public Map<String, Object> health() {
        return Map.of(
            "status", processingEnabled ? monitor.status() : "DISABLED",
            "service", "notevault-streams",
            "inputTopic", "notevault.events",
            "outputTopic", "notevault.event-counts",
            "processingEnabled", processingEnabled,
            "running", processingEnabled && monitor.running(),
            "totalProcessed", monitor.totalProcessed(),
            "lastProcessedAt", monitor.lastProcessedAt()
        );
    }
}
