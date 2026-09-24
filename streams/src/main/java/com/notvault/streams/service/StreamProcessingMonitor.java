package com.notvault.streams.service;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.kafka.streams.KafkaStreams;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.KafkaStreamsCustomizer;
import org.springframework.stereotype.Component;

/** Runtime state and lightweight throughput metrics for the stream processor. */
@Component
public class StreamProcessingMonitor {
    private final AtomicReference<String> state = new AtomicReference<>("STARTING");
    private final AtomicLong processed = new AtomicLong();
    private final AtomicReference<Instant> lastProcessedAt = new AtomicReference<>();

    public void recordProcessed() {
        processed.incrementAndGet();
        lastProcessedAt.set(Instant.now());
    }

    public void stateChanged(KafkaStreams.State newState) {
        state.set(newState.name());
    }

    public String status() { return state.get(); }
    public boolean running() { return "RUNNING".equals(state.get()); }
    public long totalProcessed() { return processed.get(); }
    public String lastProcessedAt() {
        Instant value = lastProcessedAt.get();
        return value == null ? "no events yet" : value.toString();
    }

    @Configuration
    @ConditionalOnProperty(prefix = "notevault.streams", name = "enabled", havingValue = "true")
    static class ListenerConfiguration {
        @Bean
        KafkaStreamsCustomizer streamStateListener(StreamProcessingMonitor monitor) {
            return streams -> streams.setStateListener((newState, oldState) -> monitor.stateChanged(newState));
        }
    }
}
