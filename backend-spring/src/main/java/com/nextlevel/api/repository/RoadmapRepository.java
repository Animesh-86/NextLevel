package com.nextlevel.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Roadmap;

public interface RoadmapRepository extends MongoRepository<Roadmap, String> {
    List<Roadmap> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Roadmap> findByIdAndUserId(String id, String userId);
    List<Roadmap> findByUserId(String userId);
}
