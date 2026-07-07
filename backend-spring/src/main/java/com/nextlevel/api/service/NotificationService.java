package com.nextlevel.api.service;

import com.nextlevel.api.model.Notification;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.repository.NotificationRepository;
import com.nextlevel.api.repository.PlannerTaskRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PlannerTaskRepository plannerTaskRepository;

    public NotificationService(NotificationRepository notificationRepository, PlannerTaskRepository plannerTaskRepository) {
        this.notificationRepository = notificationRepository;
        this.plannerTaskRepository = plannerTaskRepository;
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public void markAsRead(String id, String userId) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // Runs every hour
    @Scheduled(cron = "0 0 * * * *")
    public void generateDeadlineNotifications() {
        // Find tasks that are due in the next 24 hours and not done
        Instant now = Instant.now();
        Instant next24Hours = now.plus(24, ChronoUnit.HOURS);
        
        List<PlannerTask> pendingTasks = plannerTaskRepository.findByStatusNot("done");
        
        for (PlannerTask task : pendingTasks) {
            if (task.getScheduledDate() != null) {
                if (task.getScheduledDate().isAfter(now) && task.getScheduledDate().isBefore(next24Hours)) {
                    // Create notification
                    // Check if we already notified for this task to avoid spam (we could check existing notifications)
                    // For simplicity, we just create a notification if it's close. 
                    // In a real app, we'd add a "notified" flag to the PlannerTask.
                    String title = "Approaching Deadline";
                    String message = "Your task '" + task.getTitle() + "' is due soon.";
                    Notification notif = new Notification(task.getUserId(), title, message, "REMINDER");
                    notificationRepository.save(notif);
                }
            }
        }
    }
}
