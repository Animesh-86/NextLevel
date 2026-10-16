package com.nextlevel.api.dto;

import java.util.Map;
import java.util.List;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public class ExamGradingRequest {
    
    @NotBlank
    private String examId;
    
    @NotNull
    private Map<String, List<Integer>> userAnswers;
    
    private List<String> questionIds;
    private Double timeTaken;
    private String testMode; // "simulation" | "study" | "oa_blitz"
    private Integer perQuestionTimeLimitSeconds;
    private Map<String, Integer> questionTimeTaken;
    private List<String> timedOutQuestionIds;

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public Map<String, List<Integer>> getUserAnswers() { return userAnswers; }
    public void setUserAnswers(Map<String, List<Integer>> userAnswers) { this.userAnswers = userAnswers; }

    public List<String> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<String> questionIds) { this.questionIds = questionIds; }

    public Double getTimeTaken() { return timeTaken; }
    public void setTimeTaken(Double timeTaken) { this.timeTaken = timeTaken; }

    public String getTestMode() { return testMode; }
    public void setTestMode(String testMode) { this.testMode = testMode; }

    public Integer getPerQuestionTimeLimitSeconds() { return perQuestionTimeLimitSeconds; }
    public void setPerQuestionTimeLimitSeconds(Integer perQuestionTimeLimitSeconds) { this.perQuestionTimeLimitSeconds = perQuestionTimeLimitSeconds; }

    public Map<String, Integer> getQuestionTimeTaken() { return questionTimeTaken; }
    public void setQuestionTimeTaken(Map<String, Integer> questionTimeTaken) { this.questionTimeTaken = questionTimeTaken; }

    public List<String> getTimedOutQuestionIds() { return timedOutQuestionIds; }
    public void setTimedOutQuestionIds(List<String> timedOutQuestionIds) { this.timedOutQuestionIds = timedOutQuestionIds; }
}
