package com.nextlevel.api.dto;

import java.util.List;

public record LinkPatchRequest(
    String title,
    String url,
    String description,
    String category,
    List<String> tags,
    Boolean isPinned,
    Boolean isArchived
) {}
