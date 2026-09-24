package com.notvault.streams.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Properties;

import com.notvault.streams.service.StreamProcessingMonitor;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.TopologyTestDriver;
import org.junit.jupiter.api.Test;

class StreamsTopologyConfigurationTest {
    @Test
    void countsEventsByDomainTypeAndIgnoresInvalidRecords() {
        StreamsBuilder builder = new StreamsBuilder();
        StreamProcessingMonitor monitor = new StreamProcessingMonitor();
        new StreamsTopologyConfiguration().eventCountTopology(builder, monitor);

        Properties properties = new Properties();
        properties.put(StreamsConfig.APPLICATION_ID_CONFIG, "topology-test");
        properties.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:9092");

        try (TopologyTestDriver driver = new TopologyTestDriver(builder.build(), properties)) {
            var input = driver.createInputTopic("notevault.events", Serdes.String().serializer(),
                    Serdes.String().serializer());
            var output = driver.createOutputTopic("notevault.event-counts", Serdes.String().deserializer(),
                    Serdes.String().deserializer());

            input.pipeInput("note-events:note.uploaded", "{\"id\":\"1\"}");
            input.pipeInput("note-events:note.uploaded", "{\"id\":\"2\"}");
            input.pipeInput(null, "invalid");

            assertThat(output.readKeyValuesToMap())
                    .containsEntry("note-events:note.uploaded", "2")
                    .hasSize(1);
            assertThat(monitor.totalProcessed()).isEqualTo(2);
            assertThat(monitor.lastProcessedAt()).isNotEqualTo("no events yet");
        }
    }
}
