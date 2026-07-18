package com.nextlevel.api.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.ExamGradingRequest;
import com.nextlevel.api.model.Result;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.ResultService;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> listResults(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String examId) {

        int safePage = Math.max(page, 1);
        int safeLimit = Math.max(limit, 1);
        PageRequest pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Result> resultPage = resultService.listResults(currentUser.getUserId(), examId, pageable);

        List<Map<String, Object>> data = new ArrayList<>();
        for (Result result : resultPage.getContent()) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", result.getId());
            row.put("examId", result.getExamId());
            row.put("scorePercent", result.getScorePercent());
            row.put("correctCount", result.getCorrectCount());
            row.put("wrongCount", result.getWrongCount());
            row.put("skippedCount", result.getSkippedCount());
            row.put("totalCount", result.getTotalCount());
            row.put("passed", result.getPassed());
            row.put("timeTaken", result.getTimeTaken());
            row.put("userAnswers", result.getUserAnswers());
            row.put("createdAt", result.getCreatedAt());

            resultService.getExam(result.getExamId()).ifPresent(exam -> {
                Map<String, Object> examData = new HashMap<>();
                examData.put("id", exam.getId());
                examData.put("title", exam.getTitle());
                examData.put("passPercentage", exam.getPassPercentage());
                row.put("exam", examData);
            });

            data.add(row);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", safePage);
        pagination.put("limit", safeLimit);
        pagination.put("total", resultPage.getTotalElements());
        pagination.put("pages", resultPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("data", data);
        response.put("pagination", pagination);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Result>> createResult(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody ExamGradingRequest request) {

        Result saved = resultService.createResult(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResult(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {

        Result result = resultService.getResult(id, currentUser.getUserId()).orElse(null);

        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Result not found"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", result.getId());
        response.put("examId", result.getExamId());
        response.put("scorePercent", result.getScorePercent());
        response.put("correctCount", result.getCorrectCount());
        response.put("wrongCount", result.getWrongCount());
        response.put("skippedCount", result.getSkippedCount());
        response.put("totalCount", result.getTotalCount());
        response.put("passed", result.getPassed());
        response.put("timeTaken", result.getTimeTaken());
        response.put("userAnswers", result.getUserAnswers());
        response.put("createdAt", result.getCreatedAt());

        resultService.getExam(result.getExamId()).ifPresent(exam -> {
            Map<String, Object> examData = new HashMap<>();
            examData.put("id", exam.getId());
            examData.put("title", exam.getTitle());
            examData.put("passPercentage", exam.getPassPercentage());
            response.put("exam", examData);
        });

        List<Map<String, Object>> questionReview = resultService.buildQuestionReview(result);
        response.put("questionReview", questionReview);
        response.put("moduleBreakdown", resultService.calculateModuleBreakdown(questionReview));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteResult(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {

        Result result = resultService.getResult(id, currentUser.getUserId()).orElse(null);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Result not found"));
        }

        resultService.deleteResult(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Result deleted successfully")));
    }
}
