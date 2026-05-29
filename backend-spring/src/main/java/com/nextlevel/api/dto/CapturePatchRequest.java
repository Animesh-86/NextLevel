package com.nextlevel.api.dto;

import java.time.Instant;
import java.util.List;

public record CapturePatchRequest(
    String title,
    String description,
    String category,
    List<String> tags,
    String urgency,
    Instant reminderAt,
    String reminderRepeats,
    Boolean isReminderDismissed,
    Boolean isPinned,
    Boolean isArchived,
    String status,
    String rawContent
) {}
