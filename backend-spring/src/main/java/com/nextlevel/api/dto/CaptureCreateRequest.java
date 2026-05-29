package com.nextlevel.api.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;

public class CaptureCreateRequest {

    private String type = "text";
    private String title;
    @NotBlank(message = "Raw content cannot be empty")
    private String rawContent = "";
    private String description = "";
    private String category = "other";
    private List<String> tags;
    private String urgency = "none";
    private Instant reminderAt;
    private String reminderRepeats = "none";
    private String imageData;

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

    public String getImageData() {
        return imageData;
    }

    public void setImageData(String imageData) {
        this.imageData = imageData;
    }
}
