package com.nextlevel.api.dto;

import java.util.List;

public record FilePatchRequest(
    String title,
    String category,
    String summary,
    List<String> tags,
    Boolean isPinned,
    Boolean isArchived
) {}
