package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.UpdateProfileRequest;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    private final UserRepository userRepository;
    private final ResultRepository resultRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileController(UserRepository userRepository, ResultRepository resultRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resultRepository = resultRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@AuthenticationPrincipal CurrentUser currentUser) {
        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long totalResults = resultRepository.countByUserId(currentUser.getUserId());
        long passedResults = resultRepository.countByUserIdAndPassed(currentUser.getUserId(), true);
        long perfectScores = resultRepository.countByUserIdAndScorePercent(currentUser.getUserId(), 100.0);

        List<Map<String, Object>> achievements = new ArrayList<>();
        if (totalResults >= 1) {
            achievements.add(achievement("first_exam", "First Exam", "Completed your first exam"));
        }
        if (safeInt(user.getStreak()) >= 7) {
            achievements.add(achievement("streak_7", "7-Day Streak", "Practiced 7 days in a row"));
        }
        if (perfectScores >= 1) {
            achievements.add(achievement("perfect", "Perfect Score", "Scored 100% on an exam"));
        }
        if (safeInt(user.getQuestionsAnswered()) >= 100) {
            achievements.add(achievement("100_questions", "Century", "Answered 100 questions"));
        }
        if (passedResults >= 10) {
            achievements.add(achievement("10_passed", "Champion", "Passed 10 exams"));
        }
        if (safeInt(user.getStreak()) >= 30) {
            achievements.add(achievement("streak_30", "Monthly Warrior", "30-day streak"));
        }
        if (safeInt(user.getQuestionsAnswered()) >= 500) {
            achievements.add(achievement("500_questions", "Scholar", "Answered 500 questions"));
        }
        if (safeInt(user.getTotalStudyMinutes()) >= 600) {
            achievements.add(achievement("10_hours", "Dedicated", "10+ hours of study"));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("role", user.getRole());
        data.put("streak", safeInt(user.getStreak()));
        data.put("lastActiveDate", user.getLastActiveDate());
        data.put("totalStudyMinutes", safeInt(user.getTotalStudyMinutes()));
        data.put("questionsAnswered", safeInt(user.getQuestionsAnswered()));
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        data.put("totalExams", totalResults);
        data.put("passedExams", passedResults);
        data.put("achievements", achievements);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getCurrentPassword() != null && request.getNewPassword() != null) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", saved.getId());
        data.put("name", saved.getName());
        data.put("email", saved.getEmail());
        data.put("role", saved.getRole());
        data.put("streak", safeInt(saved.getStreak()));
        data.put("lastActiveDate", saved.getLastActiveDate());
        data.put("totalStudyMinutes", safeInt(saved.getTotalStudyMinutes()));
        data.put("questionsAnswered", safeInt(saved.getQuestionsAnswered()));
        data.put("createdAt", saved.getCreatedAt());
        data.put("updatedAt", saved.getUpdatedAt());

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    private Map<String, Object> achievement(String id, String label, String desc) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("label", label);
        map.put("desc", desc);
        return map;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
