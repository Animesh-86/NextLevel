package com.nextlevel.api.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.nextlevel.api.model.StudySession;

public interface StudySessionRepository extends MongoRepository<StudySession, String> {
}
