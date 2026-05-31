package com.nextlevel.api.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "questions")
public class Question {

    @Id
    private String id;
    private String examId;
    private String module;
    private String type;
    private String scenario;
    private List<String> options;
    private List<Integer> answer;
    private Integer chooseCount;
    private String explanation;
    private Integer timesTested = 0;
    private Integer timesFailed = 0;
    private Double easeFactor = 2.5;
    private Integer interval = 0;
    private Instant nextReviewDate;
    private Integer repetitions = 0;
    private Instant createdAt;
    private Instant updatedAt;
}
