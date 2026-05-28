package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.StudyFile;

public interface StudyFileRepository extends MongoRepository<StudyFile, String> {
    List<StudyFile> findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(String userId, Boolean isArchived);
    Optional<StudyFile> findByIdAndUserId(String id, String userId);
    List<StudyFile> findByUserId(String userId);
}
