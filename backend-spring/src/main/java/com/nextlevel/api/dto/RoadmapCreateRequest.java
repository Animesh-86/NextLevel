package com.nextlevel.api.dto;

import java.time.Instant;

public record RoadmapCreateRequest(
    String title,
    String description,
    String category,
    Instant targetDate,
    String color,
    Object milestones, // Can be List of Map, parsed in service
    Integer templateIndex
) {}
