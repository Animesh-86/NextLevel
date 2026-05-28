package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.CaptureCreateRequest;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.security.CurrentUser;

import org.jobrunr.scheduling.JobScheduler;

@RestController
@RequestMapping("/api/captures")
public class CaptureController {

    private final CaptureRepository captureRepository;
    private final com.nextlevel.api.service.CaptureProcessingService captureProcessingService;
    private final JobScheduler jobScheduler;

    public CaptureController(CaptureRepository captureRepository, com.nextlevel.api.service.CaptureProcessingService captureProcessingService, JobScheduler jobScheduler) {
        this.captureRepository = captureRepository;
        this.captureProcessingService = captureProcessingService;
        this.jobScheduler = jobScheduler;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> listCaptures(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "active") String status,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String urgency,
            @RequestParam(required = false) String pinned,
            @RequestParam(required = false) String search) {

        int page = skip / Math.max(limit, 1);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(limit, 1),
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt")));

        String effectiveStatus = "all".equals(status) ? "active" : status;
        Page<Capture> capturePage = captureRepository.findByUserIdAndStatus(currentUser.getUserId(), effectiveStatus, pageable);

        List<Capture> filtered = capturePage.getContent().stream()
                .filter(c -> category == null || "all".equals(category) || category.equals(c.getCategory()))
                .filter(c -> urgency == null || "all".equals(urgency) || urgency.equals(c.getUrgency()))
                .filter(c -> pinned == null || !"true".equals(pinned) || Boolean.TRUE.equals(c.getIsPinned()))
                .filter(c -> search == null || search.isBlank() || matchesSearch(c, search))
                .map(this::withoutImageData)
                .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("data", filtered);
        data.put("total", capturePage.getTotalElements());
        data.put("hasMore", (skip + filtered.size()) < capturePage.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Capture>> createCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody CaptureCreateRequest request) {
        Instant now = Instant.now();

        Capture capture = new Capture();
        capture.setUserId(currentUser.getUserId());
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

        Capture saved = captureRepository.save(capture);
        Capture responseCapture = withoutImageData(saved);

        // Trigger background processing (durable) via JobRunr
        try {
            jobScheduler.enqueue(() -> captureProcessingService.processCapture(saved.getId(), saved.getRawContent(), saved.getType()));
        } catch (Exception ignored) {
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(responseCapture));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Capture>> getCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        Capture capture = captureRepository.findByIdAndUserId(id, currentUser.getUserId())
                .orElse(null);

        if (capture == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Capture not found"));
        }

        return ResponseEntity.ok(ApiResponse.success(capture));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Capture>> patchCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Optional<Capture> existingOpt = captureRepository.findByIdAndUserId(id, currentUser.getUserId());
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Capture not found"));
        }

        Capture capture = existingOpt.get();
        applyPatch(capture, body);
        capture.setUpdatedAt(Instant.now());
        Capture saved = captureRepository.save(capture);

        return ResponseEntity.ok(ApiResponse.success(withoutImageData(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        Optional<Capture> capture = captureRepository.findByIdAndUserId(id, currentUser.getUserId());
        if (capture.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Capture not found"));
        }

        captureRepository.delete(capture.get());
        return ResponseEntity.ok(ApiResponse.message("Capture deleted"));
    }

    private Capture withoutImageData(Capture capture) {
        Capture clone = new Capture();
        clone.setId(capture.getId());
        clone.setUserId(capture.getUserId());
        clone.setType(capture.getType());
        clone.setTitle(capture.getTitle());
        clone.setRawContent(capture.getRawContent());
        clone.setDescription(capture.getDescription());
        clone.setCategory(capture.getCategory());
        clone.setTags(capture.getTags());
        clone.setUrgency(capture.getUrgency());
        clone.setReminderAt(capture.getReminderAt());
        clone.setReminderRepeats(capture.getReminderRepeats());
        clone.setIsReminderDismissed(capture.getIsReminderDismissed());
        clone.setIsPinned(capture.getIsPinned());
        clone.setIsArchived(capture.getIsArchived());
        clone.setStatus(capture.getStatus());
        clone.setEmbedding(capture.getEmbedding());
        clone.setCreatedAt(capture.getCreatedAt());
        clone.setUpdatedAt(capture.getUpdatedAt());
        return clone;
    }

    private boolean matchesSearch(Capture capture, String search) {
        String query = search.toLowerCase();
        return contains(capture.getTitle(), query)
                || contains(capture.getRawContent(), query)
                || contains(capture.getDescription(), query)
                || (capture.getTags() != null && capture.getTags().stream().anyMatch(tag -> contains(tag, query)));
    }

    private boolean contains(String source, String query) {
        return source != null && source.toLowerCase().contains(query);
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String optionalOr(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return new ArrayList<>();
        }

        return tags.stream()
                .filter(tag -> tag != null && !tag.isBlank())
                .map(tag -> tag.trim().toLowerCase())
                .collect(Collectors.toList());
    }

    private void applyPatch(Capture capture, Map<String, Object> body) {
        if (body.containsKey("title")) {
            capture.setTitle((String) body.get("title"));
        }
        if (body.containsKey("description")) {
            capture.setDescription((String) body.get("description"));
        }
        if (body.containsKey("category")) {
            capture.setCategory((String) body.get("category"));
        }
        if (body.containsKey("tags") && body.get("tags") instanceof List<?> tags) {
            List<String> normalized = tags.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .filter(tag -> !tag.isBlank())
                    .map(tag -> tag.trim().toLowerCase())
                    .collect(Collectors.toList());
            capture.setTags(normalized);
        }
        if (body.containsKey("urgency")) {
            capture.setUrgency((String) body.get("urgency"));
        }
        if (body.containsKey("reminderAt")) {
            Object reminderValue = body.get("reminderAt");
            capture.setReminderAt(reminderValue == null ? null : Instant.parse(reminderValue.toString()));
        }
        if (body.containsKey("reminderRepeats")) {
            capture.setReminderRepeats((String) body.get("reminderRepeats"));
        }
        if (body.containsKey("isReminderDismissed")) {
            capture.setIsReminderDismissed((Boolean) body.get("isReminderDismissed"));
        }
        if (body.containsKey("isPinned")) {
            capture.setIsPinned((Boolean) body.get("isPinned"));
        }
        if (body.containsKey("isArchived")) {
            capture.setIsArchived((Boolean) body.get("isArchived"));
        }
        if (body.containsKey("status")) {
            capture.setStatus((String) body.get("status"));
        }
        if (body.containsKey("rawContent")) {
            capture.setRawContent((String) body.get("rawContent"));
        }
    }
}
