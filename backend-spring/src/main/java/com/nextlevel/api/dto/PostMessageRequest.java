package com.nextlevel.api.dto;

import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    private String type = "CHAT"; // "CHAT" | "MILESTONE" | "CHALLENGE_INVITE"
    private Map<String, Object> metadata;
}
