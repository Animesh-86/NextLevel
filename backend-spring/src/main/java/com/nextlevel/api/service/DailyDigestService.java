package com.nextlevel.api.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Application;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ApplicationRepository;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.PlannerTaskRepository;
import com.nextlevel.api.repository.RoadmapRepository;
import com.nextlevel.api.repository.UserRepository;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class DailyDigestService {

    private final ConcurrentHashMap<String, Object> userLocks = new ConcurrentHashMap<>();

    private final ChatClient chatClient;
    private final PlannerTaskRepository plannerTaskRepository;
    private final CaptureRepository captureRepository;
    private final RoadmapRepository roadmapRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public DailyDigestService(ChatModel chatModel, 
            PlannerTaskRepository plannerTaskRepository,
            CaptureRepository captureRepository,
            RoadmapRepository roadmapRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository) {
        this.chatClient = ChatClient.builder(chatModel).build();
        this.plannerTaskRepository = plannerTaskRepository;
        this.captureRepository = captureRepository;
        this.roadmapRepository = roadmapRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDailyDigest(String userId) {
        Instant now = Instant.now();
        LocalDate today = now.atOffset(ZoneOffset.UTC).toLocalDate();
        Instant startOfDay = today.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant endOfDay = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        User user = userRepository.findById(userId).orElse(null);
        String name = user != null && user.getName() != null ? user.getName() : "there";
        int streak = user != null && user.getStreak() != null ? user.getStreak() : 0;

        List<PlannerTask> todaysTasks = plannerTaskRepository.findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscStartTimeAsc(userId, startOfDay, endOfDay);
        List<Capture> pendingReminders = captureRepository.findTop10ByUserIdAndReminderAtLessThanEqualAndIsReminderDismissedAndStatusOrderByReminderAtAsc(userId, now, false, "active");

        String todayStr = today.toString(); // format: YYYY-MM-DD
        if (user != null && todayStr.equals(user.getDailyBriefingDate()) && user.getDailyBriefingCache() != null) {
            return Map.of(
                "message", user.getDailyBriefingCache(),
                "taskCount", todaysTasks.size(),
                "reminderCount", pendingReminders.size(),
                "streak", streak
            );
        }

        List<Roadmap> activeRoadmaps = roadmapRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(r -> "active".equals(r.getStatus())).toList();
            
        List<Application> recentApps = applicationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
            .filter(a -> "applied".equals(a.getStatus()) || "screening".equals(a.getStatus()))
            .limit(3).toList();

        Object lock = userLocks.computeIfAbsent(userId, k -> new Object());
        
        synchronized (lock) {
            // Re-check after acquiring lock (double-checked locking pattern)
            user = userRepository.findById(userId).orElse(null);
            if (user != null && todayStr.equals(user.getDailyBriefingDate()) && user.getDailyBriefingCache() != null) {
                return Map.of(
                    "message", user.getDailyBriefingCache(),
                    "taskCount", todaysTasks.size(),
                    "reminderCount", pendingReminders.size(),
                    "streak", streak
                );
            }

            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Write a short, encouraging morning briefing for ").append(name).append(".\n");
            promptBuilder.append("Here is their current status:\n");
            promptBuilder.append("- Current study streak: ").append(streak).append(" days\n");
            promptBuilder.append("- Tasks planned for today: ").append(todaysTasks.size()).append("\n");
            if (!todaysTasks.isEmpty()) {
                promptBuilder.append("  Highlights: ").append(todaysTasks.get(0).getTitle()).append("\n");
            }
            promptBuilder.append("- Pending reminders: ").append(pendingReminders.size()).append("\n");
            promptBuilder.append("- Active learning roadmaps: ").append(activeRoadmaps.size()).append("\n");
            
            promptBuilder.append("\nCRITICAL CONSTRAINTS: Your response must be EXACTLY ONE SENTENCE. Maximum 20 words. Absolutely DO NOT use any emojis. Use plain text only.");

            String message = chatClient.prompt()
                    .user(u -> u.text(promptBuilder.toString()))
                    .call()
                    .content();

            if (message == null || message.trim().isEmpty()) {
                message = "Good morning! Ready to tackle the day?";
            }

            if (user != null) {
                user.setDailyBriefingCache(message);
                user.setDailyBriefingDate(todayStr);
                userRepository.save(user);
            }

            return Map.of(
                "message", message,
                "taskCount", todaysTasks.size(),
                "reminderCount", pendingReminders.size(),
                "streak", streak
            );
        }
    }
}
