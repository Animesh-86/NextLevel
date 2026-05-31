package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.DailyDigestService;

@RestController
@RequestMapping("/api/digest")
public class DigestController {

    private final DailyDigestService dailyDigestService;

    public DigestController(DailyDigestService dailyDigestService) {
        this.dailyDigestService = dailyDigestService;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayDigest(@AuthenticationPrincipal CurrentUser currentUser) {
        Map<String, Object> data = dailyDigestService.getDailyDigest(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
