package com.nextlevel.api.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

public record RoadmapCreateRequest(
    @NotBlank(message = "Title is required") String title,
    String description,
    String category,
    Instant targetDate,
    String color,
    Object milestones, // Can be List of Map, parsed in service
    Integer templateIndex
) {}
