package com.nextlevel.api.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public Double getScorePercent() {
        return scorePercent;
    }

    public void setScorePercent(Double scorePercent) {
        this.scorePercent = scorePercent;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public Integer getWrongCount() {
        return wrongCount;
    }

    public void setWrongCount(Integer wrongCount) {
        this.wrongCount = wrongCount;
    }

    public Integer getSkippedCount() {
        return skippedCount;
    }

    public void setSkippedCount(Integer skippedCount) {
        this.skippedCount = skippedCount;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer totalCount) {
        this.totalCount = totalCount;
    }

    public Integer getTimeTaken() {
        return timeTaken;
    }

    public void setTimeTaken(Integer timeTaken) {
        this.timeTaken = timeTaken;
    }

    public Map<String, List<Integer>> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(Map<String, List<Integer>> userAnswers) {
        this.userAnswers = userAnswers;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
