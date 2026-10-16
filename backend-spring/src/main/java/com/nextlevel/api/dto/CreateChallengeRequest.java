package com.nextlevel.api.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateChallengeRequest {

    @NotBlank(message = "Challenge title is required")
    private String title;

    private String examId;
    private List<String> examIds;
    private Integer questionCount = 10;
    private Integer perQuestionSeconds = 30;
    private Boolean negativeMarking = false;
    private List<String> questionIds;
    private String gameMode = "BLITZ"; // "BLITZ", "BOSS", "SURVIVAL", "TEAMS", "FLASHCARDS"
    private Integer lobbySeconds = 0;
}
