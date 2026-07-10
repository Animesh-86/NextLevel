package com.nextlevel.api.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.UserRepository;

@Service
public class GamificationService {

    private final UserRepository userRepository;

    public GamificationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void awardXp(String userId, int amount, String reason) {
        if (userId == null) return;
        
        userRepository.findById(userId).ifPresent(user -> {
            int currentXp = user.getXp() == null ? 0 : user.getXp();
            int newXp = currentXp + amount;
            user.setXp(newXp);

            int newLevel = calculateLevel(newXp);
            if (user.getLevel() == null || newLevel > user.getLevel()) {
                user.setLevel(newLevel);
                awardAchievement(user, "level_" + newLevel, "Reached Level " + newLevel, "Awarded for reaching level " + newLevel);
            }

            userRepository.save(user);
        });
    }

    private int calculateLevel(int xp) {
        // Simple formula: 100 XP per level
        return (xp / 100) + 1;
    }

    public void awardAchievement(User user, String id, String label, String desc) {
        if (user.getAchievements() == null) {
            user.setAchievements(new java.util.ArrayList<>());
        }
        
        boolean hasAchievement = user.getAchievements().stream()
                .anyMatch(a -> id.equals(a.get("id")));
                
        if (!hasAchievement) {
            Map<String, Object> achievement = new HashMap<>();
            achievement.put("id", id);
            achievement.put("label", label);
            achievement.put("desc", desc);
            achievement.put("icon", "");
            achievement.put("earnedAt", Instant.now().toString());
            user.getAchievements().add(achievement);
        }
    }
}
