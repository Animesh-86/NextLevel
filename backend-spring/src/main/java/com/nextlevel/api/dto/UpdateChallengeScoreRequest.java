package com.nextlevel.api.dto;

import lombok.Data;

@Data
public class UpdateChallengeScoreRequest {
    private Integer score;
    private Integer questionsAnswered;
    private Integer correctCount;
    private Double avgSpeedSeconds;
    private Integer bossDamageDelta;
    private Boolean isEliminated;
    private String team;
}
