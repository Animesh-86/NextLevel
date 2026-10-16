package com.nextlevel.api.dto;

import lombok.Data;

@Data
public class UpdateRoomTimerRequest {
    private String action; // "START", "PAUSE", "RESET", "SET_DURATION"
    private Integer duration;
}
