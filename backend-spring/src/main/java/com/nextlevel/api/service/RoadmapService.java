package com.nextlevel.api.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.RoadmapCreateRequest;
import com.nextlevel.api.dto.RoadmapPatchRequest;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.repository.RoadmapRepository;

@Service
public class RoadmapService {

    private static final Logger log = LoggerFactory.getLogger(RoadmapService.class);
    private final RoadmapRepository roadmapRepository;

    public RoadmapService(RoadmapRepository roadmapRepository) {
        this.roadmapRepository = roadmapRepository;
    }

    public List<Roadmap> listRoadmaps(String userId, String status) {
        log.info("Fetching roadmaps for user: {}, status: {}", userId, status);
        return roadmapRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> status == null || "all".equals(status) || status.equals(r.getStatus()))
                .toList();
    }

    public Roadmap createRoadmap(String userId, RoadmapCreateRequest request) {
        log.info("Creating roadmap for user: {}", userId);
        Instant now = Instant.now();

        if (request.templateIndex() != null) {
            int idx = request.templateIndex();
            List<Map<String, Object>> templates = getDefaultTemplates();
            if (idx < 0 || idx >= templates.size()) {
                throw new IllegalArgumentException("Invalid template index");
            }
            Map<String, Object> t = templates.get(idx);
            Roadmap roadmap = templateToRoadmap(t, userId, now);
            return roadmapRepository.save(roadmap);
        }

        if (request.title() == null || request.title().isBlank() || request.targetDate() == null) {
            throw new IllegalArgumentException("Title and target date required");
        }

        Roadmap roadmap = new Roadmap();
        roadmap.setUserId(userId);
        roadmap.setTitle(request.title());
        roadmap.setDescription(request.description() != null ? request.description() : "");
        roadmap.setCategory(request.category() != null ? request.category() : "other");
        roadmap.setTargetDate(request.targetDate());
        roadmap.setColor(request.color() != null ? request.color() : "#ffffff");
        roadmap.setStatus("active");
        roadmap.setMilestones(mapMilestones(request.milestones()));
        roadmap.setOverallProgress(calculateProgress(roadmap));
        roadmap.setCreatedAt(now);
        roadmap.setUpdatedAt(now);

        return roadmapRepository.save(roadmap);
    }

    public Optional<Roadmap> getRoadmap(String id, String userId) {
        return roadmapRepository.findByIdAndUserId(id, userId);
    }

    public Roadmap patchRoadmap(String id, String userId, RoadmapPatchRequest request) {
        log.info("Patching roadmap {} for user {}", id, userId);
        Roadmap roadmap = roadmapRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Roadmap not found"));

        if (request.toggleTask() != null) {
            String milestoneId = request.toggleTask().milestoneId();
            String taskId = request.toggleTask().taskId();
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

        if (request.updateMilestone() != null) {
            String milestoneId = request.updateMilestone().milestoneId();
            String st = request.updateMilestone().status();
            roadmap.getMilestones().stream().filter(m -> milestoneId.equals(m.getId())).findFirst().ifPresent(m -> m.setStatus(st));
        }

        if (request.addTask() != null) {
            String milestoneId = request.addTask().milestoneId();
            String title = request.addTask().title();
            roadmap.getMilestones().stream().filter(m -> milestoneId.equals(m.getId())).findFirst().ifPresent(m -> {
                Roadmap.TaskItem task = new Roadmap.TaskItem();
                task.setId(UUID.randomUUID().toString());
                task.setTitle(title != null ? title : "Task");
                task.setDone(false);
                m.getTasks().add(task);
            });
        }

        if (request.title() != null) roadmap.setTitle(request.title());
        if (request.description() != null) roadmap.setDescription(request.description());
        if (request.category() != null) roadmap.setCategory(request.category());
        if (request.targetDate() != null) roadmap.setTargetDate(request.targetDate());
        if (request.status() != null) roadmap.setStatus(request.status());
        if (request.color() != null) roadmap.setColor(request.color());

        roadmap.setOverallProgress(calculateProgress(roadmap));
        if (roadmap.getOverallProgress() == 100 && "active".equals(roadmap.getStatus())) roadmap.setStatus("completed");
        roadmap.setUpdatedAt(Instant.now());

        return roadmapRepository.save(roadmap);
    }

    public void deleteRoadmap(String id, String userId) {
        log.info("Deleting roadmap {} for user {}", id, userId);
        roadmapRepository.findByIdAndUserId(id, userId).ifPresent(roadmapRepository::delete);
    }

    private int calculateProgress(Roadmap roadmap) {
        int total = 0;
        int done = 0;
        for (Roadmap.Milestone m : roadmap.getMilestones()) {
            if (m.getTasks() == null || m.getTasks().isEmpty()) {
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
        roadmap.setOverallProgress(calculateProgress(roadmap));
        roadmap.setCreatedAt(now);
        roadmap.setUpdatedAt(now);
        return roadmap;
    }

    @SuppressWarnings("unchecked")
    private List<Roadmap.Milestone> mapMilestones(Object input) {
        if (!(input instanceof List<?> list)) return new ArrayList<>();
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

    public List<Map<String, Object>> getDefaultTemplates() {
        return List.of(
            Map.of(
                "title", "DSA Mastery in 4 Weeks",
                "description", "Complete data structures and algorithms from basics to advanced.",
                "category", "dsa",
                "color", "#ef4444",
                "milestones", List.of(
                    Map.of("title", "Arrays & Strings", "order", 0, "tasks", List.of(
                        Map.of("title", "Two Sum", "done", false),
                        Map.of("title", "Best Time to Buy/Sell Stock", "done", false)
                    )),
                    Map.of("title", "Linked Lists & Stacks", "order", 1, "tasks", List.of(
                        Map.of("title", "Reverse Linked List", "done", false),
                        Map.of("title", "Valid Parentheses", "done", false)
                    ))
                )
            ),
            Map.of(
                "title", "System Design in 6 Weeks",
                "description", "Master system design fundamentals for interviews.",
                "category", "system-design",
                "color", "#3b82f6",
                "milestones", List.of(
                    Map.of("title", "Fundamentals", "order", 0, "tasks", List.of(
                        Map.of("title", "Scalability Concepts", "done", false),
                        Map.of("title", "CAP Theorem", "done", false)
                    )),
                    Map.of("title", "Design Patterns", "order", 1, "tasks", List.of(
                        Map.of("title", "URL Shortener", "done", false),
                        Map.of("title", "Chat System", "done", false)
                    ))
                )
            ),
            Map.of(
                "title", "Full-Stack Web Dev in 8 Weeks",
                "description", "Build production-ready web applications from scratch.",
                "category", "web-dev",
                "color", "#22c55e",
                "milestones", List.of(
                    Map.of("title", "HTML/CSS/JS Foundations", "order", 0, "tasks", List.of(
                        Map.of("title", "Semantic HTML", "done", false),
                        Map.of("title", "Flexbox & Grid", "done", false)
                    )),
                    Map.of("title", "Backend & APIs", "order", 1, "tasks", List.of(
                        Map.of("title", "Node.js & Express", "done", false),
                        Map.of("title", "REST API Design", "done", false)
                    ))
                )
            )
        );
    }

    private String strOr(Object value, String fallback) { return value == null ? fallback : value.toString(); }
}
