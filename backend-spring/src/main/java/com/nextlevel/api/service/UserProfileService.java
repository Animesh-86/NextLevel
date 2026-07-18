package com.nextlevel.api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.UpdateProfileRequest;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;

@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);
    private final UserRepository userRepository;
    private final ResultRepository resultRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(UserRepository userRepository, ResultRepository resultRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resultRepository = resultRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> getProfile(String userId) {
        log.info("Fetching profile for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long totalResults = resultRepository.countByUserId(userId);
        long passedResults = resultRepository.countByUserIdAndPassed(userId, true);
        long perfectScores = resultRepository.countByUserIdAndScorePercent(userId, 100.0);

        // Compute questionsAnswered live from actual results
        int liveQuestionsAnswered = resultRepository.findByUserId(userId).stream()
                .mapToInt(r -> r.getTotalCount() != null ? r.getTotalCount() : 0)
                .sum();

        List<Map<String, Object>> achievements = new ArrayList<>();
        if (totalResults >= 1) achievements.add(achievement("first_exam", "First Exam", "Completed your first exam"));
        if (safeInt(user.getStreak()) >= 7) achievements.add(achievement("streak_7", "7-Day Streak", "Practiced 7 days in a row"));
        if (perfectScores >= 1) achievements.add(achievement("perfect", "Perfect Score", "Scored 100% on an exam"));
        if (liveQuestionsAnswered >= 100) achievements.add(achievement("100_questions", "Century", "Answered 100 questions"));
        if (passedResults >= 10) achievements.add(achievement("10_passed", "Champion", "Passed 10 exams"));
        if (safeInt(user.getStreak()) >= 30) achievements.add(achievement("streak_30", "Monthly Warrior", "30-day streak"));
        if (liveQuestionsAnswered >= 500) achievements.add(achievement("500_questions", "Scholar", "Answered 500 questions"));
        if (safeInt(user.getTotalStudyMinutes()) >= 600) achievements.add(achievement("10_hours", "Dedicated", "10+ hours of study"));

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("role", user.getRole());
        data.put("streak", safeInt(user.getStreak()));
        data.put("lastActiveDate", user.getLastActiveDate());
        data.put("totalStudyMinutes", safeInt(user.getTotalStudyMinutes()));
        data.put("questionsAnswered", liveQuestionsAnswered);
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        data.put("totalExams", totalResults);
        data.put("passedExams", passedResults);
        data.put("achievements", achievements);
        data.put("customCategories", user.getCustomCategories());

        return data;
    }

    public Optional<Map<String, Object>> updateProfile(String userId, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", userId);
        return userRepository.findById(userId).map(user -> {
            if (request.getName() != null && !request.getName().isBlank()) {
                user.setName(request.getName().trim());
            }

            if (request.getCurrentPassword() != null && request.getNewPassword() != null) {
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                    throw new IllegalArgumentException("Current password is incorrect");
                }
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            }

            if (request.getCustomCategories() != null) {
                user.setCustomCategories(request.getCustomCategories());
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
            data.put("customCategories", saved.getCustomCategories());

            return data;
        });
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
