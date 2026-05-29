package com.nextlevel.api.dto;

public record ExamUpdateRequest(
    String title,
    String description,
    Integer timeLimit,
    Integer passPercentage
) {}
