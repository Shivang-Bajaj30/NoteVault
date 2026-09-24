package com.notvault.backend.store;

import java.util.List;

import com.notvault.backend.model.ModeratorRequest;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModeratorRequestRepository extends MongoRepository<ModeratorRequest, String> {
    List<ModeratorRequest> findByStatus(String status, Sort sort);

    List<ModeratorRequest> findAll(Sort sort);
}
