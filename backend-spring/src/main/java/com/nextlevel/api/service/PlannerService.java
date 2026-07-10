package com.nextlevel.api.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.PlannerTaskCreateRequest;
import com.nextlevel.api.dto.PlannerTaskPatchRequest;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.repository.PlannerTaskRepository;

@Service
public class PlannerService {

    private static final Logger log = LoggerFactory.getLogger(PlannerService.class);
    private final PlannerTaskRepository plannerTaskRepository;
    private final GamificationService gamificationService;
    private final GoogleCalendarService googleCalendarService;

    public PlannerService(PlannerTaskRepository plannerTaskRepository, GamificationService gamificationService, GoogleCalendarService googleCalendarService) {
        this.plannerTaskRepository = plannerTaskRepository;
        this.gamificationService = gamificationService;
        this.googleCalendarService = googleCalendarService;
    }

    public List<PlannerTask> listTasks(String userId, Instant start, Instant end) {
        log.info("Listing planner tasks for user: {}, between {} and {}", userId, start, end);
        return plannerTaskRepository.findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscStartTimeAsc(userId, start, end);
    }

    public PlannerTask createTask(String userId, PlannerTaskCreateRequest request) {
        log.info("Creating planner task for user: {}", userId);
        PlannerTask task = new PlannerTask();
        task.setUserId(userId);
        task.setTitle(request.title().trim());
        task.setDescription(request.description() == null ? "" : request.description());
        task.setScheduledDate(request.scheduledDate());
        task.setStartTime(request.startTime());
        task.setEndTime(request.endTime());
        task.setDuration(request.duration() == null ? 30 : request.duration());
        task.setCategory(request.category() == null ? "study" : request.category());
        task.setPriority(request.priority() == null ? "medium" : request.priority());
        task.setLinkedCaptureId(request.linkedCaptureId());
        task.setLinkedFileId(request.linkedFileId());
        task.setIsRecurring(request.isRecurring() != null ? request.isRecurring() : false);
        task.setRecurPattern(request.recurPattern() == null ? "none" : request.recurPattern());
        
        Instant now = Instant.now();
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        PlannerTask savedTask = plannerTaskRepository.save(task);

        // Asynchronously push to Google Calendar
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            googleCalendarService.pushTaskToGoogleCalendar(savedTask);
        });

        return savedTask;
    }

    public Optional<PlannerTask> patchTask(String id, String userId, PlannerTaskPatchRequest request) {
        log.info("Patching planner task {} for user {}", id, userId);
        return plannerTaskRepository.findByIdAndUserId(id, userId).map(task -> {
            if (request.title() != null) task.setTitle(request.title());
            if (request.description() != null) task.setDescription(request.description());
            if (request.scheduledDate() != null) task.setScheduledDate(request.scheduledDate());
            if (request.startTime() != null) task.setStartTime(request.startTime());
            if (request.endTime() != null) task.setEndTime(request.endTime());
            if (request.duration() != null) task.setDuration(request.duration());
            if (request.category() != null) task.setCategory(request.category());
            if (request.priority() != null) task.setPriority(request.priority());
            if (request.status() != null) {
                if (!"completed".equals(task.getStatus()) && "completed".equals(request.status())) {
                    gamificationService.awardXp(userId, 20, "Completed a task");
                }
                task.setStatus(request.status());
            }
            if (request.linkedCaptureId() != null) task.setLinkedCaptureId(request.linkedCaptureId());
            if (request.linkedFileId() != null) task.setLinkedFileId(request.linkedFileId());
            if (request.isRecurring() != null) task.setIsRecurring(request.isRecurring());
            if (request.recurPattern() != null) task.setRecurPattern(request.recurPattern());
            
            task.setUpdatedAt(Instant.now());
            return plannerTaskRepository.save(task);
        });
    }

    public void deleteTask(String id, String userId) {
        log.info("Deleting planner task {} for user {}", id, userId);
        plannerTaskRepository.findByIdAndUserId(id, userId).ifPresent(plannerTaskRepository::delete);
    }
}
