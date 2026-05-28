package com.nextlevel.api.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getExamId() {
        return examId;
    }

    public String getModule() {
        return module;
    }

    public String getType() {
        return type;
    }

    public String getScenario() {
        return scenario;
    }

    public List<String> getOptions() {
        return options;
    }

    public List<Integer> getAnswer() {
        return answer;
    }

    public String getExplanation() {
        return explanation;
    }

    public Integer getTimesTested() {
        return timesTested;
    }

    public void setTimesTested(Integer timesTested) {
        this.timesTested = timesTested;
    }

    public Integer getTimesFailed() {
        return timesFailed;
    }

    public void setTimesFailed(Integer timesFailed) {
        this.timesFailed = timesFailed;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public void setAnswer(List<Integer> answer) {
        this.answer = answer;
    }

    public void setChooseCount(Integer chooseCount) {
        this.chooseCount = chooseCount;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
