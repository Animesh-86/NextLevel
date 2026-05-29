package com.nextlevel.api.dto;

import java.time.Instant;

public record RoadmapPatchRequest(
    ToggleTaskRequest toggleTask,
    UpdateMilestoneRequest updateMilestone,
    AddTaskRequest addTask,
    String title,
    String description,
    String category,
    Instant targetDate,
    String status,
    String color
) {
    public record ToggleTaskRequest(String milestoneId, String taskId) {}
    public record UpdateMilestoneRequest(String milestoneId, String status) {}
    public record AddTaskRequest(String milestoneId, String title) {}
}
