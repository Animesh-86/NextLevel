package com.nextlevel.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InterviewSetupRequest {
    @NotBlank(message = "Role is required")
    private String role;
    
    private String experienceLevel = "Mid-Level";
    private Integer durationMinutes = 30;
    private String resumeFileId;
    private String resumeText;
    private String customRoleText;
}
