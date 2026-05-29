package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "roadmaps")
public class Roadmap {

    @Data
    public static class TaskItem {
        private String id;
        private String title;
        private Boolean done = false;
        private Instant completedAt;
    }

    @Data
    public static class Milestone {
        private String id;
        private String title;
        private String description = "";
        private Instant targetDate;
        private String status = "not-started";
        private Integer order = 0;
        private List<TaskItem> tasks = new ArrayList<>();
    }

    @Id
    private String id;
    private String userId;
    private String title;
    private String description = "";
    private String category = "other";
    private Instant startDate = Instant.now();
    private Instant targetDate;
    private String status = "active";
    private List<Milestone> milestones = new ArrayList<>();
    private Integer overallProgress = 0;
    private String color = "#ffffff";
    private Boolean isTemplate = false;
    private Instant createdAt;
    private Instant updatedAt;
}
