package com.nextlevel.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users/count")
    // @PreAuthorize("hasRole('ADMIN')") // Uncomment when admin roles are set up
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalUsers() {
        long count = userRepository.count();
        return ResponseEntity.ok(ApiResponse.success(Map.of("totalUsers", count)));
    }
}
