package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
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
}
