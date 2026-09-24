package com.notvault.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.notvault.backend.model.StreamEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/** Publishes the durable event mirror to Kafka when the broker is configured. */
@Component
@ConditionalOnProperty(prefix = "notevault.kafka", name = "enabled", havingValue = "true")
public class KafkaEventPublisher {
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafka, ObjectMapper mapper) {
        this.kafka = kafka;
        this.mapper = mapper;
    }

    public void publish(StreamEvent event) {
        try {
            kafka.send("notevault.events", event.topic + ":" + event.type, mapper.writeValueAsString(event));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize stream event " + event.id, ex);
        }
    }
}
