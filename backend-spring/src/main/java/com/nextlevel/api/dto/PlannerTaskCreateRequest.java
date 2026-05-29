package com.nextlevel.api.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlannerTaskCreateRequest(
    @NotBlank String title,
    @NotNull Instant scheduledDate,
    String description,
    String startTime,
    String endTime,
    Integer duration,
    String category,
    String priority,
    String linkedCaptureId,
    String linkedFileId,
    Boolean isRecurring,
    String recurPattern
) {}
