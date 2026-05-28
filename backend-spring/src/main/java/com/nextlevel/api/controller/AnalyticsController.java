package com.nextlevel.api.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Application;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.model.Roadmap;
import com.nextlevel.api.model.StudyFile;
import com.nextlevel.api.repository.ApplicationRepository;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.PlannerTaskRepository;
import com.nextlevel.api.repository.RoadmapRepository;
import com.nextlevel.api.repository.StudyFileRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final CaptureRepository captureRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final StudyFileRepository studyFileRepository;
    private final RoadmapRepository roadmapRepository;
    private final ApplicationRepository applicationRepository;

    public AnalyticsController(CaptureRepository captureRepository, PlannerTaskRepository plannerTaskRepository,
            StudyFileRepository studyFileRepository, RoadmapRepository roadmapRepository,
            ApplicationRepository applicationRepository) {
        this.captureRepository = captureRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.studyFileRepository = studyFileRepository;
        this.roadmapRepository = roadmapRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> get(@AuthenticationPrincipal CurrentUser currentUser) {
        String uid = currentUser.getUserId();
        List<Capture> captures = captureRepository.findByUserId(uid);
        List<PlannerTask> tasks = plannerTaskRepository.findByUserId(uid);
        List<StudyFile> files = studyFileRepository.findByUserId(uid);
        List<Roadmap> roadmaps = roadmapRepository.findByUserId(uid);
        List<Application> apps = applicationRepository.findByUserId(uid);

        Map<String, Integer> heatmap = new HashMap<>();
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        for (int i = 0; i < 90; i++) {
            LocalDate d = now.minusDays(i);
            heatmap.put(d.toString(), 0);
        }

        captures.forEach(c -> bump(heatmap, c.getCreatedAt()));
        tasks.forEach(t -> bump(heatmap, t.getScheduledDate()));
        files.forEach(f -> bump(heatmap, f.getCreatedAt()));

        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int w = 3; w >= 0; w--) {
            LocalDate start = now.minusDays((long) w * 7 + now.getDayOfWeek().getValue() - 1);
            LocalDate end = start.plusDays(6);
            List<PlannerTask> weekTasks = tasks.stream().filter(t -> {
                if (t.getScheduledDate() == null) return false;
                LocalDate d = t.getScheduledDate().atOffset(ZoneOffset.UTC).toLocalDate();
                return !d.isBefore(start) && !d.isAfter(end);
            }).toList();

            int doneCount = (int) weekTasks.stream().filter(t -> "done".equals(t.getStatus())).count();
            int doneMinutes = weekTasks.stream().filter(t -> "done".equals(t.getStatus())).mapToInt(t -> t.getDuration() == null ? 0 : t.getDuration()).sum();

            weeklyData.add(Map.of(
                    "week", start.getMonth().name().substring(0, 1) + start.getMonth().name().substring(1, 3).toLowerCase() + " " + start.getDayOfMonth(),
                    "total", weekTasks.size(),
                    "done", doneCount,
                    "hours", Math.round(doneMinutes / 60f)));
        }

        Map<String, Integer> catCounts = new HashMap<>();
        tasks.forEach(t -> catCounts.merge(t.getCategory(), 1, Integer::sum));
        var categoryData = catCounts.entrySet().stream().map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList();

        Map<String, Integer> pipeline = new HashMap<>();
        apps.forEach(a -> pipeline.merge(a.getStatus(), 1, Integer::sum));

        int streak = 0;
        for (int i = 0; i < 90; i++) {
            LocalDate d = now.minusDays(i);
            if (heatmap.getOrDefault(d.toString(), 0) > 0) streak++;
            else if (i > 0) break;
        }

        Map<String, Object> counts = new HashMap<>();
        counts.put("captures", captures.size());
        counts.put("tasks", tasks.size());
        counts.put("tasksDone", tasks.stream().filter(t -> "done".equals(t.getStatus())).count());
        counts.put("files", files.size());
        counts.put("roadmaps", roadmaps.size());
        counts.put("roadmapsActive", roadmaps.stream().filter(r -> "active".equals(r.getStatus())).count());
        counts.put("applications", apps.size());
        counts.put("totalStudyHours", Math.round(tasks.stream().filter(t -> "done".equals(t.getStatus())).mapToInt(t -> t.getDuration() == null ? 0 : t.getDuration()).sum() / 60f));

        var roadmapSummaries = roadmaps.stream().filter(r -> "active".equals(r.getStatus())).map(r -> Map.of(
                "_id", r.getId(),
                "title", r.getTitle(),
                "progress", r.getOverallProgress(),
                "category", r.getCategory())).toList();

        Map<String, Object> data = new HashMap<>();
        data.put("heatmap", heatmap);
        data.put("weeklyData", weeklyData);
        data.put("categoryData", categoryData);
        data.put("pipeline", pipeline);
        data.put("streak", streak);
        data.put("counts", counts);
        data.put("roadmapSummaries", roadmapSummaries);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    private void bump(Map<String, Integer> heatmap, Instant time) {
        if (time == null) return;
        String key = time.atOffset(ZoneOffset.UTC).toLocalDate().toString();
        if (heatmap.containsKey(key)) {
            heatmap.put(key, heatmap.get(key) + 1);
        }
    }
}
