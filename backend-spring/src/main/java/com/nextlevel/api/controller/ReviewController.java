package com.nextlevel.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.service.SpacedRepetitionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final SpacedRepetitionService spacedRepetitionService;

    public ReviewController(SpacedRepetitionService spacedRepetitionService) {
        this.spacedRepetitionService = spacedRepetitionService;
    }

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<Question>>> getDueReviews(
            @RequestParam(defaultValue = "10") int limit) {
        List<Question> due = spacedRepetitionService.getDueReviews(limit);
        return ResponseEntity.ok(ApiResponse.success(due));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Question>> submitReview(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        
        String questionId = (String) payload.get("questionId");
        Integer quality = (Integer) payload.get("quality");
        
        if (questionId == null || quality == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("questionId and quality are required"));
        }
        
        String userId = null;
        if (request.getAttribute("user") != null) {
            Map<String, Object> userMap = (Map<String, Object>) request.getAttribute("user");
            userId = (String) userMap.get("id");
        }

        Question updated = spacedRepetitionService.processReview(questionId, quality, userId);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
