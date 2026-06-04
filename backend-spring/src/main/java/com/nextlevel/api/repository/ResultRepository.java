package com.nextlevel.api.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Result;

public interface ResultRepository extends MongoRepository<Result, String> {
    Page<Result> findByUserId(String userId, Pageable pageable);
    Page<Result> findByUserIdAndExamId(String userId, String examId, Pageable pageable);
    java.util.List<Result> findByExamId(String examId);
    Optional<Result> findByIdAndUserId(String id, String userId);
    java.util.List<Result> findTop50ByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserId(String userId);
    long countByUserIdAndPassed(String userId, Boolean passed);
    long countByUserIdAndScorePercent(String userId, Double scorePercent);
}
