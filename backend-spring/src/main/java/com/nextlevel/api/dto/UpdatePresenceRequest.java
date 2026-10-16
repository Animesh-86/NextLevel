package com.nextlevel.api.dto;

import lombok.Data;

@Data
public class UpdatePresenceRequest {
    private String status = "FOCUSING"; // "FOCUSING", "TESTING", "BREAK", "IDLE"
    private String currentTask;
    private Integer timerSecondsLeft;
}
