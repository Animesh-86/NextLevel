package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "applications")
@CompoundIndexes({
        @CompoundIndex(def = "{'userId': 1, 'status': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'company': 1}")
})
public class Application {

    public static class TimelineEntry {
        private Instant date = Instant.now();
        private String event;
        private String notes = "";

        public Instant getDate() { return date; }
        public void setDate(Instant date) { this.date = date; }
        public String getEvent() { return event; }
        public void setEvent(String event) { this.event = event; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @Id
    private String id;
    private String userId;
    private String company;
    private String role;
    private String type = "full-time";
    private String status = "bookmarked";
    private Instant appliedDate;
    private String salary = "";
    private String location = "";
    private String url = "";
    private String notes = "";
    private String linkedFileId;
    private String linkedCaptureId;
    private List<TimelineEntry> timeline = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getAppliedDate() { return appliedDate; }
    public void setAppliedDate(Instant appliedDate) { this.appliedDate = appliedDate; }
    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getLinkedFileId() { return linkedFileId; }
    public void setLinkedFileId(String linkedFileId) { this.linkedFileId = linkedFileId; }
    public String getLinkedCaptureId() { return linkedCaptureId; }
    public void setLinkedCaptureId(String linkedCaptureId) { this.linkedCaptureId = linkedCaptureId; }
    public List<TimelineEntry> getTimeline() { return timeline; }
    public void setTimeline(List<TimelineEntry> timeline) { this.timeline = timeline; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
