package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.SavedLink;

public interface SavedLinkRepository extends MongoRepository<SavedLink, String> {
    List<SavedLink> findByUserIdAndIsArchivedNotOrderByIsPinnedDescCreatedAtDesc(String userId, Boolean isArchived);
    Optional<SavedLink> findByIdAndUserId(String id, String userId);
}
