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
    
    private Double timeTaken;

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public Map<String, List<Integer>> getUserAnswers() { return userAnswers; }
    public void setUserAnswers(Map<String, List<Integer>> userAnswers) { this.userAnswers = userAnswers; }

    public Double getTimeTaken() { return timeTaken; }
    public void setTimeTaken(Double timeTaken) { this.timeTaken = timeTaken; }
}
