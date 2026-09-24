package com.notvault.backend.store;

import java.util.List;

import com.notvault.backend.model.Report;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {
    List<Report> findByStatus(String status, Sort sort);

    List<Report> findAll(Sort sort);
}
