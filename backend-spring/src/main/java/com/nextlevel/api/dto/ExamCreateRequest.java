package com.nextlevel.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ExamCreateRequest(
    @NotBlank String title,
    String description,
    Integer timeLimit,
    Integer passPercentage
) {}
