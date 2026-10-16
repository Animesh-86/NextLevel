package com.nextlevel.api.model;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "room_messages")
@CompoundIndex(def = "{'roomId': 1, 'createdAt': 1}")
public class RoomMessage {

    @Id
    private String id;
    private String roomId;
    private String userId;
    private String userName;
    private String userAvatar;
    private String content;
    
    @Builder.Default
    private String type = "CHAT"; // "CHAT" | "MILESTONE" | "SYSTEM" | "CHALLENGE_INVITE"
    
    private Map<String, Object> metadata;
    private Instant createdAt;
}
