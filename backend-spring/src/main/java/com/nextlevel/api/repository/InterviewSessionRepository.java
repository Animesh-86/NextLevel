package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.nextlevel.api.model.InterviewSession;

@Repository
public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {
    List<InterviewSession> findByUserId(String userId);
    List<InterviewSession> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<InterviewSession> findByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
}
