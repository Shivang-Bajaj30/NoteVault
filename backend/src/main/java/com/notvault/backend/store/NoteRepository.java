package com.notvault.backend.store;

import java.util.List;

import com.notvault.backend.model.Note;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends MongoRepository<Note, String> {

    List<Note> findByIsDeletedFalseAndStatus(String status, Sort sort);

    List<Note> findByIsDeletedFalse(Sort sort);

    List<Note> findByIsDeletedFalseAndUploadedBy(String uploadedBy, Sort sort);

    List<Note> findByIsDeletedFalseAndStatusAndUploadedBy(String status, String uploadedBy, Sort sort);

    List<Note> findByFileHashAndIsDeletedFalse(String fileHash);

    List<Note> findByIsDeletedFalseAndStatusAndClassId(String status, String classId, Sort sort);
}
