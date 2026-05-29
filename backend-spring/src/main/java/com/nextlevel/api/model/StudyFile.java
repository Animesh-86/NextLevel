package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
@Document(collection = "studyfiles")
@CompoundIndexes({
        @CompoundIndex(def = "{'userId': 1, 'category': 1, 'createdAt': -1}"),
        @CompoundIndex(def = "{'userId': 1, 'isPinned': -1, 'createdAt': -1}")
})
public class StudyFile {
    @Id
    @JsonView(Views.Public.class)
    private String id;
    
    @JsonView(Views.Public.class)
    private String userId;
    
    @JsonView(Views.Public.class)
    private String fileName;
    
    @JsonView(Views.Public.class)
    private String fileType = "other";
    
    @JsonView(Views.Public.class)
    private String mimeType;
    
    @JsonView(Views.Public.class)
    private Long fileSize;
    
    @JsonView(Views.Internal.class)
    private String fileData;
    
    @JsonView(Views.Public.class)
    private String title;
    
    @JsonView(Views.Public.class)
    private String summary = "";
    
    @JsonView(Views.Public.class)
    private String category = "other";
    
    @JsonView(Views.Public.class)
    private List<String> tags = new ArrayList<>();
    
    @JsonView(Views.Public.class)
    private Boolean isPinned = false;
    
    @JsonView(Views.Public.class)
    private Boolean isArchived = false;
    
    @JsonView(Views.Public.class)
    private Instant createdAt;
    
    @JsonView(Views.Public.class)
    private Instant updatedAt;
}
