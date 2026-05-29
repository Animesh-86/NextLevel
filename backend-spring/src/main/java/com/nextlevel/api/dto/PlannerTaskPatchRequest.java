package com.nextlevel.api.dto;

import java.time.Instant;

public record PlannerTaskPatchRequest(
    String title,
    String description,
    Instant scheduledDate,
    String startTime,
    String endTime,
    Integer duration,
    String category,
    String priority,
    String status,
    String linkedCaptureId,
    String linkedFileId,
    Boolean isRecurring,
    String recurPattern
) {}
