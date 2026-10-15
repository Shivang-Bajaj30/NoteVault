package com.notvault.backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Pins the logical database name (the Atlas URI may omit one) and enables
 * scanning for the nested repository interfaces in MongoRepositories.
 */
@Configuration
@EnableMongoRepositories(basePackages = "com.notvault.backend.store")
public class MongoConfig {

    @Bean
    public MongoDatabase notevaultDb(MongoClient client) {
        return client.getDatabase("notevault");
    }
}
