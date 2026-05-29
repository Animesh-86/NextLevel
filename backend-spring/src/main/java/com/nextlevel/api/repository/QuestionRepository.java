package com.nextlevel.api.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Question;

public interface QuestionRepository extends MongoRepository<Question, String> {
    List<Question> findByIdIn(List<String> ids);
    Page<Question> findByExamId(String examId, Pageable pageable);
    long countByExamId(String examId);

    @org.springframework.data.mongodb.repository.Query("{ $expr: { $gte: [ { $divide: [ '$timesFailed', '$timesTested' ] }, 0.5 ] }, timesTested: { $gt: 0 } }")
    long countNeedsReview();
}
