package com.notvault.streams.config;

import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Grouped;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Produced;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;

/** Counts each keyed domain event and publishes the running totals for downstream consumers. */
@Configuration
@EnableKafkaStreams
@ConditionalOnProperty(prefix = "notevault.streams", name = "enabled", havingValue = "true")
public class StreamsTopologyConfiguration {
    @Bean
    KStream<String, String> eventCountTopology(StreamsBuilder builder) {
        KStream<String, String> events = builder.stream("notevault.events",
                Consumed.with(Serdes.String(), Serdes.String()));
        events.mapValues(ignored -> 1L)
                .groupByKey(Grouped.with(Serdes.String(), Serdes.Long()))
                .count()
                .toStream()
                .mapValues(count -> Long.toString(count))
                .to("notevault.event-counts", Produced.with(Serdes.String(), Serdes.String()));
        return events;
    }
}
