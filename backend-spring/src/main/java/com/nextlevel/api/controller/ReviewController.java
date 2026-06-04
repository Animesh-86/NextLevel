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
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.service.SpacedRepetitionService;
import com.nextlevel.api.security.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final SpacedRepetitionService spacedRepetitionService;
    private final QuestionRepository questionRepository;

    public ReviewController(SpacedRepetitionService spacedRepetitionService, QuestionRepository questionRepository) {
        this.spacedRepetitionService = spacedRepetitionService;
        this.questionRepository = questionRepository;
    }

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<Question>>> getDueReviews(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "10") int limit) {
        List<Question> due = spacedRepetitionService.getDueReviews(currentUser.getUserId(), limit);
        return ResponseEntity.ok(ApiResponse.success(due));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitReview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> payload) {
        
        String questionId = (String) payload.get("questionId");
        
        if (questionId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("questionId is required"));
        }
        
        String userId = currentUser.getUserId();
        
        Question question = questionRepository.findById(questionId).orElse(null);
        if (question == null) return ResponseEntity.status(404).body(ApiResponse.error("Question not found"));

        List<Integer> expected = question.getAnswer() == null ? List.of() : question.getAnswer();
        
        // Either quality is provided (legacy) or userAnswer is provided (secure grading)
        Integer quality = 0;
        boolean isCorrect = false;
        
        if (payload.containsKey("userAnswer")) {
            List<Integer> given = (List<Integer>) payload.get("userAnswer");
            isCorrect = given.size() == expected.size() && given.containsAll(expected);
            quality = isCorrect ? 5 : 0;
        } else if (payload.containsKey("quality")) {
            quality = (Integer) payload.get("quality");
            isCorrect = quality >= 3;
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Either userAnswer or quality is required"));
        }

        Question updated = spacedRepetitionService.processReview(questionId, quality, userId);
        
        Map<String, Object> response = Map.of(
            "question", updated,
            "isCorrect", isCorrect,
            "correctAnswer", expected,
            "explanation", question.getExplanation() == null ? "" : question.getExplanation()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
