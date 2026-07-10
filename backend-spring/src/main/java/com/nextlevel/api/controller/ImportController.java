package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.jobrunr.scheduling.JobScheduler;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.ImportProcessingService;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final JobScheduler jobScheduler;
    private final ImportProcessingService importProcessingService;

    public ImportController(JobScheduler jobScheduler, ImportProcessingService importProcessingService) {
        this.jobScheduler = jobScheduler;
        this.importProcessingService = importProcessingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> importQuestions(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String text,
            @RequestParam String examId,
            @RequestParam(defaultValue = "General") String module) {
        if (!currentUser.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        if (examId == null || examId.isBlank()) {
            return ResponseEntity.unprocessableEntity().body(ApiResponse.error("examId is required"));
        }

        try {
            String userId = currentUser.getUserId();
            if (text != null && !text.isBlank()) {
                jobScheduler.enqueue(() -> importProcessingService.processTextImport(text, examId, module, userId));
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Import job queued successfully")));
            } else if (file != null && !file.isEmpty()) {
                String originalName = file.getOriginalFilename();
                String fileName = originalName == null ? "" : originalName.toLowerCase();
                byte[] bytes = file.getBytes();
                
                jobScheduler.enqueue(() -> importProcessingService.processFileImport(bytes, fileName, examId, module, userId));
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Import job queued successfully")));
            } else {
                return ResponseEntity.unprocessableEntity().body(ApiResponse.error("No file or text content provided"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to queue import: " + e.getMessage()));
        }
    }
}
