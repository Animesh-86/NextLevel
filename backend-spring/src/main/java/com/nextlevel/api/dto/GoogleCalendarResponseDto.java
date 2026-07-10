package com.nextlevel.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleCalendarResponseDto(
    List<GoogleCalendarEventDto> items
) {}
