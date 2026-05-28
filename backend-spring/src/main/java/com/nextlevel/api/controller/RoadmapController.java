package com.nextlevel.api.controller;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.repository.RoadmapRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {

    private final RoadmapRepository roadmapRepository;

    public RoadmapController(RoadmapRepository roadmapRepository) {
        this.roadmapRepository = roadmapRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> list(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String templates) {
        if ("true".equals(templates)) {
            return ResponseEntity.ok(ApiResponse.success(defaultTemplates()));
        }

        List<Roadmap> roadmaps = roadmapRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getUserId()).stream()
                .filter(r -> status == null || "all".equals(status) || status.equals(r.getStatus()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(roadmaps));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Roadmap>> create(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> body) {
        Instant now = Instant.now();

        if (body.get("templateIndex") instanceof Number idxNumber) {
            int idx = idxNumber.intValue();
            List<Map<String, Object>> templates = defaultTemplates();
            if (idx < 0 || idx >= templates.size()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid template"));
            }

            Map<String, Object> t = templates.get(idx);
            Roadmap roadmap = templateToRoadmap(t, currentUser.getUserId(), now);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(roadmapRepository.save(roadmap)));
        }

        String title = str(body.get("title"));
        if (title == null || title.isBlank() || body.get("targetDate") == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Title and target date required"));
        }

        Roadmap roadmap = new Roadmap();
        roadmap.setUserId(currentUser.getUserId());
        roadmap.setTitle(title);
        roadmap.setDescription(strOr(body.get("description"), ""));
        roadmap.setCategory(strOr(body.get("category"), "other"));
        roadmap.setTargetDate(Instant.parse(body.get("targetDate").toString()));
        roadmap.setColor(strOr(body.get("color"), "#ffffff"));
        roadmap.setStatus("active");
        roadmap.setMilestones(mapMilestones(body.get("milestones")));
        roadmap.setOverallProgress(progress(roadmap));
        roadmap.setCreatedAt(now);
        roadmap.setUpdatedAt(now);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(roadmapRepository.save(roadmap)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Roadmap>> get(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        Roadmap roadmap = roadmapRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (roadmap == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));
        return ResponseEntity.ok(ApiResponse.success(roadmap));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Roadmap>> patch(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Roadmap roadmap = roadmapRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (roadmap == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));

        if (body.get("toggleTask") instanceof Map<?, ?> toggleObj) {
            @SuppressWarnings("unchecked") Map<String, Object> toggle = (Map<String, Object>) toggleObj;
            String milestoneId = str(toggle.get("milestoneId"));
            String taskId = str(toggle.get("taskId"));
            roadmap.getMilestones().stream().filter(m -> milestoneId.equals(m.getId())).findFirst().ifPresent(m -> {
                m.getTasks().stream().filter(t -> taskId.equals(t.getId())).findFirst().ifPresent(t -> {
                    boolean done = !Boolean.TRUE.equals(t.getDone());
                    t.setDone(done);
                    t.setCompletedAt(done ? Instant.now() : null);
                });
                boolean allDone = m.getTasks().stream().allMatch(t -> Boolean.TRUE.equals(t.getDone()));
                boolean anyDone = m.getTasks().stream().anyMatch(t -> Boolean.TRUE.equals(t.getDone()));
                m.setStatus(allDone ? "completed" : anyDone ? "in-progress" : "not-started");
            });
        }

        if (body.get("updateMilestone") instanceof Map<?, ?> updateObj) {
            @SuppressWarnings("unchecked") Map<String, Object> update = (Map<String, Object>) updateObj;
            String milestoneId = str(update.get("milestoneId"));
            String st = str(update.get("status"));
            roadmap.getMilestones().stream().filter(m -> milestoneId.equals(m.getId())).findFirst().ifPresent(m -> m.setStatus(st));
        }

        if (body.get("addTask") instanceof Map<?, ?> addObj) {
            @SuppressWarnings("unchecked") Map<String, Object> addTask = (Map<String, Object>) addObj;
            String milestoneId = str(addTask.get("milestoneId"));
            String title = str(addTask.get("title"));
            roadmap.getMilestones().stream().filter(m -> milestoneId.equals(m.getId())).findFirst().ifPresent(m -> {
                Roadmap.TaskItem task = new Roadmap.TaskItem();
                task.setId(UUID.randomUUID().toString());
                task.setTitle(title);
                task.setDone(false);
                m.getTasks().add(task);
            });
        }

        if (body.containsKey("title")) roadmap.setTitle(strOr(body.get("title"), roadmap.getTitle()));
        if (body.containsKey("description")) roadmap.setDescription(strOr(body.get("description"), roadmap.getDescription()));
        if (body.containsKey("category")) roadmap.setCategory(strOr(body.get("category"), roadmap.getCategory()));
        if (body.containsKey("targetDate") && body.get("targetDate") != null) roadmap.setTargetDate(Instant.parse(body.get("targetDate").toString()));
        if (body.containsKey("status")) roadmap.setStatus(strOr(body.get("status"), roadmap.getStatus()));
        if (body.containsKey("color")) roadmap.setColor(strOr(body.get("color"), roadmap.getColor()));

        roadmap.setOverallProgress(progress(roadmap));
        if (roadmap.getOverallProgress() == 100 && "active".equals(roadmap.getStatus())) roadmap.setStatus("completed");
        roadmap.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(roadmapRepository.save(roadmap)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        Roadmap roadmap = roadmapRepository.findByIdAndUserId(id, currentUser.getUserId()).orElse(null);
        if (roadmap != null) roadmapRepository.delete(roadmap);
        return ResponseEntity.ok(ApiResponse.message("Deleted"));
    }

    private int progress(Roadmap roadmap) {
        int total = 0;
        int done = 0;
        for (Roadmap.Milestone m : roadmap.getMilestones()) {
            if (m.getTasks().isEmpty()) {
                total += 1;
                if ("completed".equals(m.getStatus())) done += 1;
            } else {
                total += m.getTasks().size();
                done += (int) m.getTasks().stream().filter(t -> Boolean.TRUE.equals(t.getDone())).count();
            }
        }
        return total == 0 ? 0 : Math.round((done * 100f) / total);
    }

    private Roadmap templateToRoadmap(Map<String, Object> t, String userId, Instant now) {
        Roadmap roadmap = new Roadmap();
        roadmap.setUserId(userId);
        roadmap.setTitle(strOr(t.get("title"), "Roadmap"));
        roadmap.setDescription(strOr(t.get("description"), ""));
        roadmap.setCategory(strOr(t.get("category"), "other"));
        roadmap.setColor(strOr(t.get("color"), "#ffffff"));
        roadmap.setStartDate(now);
        roadmap.setTargetDate(now.plus(28, ChronoUnit.DAYS));
        roadmap.setMilestones(mapMilestones(t.get("milestones")));
        roadmap.setOverallProgress(progress(roadmap));
        roadmap.setCreatedAt(now);
        roadmap.setUpdatedAt(now);
        return roadmap;
    }

    @SuppressWarnings("unchecked")
    private List<Roadmap.Milestone> mapMilestones(Object input) {
        if (!(input instanceof List<?> list)) return List.of();
        List<Roadmap.Milestone> milestones = new ArrayList<>();
        int index = 0;
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> mObj)) continue;
            Map<String, Object> m = (Map<String, Object>) mObj;
            Roadmap.Milestone milestone = new Roadmap.Milestone();
            milestone.setId(UUID.randomUUID().toString());
            milestone.setTitle(strOr(m.get("title"), "Milestone"));
            milestone.setDescription(strOr(m.get("description"), ""));
            milestone.setOrder(index++);
            milestone.setStatus(strOr(m.get("status"), "not-started"));
            if (m.get("targetDate") != null) milestone.setTargetDate(Instant.parse(m.get("targetDate").toString()));

            List<Roadmap.TaskItem> tasks = new ArrayList<>();
            Object tasksObj = m.get("tasks");
            if (tasksObj instanceof List<?> tList) {
                for (Object tObj : tList) {
                    Roadmap.TaskItem task = new Roadmap.TaskItem();
                    task.setId(UUID.randomUUID().toString());
                    if (tObj instanceof Map<?, ?> tm) {
                        task.setTitle(strOr(((Map<String, Object>) tm).get("title"), "Task"));
                        task.setDone(Boolean.TRUE.equals(((Map<String, Object>) tm).get("done")));
                    } else {
                        task.setTitle(String.valueOf(tObj));
                        task.setDone(false);
                    }
                    tasks.add(task);
                }
            }
            milestone.setTasks(tasks);
            milestones.add(milestone);
        }
        return milestones;
    }

    private List<Map<String, Object>> defaultTemplates() {
        List<Map<String, Object>> templates = new ArrayList<>();
        templates.add(Map.of(
                "title", "DSA Mastery in 4 Weeks",
                "description", "Complete data structures and algorithms from basics to advanced.",
                "category", "dsa",
                "color", "#ef4444",
                "milestones", List.of(
                        Map.of("title", "Arrays & Strings", "order", 0, "tasks", List.of(
                                Map.of("title", "Two Sum", "done", false),
                                Map.of("title", "Best Time to Buy/Sell Stock", "done", false))),
                        Map.of("title", "Linked Lists & Stacks", "order", 1, "tasks", List.of(
                                Map.of("title", "Reverse Linked List", "done", false),
                                Map.of("title", "Valid Parentheses", "done", false))))));
        templates.add(Map.of(
                "title", "System Design in 6 Weeks",
                "description", "Master system design fundamentals for interviews.",
                "category", "system-design",
                "color", "#3b82f6",
                "milestones", List.of(
                        Map.of("title", "Fundamentals", "order", 0, "tasks", List.of(
                                Map.of("title", "Scalability Concepts", "done", false),
                                Map.of("title", "CAP Theorem", "done", false))),
                        Map.of("title", "Design Patterns", "order", 1, "tasks", List.of(
                                Map.of("title", "URL Shortener", "done", false),
                                Map.of("title", "Chat System", "done", false))))));
        templates.add(Map.of(
                "title", "Full-Stack Web Dev in 8 Weeks",
                "description", "Build production-ready web applications from scratch.",
                "category", "web-dev",
                "color", "#22c55e",
                "milestones", List.of(
                        Map.of("title", "HTML/CSS/JS Foundations", "order", 0, "tasks", List.of(
                                Map.of("title", "Semantic HTML", "done", false),
                                Map.of("title", "Flexbox & Grid", "done", false))),
                        Map.of("title", "Backend & APIs", "order", 1, "tasks", List.of(
                                Map.of("title", "Node.js & Express", "done", false),
                                Map.of("title", "REST API Design", "done", false))))));
        return templates;
    }

    private String str(Object value) { return value == null ? null : value.toString(); }
    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
}
