package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.AiAnalysisResult;
import com.nextlevel.api.service.GroqService;

@RestController
@RequestMapping("/api/captures")
public class CaptureExtraController {

    private final CaptureRepository captureRepository;
    private final GroqService groqService;

    public CaptureExtraController(CaptureRepository captureRepository, GroqService groqService) {
        this.captureRepository = captureRepository;
        this.groqService = groqService;
    }

    @GetMapping("/reminders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reminders(@AuthenticationPrincipal CurrentUser currentUser) {
        Instant now = Instant.now();
        Instant week = now.plusSeconds(7L * 24 * 60 * 60);

        List<Capture> overdue = captureRepository
                .findTop10ByUserIdAndReminderAtLessThanEqualAndIsReminderDismissedAndStatusOrderByReminderAtAsc(
                        currentUser.getUserId(), now, false, "active");
        List<Capture> upcoming = captureRepository
                .findUpcomingReminders(
                        currentUser.getUserId(), now, week, false, "active");
        long totalPending = captureRepository
                .countByUserIdAndReminderAtLessThanEqualAndIsReminderDismissedAndStatus(currentUser.getUserId(), now,
                        false, "active");

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("overdue", overdue.stream().map(this::withoutImageData).toList());
        payload.put("upcoming", upcoming.stream().map(this::withoutImageData).toList());
        payload.put("totalPending", totalPending);

        return ResponseEntity.ok(ApiResponse.success(payload));
    }

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyze(@RequestBody Map<String, Object> body) {
        String text = body.get("text") == null ? "" : body.get("text").toString().trim();
        String image = body.get("image") == null ? null : body.get("image").toString();
        String mimeType = body.get("mimeType") == null ? "image/png" : body.get("mimeType").toString();

        if (image == null && text.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Text content is required"));
        }

        AiAnalysisResult analysis;
        if (image != null) {
            analysis = groqService.analyzeImage(image, mimeType);
        } else {
            analysis = groqService.analyzeText(text);
        }

        return ResponseEntity.ok(ApiResponse.success(analysis.toResponseMap()));
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Capture>> upload(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String urgency,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String reminderAt,
            @RequestParam(required = false) String reminderRepeats,
            @RequestParam(required = false) String rawContent) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.error("No file uploaded"));
            if (file.getSize() > 10L * 1024L * 1024L) {
                return ResponseEntity.badRequest().body(ApiResponse.error("File too large. Max 10MB."));
            }

            String mime = file.getContentType() == null ? "image/png" : file.getContentType();
            if (!List.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif").contains(mime)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid file type. Use PNG, JPEG, WebP or GIF."));
            }

            String base64 = Base64.getEncoder().encodeToString(file.getBytes());

                String overrideTitle = title == null || title.isBlank() ? null : title;
                String overrideDescription = description == null || description.isBlank() ? null : description;

                AiAnalysisResult analysis = new AiAnalysisResult();
                if (overrideTitle == null || overrideDescription == null) {
                    analysis = groqService.analyzeImage(base64, mime);
                }

                String finalTitle = overrideTitle != null ? overrideTitle
                    : analysis.getTitle() != null ? analysis.getTitle() : "Screenshot Capture";
                String finalDescription = overrideDescription != null ? overrideDescription
                    : analysis.getSummary() != null ? analysis.getSummary() : "";
                String finalCategory = category != null ? category
                    : analysis.getCategory() != null ? analysis.getCategory() : "other";
                String finalUrgency = urgency != null ? urgency
                    : analysis.getUrgency() != null ? analysis.getUrgency() : "none";
                String finalRawContent = rawContent != null ? rawContent
                    : analysis.getExtractedText() != null ? analysis.getExtractedText() : "";

                Capture capture = new Capture();
            capture.setUserId(currentUser.getUserId());
            capture.setType("screenshot");
                capture.setTitle(finalTitle);
                capture.setRawContent(finalRawContent);
                capture.setDescription(finalDescription);
            capture.setImageData("data:" + mime + ";base64," + base64);
                capture.setCategory(finalCategory);
                capture.setUrgency(finalUrgency);
                capture.setTags(resolveTags(tags, analysis.getTags()));
                capture.setReminderAt(resolveReminder(reminderAt, analysis.getReminderSuggestion()));
            capture.setReminderRepeats(reminderRepeats == null ? "none" : reminderRepeats);
            capture.setCreatedAt(Instant.now());
            capture.setUpdatedAt(Instant.now());

            Capture saved = captureRepository.save(capture);
            Capture response = withoutImageData(saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to process screenshot"));
        }
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

    private List<String> resolveTags(String tagsInput, List<String> aiTags) {
        if (tagsInput != null && !tagsInput.isBlank()) {
            return java.util.Arrays.stream(tagsInput.split(","))
                    .map(String::trim)
                    .filter(t -> !t.isBlank())
                    .toList();
        }
        if (aiTags != null && !aiTags.isEmpty()) {
            return aiTags;
        }
        return List.of("screenshot");
    }

    private Instant resolveReminder(String overrideReminderAt, String aiSuggestion) {
        String value = null;
        if (overrideReminderAt != null && !overrideReminderAt.isBlank()) {
            value = overrideReminderAt;
        } else if (aiSuggestion != null && !aiSuggestion.isBlank()) {
            value = aiSuggestion;
        }

        if (value == null) {
            return null;
        }

        try {
            return Instant.parse(value);
        } catch (Exception ex) {
            return null;
        }
    }
}
