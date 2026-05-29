package com.nextlevel.api.dto;

import java.time.Instant;

public record ApplicationPatchRequest(
    String company,
    String role,
    String type,
    String status,
    String salary,
    String location,
    String url,
    String notes,
    String linkedFileId,
    Instant appliedDate,
    AddEventRequest addEvent
) {
    public record AddEventRequest(String event, String notes) {}
}
