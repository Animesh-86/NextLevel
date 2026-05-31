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

@Service
public class DailyDigestService {

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
        
        List<Roadmap> activeRoadmaps = roadmapRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .filter(r -> "active".equals(r.getStatus())).toList();
            
        List<Application> recentApps = applicationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
            .filter(a -> "applied".equals(a.getStatus()) || "screening".equals(a.getStatus()))
            .limit(3).toList();

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Write a short, encouraging, 2-paragraph morning briefing for ").append(name).append(".\n");
        promptBuilder.append("Here is their current status:\n");
        promptBuilder.append("- Current study streak: ").append(streak).append(" days\n");
        promptBuilder.append("- Tasks planned for today: ").append(todaysTasks.size()).append("\n");
        if (!todaysTasks.isEmpty()) {
            promptBuilder.append("  Highlights: ").append(todaysTasks.get(0).getTitle()).append("\n");
        }
        promptBuilder.append("- Pending reminders: ").append(pendingReminders.size()).append("\n");
        promptBuilder.append("- Active learning roadmaps: ").append(activeRoadmaps.size()).append("\n");
        
        promptBuilder.append("\nYour response should sound like an AI assistant (JARVIS/Friday style) giving a quick morning standup. Do not use markdown headers, just plain text with occasional emojis.");

        String message = chatClient.prompt()
                .user(u -> u.text(promptBuilder.toString()))
                .call()
                .content();

        return Map.of(
            "message", message != null ? message : "Good morning! Ready to tackle the day?",
            "taskCount", todaysTasks.size(),
            "reminderCount", pendingReminders.size(),
            "streak", streak
        );
    }
}
