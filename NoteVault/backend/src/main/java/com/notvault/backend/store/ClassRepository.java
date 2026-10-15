package com.notvault.backend.store;

import java.util.List;

import com.notvault.backend.model.StudyClass;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassRepository extends MongoRepository<StudyClass, String> {
    List<StudyClass> findAll(Sort sort);
}
