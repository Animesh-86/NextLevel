package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "captures")
@CompoundIndexes({
        @CompoundIndex(def = "{'userId': 1, 'status': 1, 'createdAt': -1}"),
        @CompoundIndex(def = "{'userId': 1, 'category': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'urgency': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'reminderAt': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'isPinned': -1, 'createdAt': -1}")
})
public class Capture {

    @Id
    private String id;
    private String userId;
    private String type = "text";
    private String title;
    private String rawContent = "";
    private String description = "";
    private String imageData;
    private String category = "other";
    private List<String> tags = new ArrayList<>();
    private String urgency = "none";
    private Instant reminderAt;
    private String reminderRepeats = "none";
    private Boolean isReminderDismissed = false;
    private Boolean isPinned = false;
    private Boolean isArchived = false;
    private String status = "active";
    private List<Double> embedding = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getRawContent() {
        return rawContent;
    }

    public void setRawContent(String rawContent) {
        this.rawContent = rawContent;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageData() {
        return imageData;
    }

    public void setImageData(String imageData) {
        this.imageData = imageData;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getUrgency() {
        return urgency;
    }

    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }

    public Instant getReminderAt() {
        return reminderAt;
    }

    public void setReminderAt(Instant reminderAt) {
        this.reminderAt = reminderAt;
    }

    public String getReminderRepeats() {
        return reminderRepeats;
    }

    public void setReminderRepeats(String reminderRepeats) {
        this.reminderRepeats = reminderRepeats;
    }

    public Boolean getIsReminderDismissed() {
        return isReminderDismissed;
    }

    public void setIsReminderDismissed(Boolean isReminderDismissed) {
        this.isReminderDismissed = isReminderDismissed;
    }

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Boolean isPinned) {
        this.isPinned = isPinned;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Double> getEmbedding() {
        return embedding;
    }

    public void setEmbedding(List<Double> embedding) {
        this.embedding = embedding;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
