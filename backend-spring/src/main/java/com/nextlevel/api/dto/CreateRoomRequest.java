package com.nextlevel.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoomRequest {

    @NotBlank(message = "Room title is required")
    private String title;

    private String description;
    private Boolean isPrivate = false;
    private String accessPin;
    private Integer maxParticipants = 25;
    private Integer expiryMinutes = 60; // 30, 60, 120, 240, 0 = no expiry
}
