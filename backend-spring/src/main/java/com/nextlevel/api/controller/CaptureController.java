package com.nextlevel.api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.jobrunr.scheduling.JobScheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonView;
import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.CaptureCreateRequest;
import com.nextlevel.api.dto.CapturePatchRequest;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.Views;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.CaptureProcessingService;
import com.nextlevel.api.service.CaptureService;

@RestController
@RequestMapping("/api/captures")
public class CaptureController {

    private static final Logger log = LoggerFactory.getLogger(CaptureController.class);

    private final CaptureService captureService;
    private final CaptureProcessingService captureProcessingService;
    private final JobScheduler jobScheduler;

    public CaptureController(CaptureService captureService, CaptureProcessingService captureProcessingService, JobScheduler jobScheduler) {
        this.captureService = captureService;
        this.captureProcessingService = captureProcessingService;
        this.jobScheduler = jobScheduler;
    }

    @JsonView(Views.Public.class)
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

        Page<Capture> capturePage = captureService.listCaptures(
                currentUser.getUserId(), status, category, urgency, pinned, search, pageable);

        Map<String, Object> data = new HashMap<>();
        data.put("data", capturePage.getContent());
        data.put("total", capturePage.getTotalElements());
        data.put("hasMore", (skip + capturePage.getContent().size()) < capturePage.getTotalElements());

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @JsonView(Views.Public.class)
    @PostMapping
    public ResponseEntity<ApiResponse<Capture>> createCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody CaptureCreateRequest request) {

        // Basic sanitization
        if (request.getRawContent() != null) {
            request.setRawContent(com.nextlevel.api.util.SanitizationUtils.sanitizeText(request.getRawContent()));
        }
        
        Capture saved = captureService.createCapture(currentUser.getUserId(), request);

        try {
            jobScheduler.enqueue(() -> captureProcessingService.processCapture(saved.getId(), saved.getRawContent(), saved.getType()));
        } catch (Exception ex) {
            log.error("Failed to enqueue JobRunr job for capture {}", saved.getId(), ex);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @JsonView(Views.Internal.class)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Capture>> getCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        return captureService.getCapture(id, currentUser.getUserId())
                .map(capture -> ResponseEntity.ok(ApiResponse.success(capture)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Capture not found")));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Capture>> patchCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody CapturePatchRequest request) {
        return captureService.patchCapture(id, currentUser.getUserId(), request)
                .map(capture -> ResponseEntity.ok(ApiResponse.success(capture)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Capture not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCapture(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        captureService.deleteCapture(id, currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.message("Capture deleted"));
    }


}
