package com.notvault.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/** Creates the application topics when Kafka publishing is enabled. */
@Configuration
@ConditionalOnProperty(prefix = "notevault.kafka", name = "enabled", havingValue = "true")
public class KafkaTopicConfiguration {

    @Bean
    NewTopic eventsTopic() {
        return TopicBuilder.name("notevault.events").partitions(1).replicas(1).build();
    }

    @Bean
    NewTopic eventCountsTopic() {
        return TopicBuilder.name("notevault.event-counts").partitions(1).replicas(1).build();
    }
}
