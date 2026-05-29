package com.nextlevel.api.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;

public record LinkCreateRequest(
    @NotBlank String url,
    @NotBlank String title,
    String description,
    String category,
    List<String> tags
) {}
