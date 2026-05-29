package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.UpdateProfileRequest;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.UserProfileService;

@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@AuthenticationPrincipal CurrentUser currentUser) {
        try {
            return ResponseEntity.ok(ApiResponse.success(userProfileService.getProfile(currentUser.getUserId())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody UpdateProfileRequest request) {
        try {
            return userProfileService.updateProfile(currentUser.getUserId(), request)
                    .map(data -> ResponseEntity.ok(ApiResponse.success(data)))
                    .orElseGet(() -> ResponseEntity.badRequest().body(ApiResponse.error("User not found")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
