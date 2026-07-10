package com.nextlevel.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleCalendarEventDto(
    String summary,
    String htmlLink,
    EventTime start,
    EventTime end
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EventTime(
        String dateTime,
        String date
    ) {}
}
