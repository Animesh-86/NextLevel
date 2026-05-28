package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Application;

public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<Application> findByIdAndUserId(String id, String userId);
    List<Application> findByUserId(String userId);
}
