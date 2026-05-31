package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "study_sessions")
public class StudySession {

    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String taskId; // Optional link to a planner task
    
    private Integer durationMinutes; // Time focused
    
    private String notes; // Optional notes taken after focus
    
    private Instant startTime;
    private Instant endTime;
    
    private Instant createdAt;
}
