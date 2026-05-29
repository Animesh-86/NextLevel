package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.AnalyticsService;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> get(@AuthenticationPrincipal CurrentUser currentUser) {
        Map<String, Object> data = analyticsService.getAnalyticsData(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
