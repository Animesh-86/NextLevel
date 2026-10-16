package com.nextlevel.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InterviewMessageRequest {
    @NotBlank(message = "Message is required")
    private String message;
    
    private Integer elapsedSeconds;
    
    private Boolean isSkip = false;
    
    private Integer proctoringWarnings = 0;
}
