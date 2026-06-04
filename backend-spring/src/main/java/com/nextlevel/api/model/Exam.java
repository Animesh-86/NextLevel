package com.nextlevel.api.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "exams")
public class Exam {

    @Id
    private String id;
    private String title;
    private String description;
    private Integer timeLimit;
    private Integer passPercentage;
    private String userId;
    private Instant createdAt;
    private Instant updatedAt;
}
