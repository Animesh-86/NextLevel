package com.nextlevel.api.controller;

import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.InterviewMessageRequest;
import com.nextlevel.api.dto.InterviewSetupRequest;
import com.nextlevel.api.model.InterviewSession;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.InterviewService;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InterviewSession>>> listInterviews(@AuthenticationPrincipal CurrentUser currentUser) {
        List<InterviewSession> sessions = interviewService.listSessions(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewSession>> getInterview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        return interviewService.getSession(currentUser.getUserId(), id)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Interview session not found")));
    }

    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<InterviewSession>> setupInterview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody InterviewSetupRequest request) {
        try {
            InterviewSession session = interviewService.createSession(currentUser.getUserId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(session));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to setup interview: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/message")
    public ResponseEntity<ApiResponse<InterviewSession>> sendMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @Validated @RequestBody InterviewMessageRequest request) {
        try {
            InterviewSession session = interviewService.processCandidateMessage(currentUser.getUserId(), id, request);
            return ResponseEntity.ok(ApiResponse.success(session));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to process interview message: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<ApiResponse<InterviewSession>> finishInterview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        try {
            InterviewSession session = interviewService.finishInterview(currentUser.getUserId(), id);
            return ResponseEntity.ok(ApiResponse.success(session));
        } catch (IllegalArgumentException e) {
            HttpStatus status = (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found"))
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to finish interview: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteInterview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        interviewService.deleteSession(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Interview deleted successfully")));
    }
}
