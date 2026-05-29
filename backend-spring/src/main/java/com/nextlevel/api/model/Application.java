package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "applications")
@CompoundIndexes({
        @CompoundIndex(def = "{'userId': 1, 'status': 1}"),
        @CompoundIndex(def = "{'userId': 1, 'company': 1}")
})
public class Application {

    @Data
    public static class TimelineEntry {
        private Instant date = Instant.now();
        private String event;
        private String notes = "";
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
}
