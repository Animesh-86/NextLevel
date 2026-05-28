package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.repository.PlannerTaskRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerTaskRepository plannerTaskRepository;

    public PlannerController(PlannerTaskRepository plannerTaskRepository) {
        this.plannerTaskRepository = plannerTaskRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlannerTask>>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam String start,
            @RequestParam String end) {
        Instant s = Instant.parse(start + "T00:00:00Z");
        Instant e = Instant.parse(end + "T23:59:59Z");
        var tasks = plannerTaskRepository
                .findByUserIdAndScheduledDateBetweenOrderByScheduledDateAscStartTimeAsc(currentUser.getUserId(), s, e);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlannerTask>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> body) {
        if (body.get("title") == null || body.get("scheduledDate") == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Title and date required"));
        }

        Instant now = Instant.now();
        PlannerTask task = new PlannerTask();
        task.setUserId(currentUser.getUserId());
        task.setTitle(body.get("title").toString().trim());
        task.setDescription(strOr(body.get("description"), ""));
        task.setScheduledDate(Instant.parse(body.get("scheduledDate").toString() + "T00:00:00Z"));
        task.setStartTime(strOr(body.get("startTime"), null));
        task.setEndTime(strOr(body.get("endTime"), null));
        task.setDuration(intOr(body.get("duration"), 30));
        task.setCategory(strOr(body.get("category"), "study"));
        task.setPriority(strOr(body.get("priority"), "medium"));
        task.setLinkedCaptureId(strOr(body.get("linkedCaptureId"), null));
        task.setLinkedFileId(strOr(body.get("linkedFileId"), null));
        task.setIsRecurring(boolOr(body.get("isRecurring"), false));
        task.setRecurPattern(strOr(body.get("recurPattern"), "none"));
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(plannerTaskRepository.save(task)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PlannerTask>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        PlannerTask task = plannerTaskRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (task == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found"));

        if (body.containsKey("title")) task.setTitle(strOr(body.get("title"), task.getTitle()));
        if (body.containsKey("description")) task.setDescription(strOr(body.get("description"), task.getDescription()));
        if (body.containsKey("scheduledDate")) task.setScheduledDate(Instant.parse(body.get("scheduledDate").toString() + "T00:00:00Z"));
        if (body.containsKey("startTime")) task.setStartTime(strOr(body.get("startTime"), null));
        if (body.containsKey("endTime")) task.setEndTime(strOr(body.get("endTime"), null));
        if (body.containsKey("duration")) task.setDuration(intOr(body.get("duration"), task.getDuration()));
        if (body.containsKey("category")) task.setCategory(strOr(body.get("category"), task.getCategory()));
        if (body.containsKey("priority")) task.setPriority(strOr(body.get("priority"), task.getPriority()));
        if (body.containsKey("status")) task.setStatus(strOr(body.get("status"), task.getStatus()));
        if (body.containsKey("linkedCaptureId")) task.setLinkedCaptureId(strOr(body.get("linkedCaptureId"), null));
        if (body.containsKey("linkedFileId")) task.setLinkedFileId(strOr(body.get("linkedFileId"), null));
        if (body.containsKey("isRecurring")) task.setIsRecurring(boolOr(body.get("isRecurring"), task.getIsRecurring()));
        if (body.containsKey("recurPattern")) task.setRecurPattern(strOr(body.get("recurPattern"), task.getRecurPattern()));
        task.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(plannerTaskRepository.save(task)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        PlannerTask task = plannerTaskRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (task == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Task not found"));
        plannerTaskRepository.delete(task);
        return ResponseEntity.ok(ApiResponse.message("Task deleted"));
    }

    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
    private Integer intOr(Object value, Integer fallback) {
        if (value == null) return fallback;
        if (value instanceof Number n) return n.intValue();
        String text = value.toString();
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
    private Boolean boolOr(Object value, Boolean fallback) {
        if (value == null) return fallback;
        if (value instanceof Boolean b) return b;
        String text = value.toString();
        return Boolean.parseBoolean(text);
    }
}
