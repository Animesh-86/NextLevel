package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Value;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.GoogleCalendarService;
import com.nextlevel.api.service.NotionIntegrationService;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    private final NotionIntegrationService notionIntegrationService;
    private final GoogleCalendarService googleCalendarService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public IntegrationController(NotionIntegrationService notionIntegrationService, GoogleCalendarService googleCalendarService) {
        this.notionIntegrationService = notionIntegrationService;
        this.googleCalendarService = googleCalendarService;
    }

    @GetMapping("/notion/callback")
    public ResponseEntity<Void> handleNotionCallback(
            @RequestParam String code,
            @AuthenticationPrincipal CurrentUser currentUser) {
        try {
            notionIntegrationService.handleOAuthCallback(code, currentUser.getUserId());
        } catch (Exception e) {
            // Log error
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, frontendUrl + "/settings/integrations?connected=notion")
                .build();
    }

    @GetMapping("/google/callback")
    public ResponseEntity<Void> handleGoogleCallback(
            @RequestParam String code,
            @AuthenticationPrincipal CurrentUser currentUser) {
        try {
            googleCalendarService.handleOAuthCallback(code, currentUser.getUserId());
        } catch (Exception e) {
            // Log error
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, frontendUrl + "/settings/integrations?connected=google")
                .build();
    }
}
