package com.nextlevel.api.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nextlevel.api.model.Exam;

public interface ExamRepository extends MongoRepository<Exam, String> {
	List<Exam> findAllByOrderByCreatedAtDesc();
	boolean existsByTitle(String title);
}
