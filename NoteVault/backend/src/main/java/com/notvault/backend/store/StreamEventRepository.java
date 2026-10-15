package com.notvault.backend.store;

import com.notvault.backend.model.StreamEvent;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StreamEventRepository extends MongoRepository<StreamEvent, String> {
}
