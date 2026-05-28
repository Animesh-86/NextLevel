package com.nextlevel.api.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.PlannerTask;

public interface PlannerTaskRepository extends MongoRepository<PlannerTask, String> {
    List<PlannerTask> findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscStartTimeAsc(String userId, Instant start, Instant end);
    Optional<PlannerTask> findByIdAndUserId(String id, String userId);
    List<PlannerTask> findByUserId(String userId);
}
