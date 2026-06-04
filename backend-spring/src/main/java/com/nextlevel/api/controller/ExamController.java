package com.nextlevel.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.ExamCreateRequest;
import com.nextlevel.api.dto.ExamUpdateRequest;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.ExamService;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listExams(@AuthenticationPrincipal CurrentUser currentUser) {
        return ResponseEntity.ok(ApiResponse.success(examService.listExams(currentUser)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Exam>> createExam(@AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody ExamCreateRequest request) {
        Exam exam = examService.createExam(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(exam));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExam(@PathVariable String id) {
        return examService.getExamDetails(id)
                .map(data -> ResponseEntity.ok(ApiResponse.success(data)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> updateExam(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody ExamUpdateRequest request) {
        try {
            return examService.updateExam(id, request, currentUser)
                    .map(exam -> ResponseEntity.ok(ApiResponse.success(exam)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found")));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteExam(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        try {
            if (examService.deleteExam(id, currentUser)) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Exam and its questions deleted")));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found"));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        }
    }
}
