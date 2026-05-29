package com.nextlevel.api.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "results")
@CompoundIndex(def = "{'userId': 1, 'createdAt': -1}")
public class Result {

    @Id
    private String id;
    private String userId;
    private String examId;
    private Double scorePercent;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer skippedCount;
    private Integer totalCount;
    private Boolean passed;
    private Integer timeTaken;
    private Map<String, List<Integer>> userAnswers;
    private Instant createdAt;
}
