package com.notvault.backend.store;

import java.util.List;
import java.util.Optional;

import com.notvault.backend.model.User;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByRole(String role);
}
