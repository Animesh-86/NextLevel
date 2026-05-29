package com.nextlevel.api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "savedlinks")
@CompoundIndex(def = "{'userId': 1, 'category': 1, 'createdAt': -1}")
public class SavedLink {

    @Id
    private String id;
    private String userId;
    private String url;
    private String title;
    private String description = "";
    private String category = "other";
    private List<String> tags = new ArrayList<>();
    private String favicon = "";
    private Boolean isPinned = false;
    private Boolean isArchived = false;
    private Instant createdAt;
    private Instant updatedAt;
}
