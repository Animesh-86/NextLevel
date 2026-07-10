package com.nextlevel.api.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.nextlevel.api.model.StudySession;

public interface StudySessionRepository extends MongoRepository<StudySession, String> {
    List<StudySession> findByUserIdOrderByCreatedAtDesc(String userId);
}
