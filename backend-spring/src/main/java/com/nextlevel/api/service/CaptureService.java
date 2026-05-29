package com.nextlevel.api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.CaptureCreateRequest;
import com.nextlevel.api.dto.CapturePatchRequest;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;

@Service
public class CaptureService {

    private static final Logger log = LoggerFactory.getLogger(CaptureService.class);
    private final CaptureRepository captureRepository;

    public CaptureService(CaptureRepository captureRepository) {
        this.captureRepository = captureRepository;
    }

    public Page<Capture> listCaptures(String userId, String status, Pageable pageable) {
        log.info("Listing captures for user: {}, status: {}", userId, status);
        String effectiveStatus = "all".equals(status) ? "active" : status;
        return captureRepository.findByUserIdAndStatus(userId, effectiveStatus, pageable);
    }

    public Capture createCapture(String userId, CaptureCreateRequest request) {
        log.info("Creating capture for user: {}", userId);
        Instant now = Instant.now();

        Capture capture = new Capture();
        capture.setUserId(userId);
        capture.setType(optionalOr(request.getType(), "text"));
        capture.setTitle(optionalOr(blankToNull(request.getTitle()), "Processing AI Extraction..."));
        capture.setRawContent(optionalOr(request.getRawContent(), ""));
        capture.setDescription(optionalOr(request.getDescription(), ""));
        capture.setCategory(optionalOr(request.getCategory(), "other"));
        capture.setTags(normalizeTags(request.getTags()));
        capture.setUrgency(optionalOr(request.getUrgency(), "none"));
        capture.setReminderAt(request.getReminderAt());
        capture.setReminderRepeats(optionalOr(request.getReminderRepeats(), "none"));
        capture.setImageData(request.getImageData());
        capture.setCreatedAt(now);
        capture.setUpdatedAt(now);

        return captureRepository.save(capture);
    }

    public Optional<Capture> getCapture(String id, String userId) {
        return captureRepository.findByIdAndUserId(id, userId);
    }

    public Optional<Capture> patchCapture(String id, String userId, CapturePatchRequest request) {
        log.info("Patching capture {} for user {}", id, userId);
        return captureRepository.findByIdAndUserId(id, userId).map(capture -> {
            if (request.title() != null) capture.setTitle(request.title());
            if (request.description() != null) capture.setDescription(request.description());
            if (request.category() != null) capture.setCategory(request.category());
            if (request.tags() != null) capture.setTags(normalizeTags(request.tags()));
            if (request.urgency() != null) capture.setUrgency(request.urgency());
            if (request.reminderAt() != null) capture.setReminderAt(request.reminderAt());
            if (request.reminderRepeats() != null) capture.setReminderRepeats(request.reminderRepeats());
            if (request.isReminderDismissed() != null) capture.setIsReminderDismissed(request.isReminderDismissed());
            if (request.isPinned() != null) capture.setIsPinned(request.isPinned());
            if (request.isArchived() != null) capture.setIsArchived(request.isArchived());
            if (request.status() != null) capture.setStatus(request.status());
            if (request.rawContent() != null) capture.setRawContent(request.rawContent());
            
            capture.setUpdatedAt(Instant.now());
            return captureRepository.save(capture);
        });
    }

    public void deleteCapture(String id, String userId) {
        log.info("Deleting capture {} for user {}", id, userId);
        captureRepository.findByIdAndUserId(id, userId).ifPresent(captureRepository::delete);
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String optionalOr(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) return new ArrayList<>();
        return tags.stream()
                .filter(tag -> tag != null && !tag.isBlank())
                .map(tag -> tag.trim().toLowerCase())
                .collect(Collectors.toList());
    }
}
