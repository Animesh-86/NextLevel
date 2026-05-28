package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "plannertasks")
@CompoundIndexes({
        @CompoundIndex(def = "{'userId': 1, 'scheduledDate': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'status': 1}")
})
public class PlannerTask {

    @Id
    private String id;
    private String userId;
    private String title;
    private String description = "";
    private Instant scheduledDate;
    private String startTime;
    private String endTime;
    private Integer duration = 30;
    private String category = "study";
    private String priority = "medium";
    private String status = "todo";
    private String linkedCaptureId;
    private String linkedFileId;
    private Boolean isRecurring = false;
    private String recurPattern = "none";
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(Instant scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLinkedCaptureId() { return linkedCaptureId; }
    public void setLinkedCaptureId(String linkedCaptureId) { this.linkedCaptureId = linkedCaptureId; }
    public String getLinkedFileId() { return linkedFileId; }
    public void setLinkedFileId(String linkedFileId) { this.linkedFileId = linkedFileId; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }
    public String getRecurPattern() { return recurPattern; }
    public void setRecurPattern(String recurPattern) { this.recurPattern = recurPattern; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
