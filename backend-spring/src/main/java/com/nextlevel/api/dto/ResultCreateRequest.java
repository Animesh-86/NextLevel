package com.nextlevel.api.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ResultCreateRequest {

    @NotBlank
    private String examId;

    @NotNull
    @Min(0)
    @Max(100)
    private Double scorePercent;

    @NotNull
    @Min(0)
    private Integer correctCount;

    @NotNull
    @Min(0)
    private Integer wrongCount;

    @NotNull
    @Min(0)
    private Integer skippedCount;

    @NotNull
    @Min(1)
    private Integer totalCount;

    @NotNull
    private Boolean passed;

    @Min(0)
    private Integer timeTaken;

    private Map<String, List<Integer>> userAnswers;

    public String getExamId() {
        return examId;
    }

    public Double getScorePercent() {
        return scorePercent;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public Integer getWrongCount() {
        return wrongCount;
    }

    public Integer getSkippedCount() {
        return skippedCount;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public Boolean getPassed() {
        return passed;
    }

    public Integer getTimeTaken() {
        return timeTaken;
    }

    public Map<String, List<Integer>> getUserAnswers() {
        return userAnswers;
    }
}
