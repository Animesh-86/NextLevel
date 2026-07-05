package com.nextlevel.api.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Question;

public interface QuestionRepository extends MongoRepository<Question, String> {
    List<Question> findByIdIn(List<String> ids);
    Page<Question> findByExamId(String examId, Pageable pageable);
    List<Question> findByExamId(String examId);
    Page<Question> findByUserId(String userId, Pageable pageable);
    Page<Question> findByExamIdAndUserId(String examId, String userId, Pageable pageable);
    long countByExamId(String examId);
    void deleteByExamId(String examId);
    void deleteByExamIdAndUserId(String examId, String userId);
    List<Question> findByExamIdAndUserId(String examId, String userId);

    @org.springframework.data.mongodb.repository.Query(value = "{ $expr: { $gte: [ { $divide: [ '$timesFailed', '$timesTested' ] }, 0.5 ] }, timesTested: { $gt: 0 } }", count = true)
    long countNeedsReview();
}
