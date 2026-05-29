package com.nextlevel.api.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

public record ApplicationCreateRequest(
    @NotBlank String company,
    @NotBlank String role,
    String type,
    String status,
    Instant appliedDate,
    String salary,
    String location,
    String url,
    String notes,
    String linkedFileId
) {}
