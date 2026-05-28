package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "roadmaps")
public class Roadmap {

    public static class TaskItem {
        private String id;
        private String title;
        private Boolean done = false;
        private Instant completedAt;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public Boolean getDone() { return done; }
        public void setDone(Boolean done) { this.done = done; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    }

    public static class Milestone {
        private String id;
        private String title;
        private String description = "";
        private Instant targetDate;
        private String status = "not-started";
        private Integer order = 0;
        private List<TaskItem> tasks = new ArrayList<>();

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Instant getTargetDate() { return targetDate; }
        public void setTargetDate(Instant targetDate) { this.targetDate = targetDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getOrder() { return order; }
        public void setOrder(Integer order) { this.order = order; }
        public List<TaskItem> getTasks() { return tasks; }
        public void setTasks(List<TaskItem> tasks) { this.tasks = tasks; }
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

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getTargetDate() { return targetDate; }
    public void setTargetDate(Instant targetDate) { this.targetDate = targetDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }
    public Integer getOverallProgress() { return overallProgress; }
    public void setOverallProgress(Integer overallProgress) { this.overallProgress = overallProgress; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Boolean getIsTemplate() { return isTemplate; }
    public void setIsTemplate(Boolean isTemplate) { this.isTemplate = isTemplate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
