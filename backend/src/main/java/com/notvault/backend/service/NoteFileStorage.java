package com.notvault.backend.service;

import java.io.IOException;
import java.io.InputStream;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.types.ObjectId;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class NoteFileStorage {
    private final GridFsTemplate gridFs;

    public NoteFileStorage(GridFsTemplate gridFs) {
        this.gridFs = gridFs;
    }

    public String store(MultipartFile file) {
        try (InputStream stream = file.getInputStream()) {
            ObjectId id = gridFs.store(stream, file.getOriginalFilename(), file.getContentType());
            return id.toHexString();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store the uploaded note file", ex);
        }
    }

    public StoredFile load(String id) {
        GridFSFile file = gridFs.findOne(Query.query(Criteria.where("_id").is(new ObjectId(id))));
        if (file == null) return null;
        GridFsResource resource = gridFs.getResource(file);
        return new StoredFile(file.getFilename(), file.getMetadata() == null ? null
                : file.getMetadata().getString("contentType"), resource);
    }

    public record StoredFile(String fileName, String contentType, Resource resource) { }
}
