package com.nextlevel.api.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

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

@Service
public class AnalyticsService {

    private final CaptureRepository captureRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final StudyFileRepository studyFileRepository;
    private final RoadmapRepository roadmapRepository;
    private final ApplicationRepository applicationRepository;
    private final com.nextlevel.api.repository.ResultRepository resultRepository;
    private final com.nextlevel.api.repository.InterviewSessionRepository interviewSessionRepository;
    private final com.nextlevel.api.repository.StudySessionRepository studySessionRepository;
    private final com.nextlevel.api.repository.UserRepository userRepository;
    private final com.nextlevel.api.repository.StudyRoomRepository studyRoomRepository;

    public AnalyticsService(CaptureRepository captureRepository, PlannerTaskRepository plannerTaskRepository,
            StudyFileRepository studyFileRepository, RoadmapRepository roadmapRepository,
            ApplicationRepository applicationRepository,
            com.nextlevel.api.repository.ResultRepository resultRepository,
            com.nextlevel.api.repository.InterviewSessionRepository interviewSessionRepository,
            com.nextlevel.api.repository.StudySessionRepository studySessionRepository,
            com.nextlevel.api.repository.UserRepository userRepository,
            com.nextlevel.api.repository.StudyRoomRepository studyRoomRepository) {
        this.captureRepository = captureRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.studyFileRepository = studyFileRepository;
        this.roadmapRepository = roadmapRepository;
        this.applicationRepository = applicationRepository;
        this.resultRepository = resultRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.studySessionRepository = studySessionRepository;
        this.userRepository = userRepository;
        this.studyRoomRepository = studyRoomRepository;
    }

    public Map<String, Object> getAnalyticsData(String uid) {
        // Ideally these should use count/aggregation queries rather than fetching all data
        // For now, this replicates the controller logic but moves it to the service layer.
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

        List<com.nextlevel.api.model.Result> results = resultRepository.findByUserId(uid);
        List<com.nextlevel.api.model.InterviewSession> interviewSessions = interviewSessionRepository.findByUserId(uid);
        List<com.nextlevel.api.model.StudySession> studySessions = studySessionRepository.findByUserId(uid);
        List<com.nextlevel.api.model.StudyRoom> rooms = studyRoomRepository.findAll();

        captures.forEach(c -> bump(heatmap, c.getCreatedAt()));
        tasks.forEach(t -> {
            bump(heatmap, t.getScheduledDate());
            if (t.getScheduledDate() == null) bump(heatmap, t.getCreatedAt());
        });
        files.forEach(f -> bump(heatmap, f.getCreatedAt()));
        results.forEach(r -> bump(heatmap, r.getCreatedAt()));
        interviewSessions.forEach(s -> bump(heatmap, s.getCreatedAt()));
        studySessions.forEach(s -> {
            bump(heatmap, s.getStartTime());
            if (s.getStartTime() == null) bump(heatmap, s.getCreatedAt());
        });
        rooms.forEach(rm -> {
            if (rm.getPastChallenges() != null) {
                rm.getPastChallenges().forEach(ch -> {
                    boolean attended = ch.getLeaderboard() != null && ch.getLeaderboard().stream()
                            .anyMatch(sc -> uid.equals(sc.getUserId()));
                    if (attended && ch.getCreatedAt() != null) {
                        bump(heatmap, ch.getCreatedAt());
                    }
                });
            }
        });

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
        Map<String, Integer> catDurations = new HashMap<>();
        tasks.forEach(t -> {
            catCounts.merge(t.getCategory(), 1, Integer::sum);
            if (t.getDuration() != null && "done".equals(t.getStatus())) {
                catDurations.merge(t.getCategory(), t.getDuration(), Integer::sum);
            }
        });
        
        var categoryData = catCounts.entrySet().stream().map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList();
        var timeDistribution = catDurations.entrySet().stream().map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList();

        Map<String, Integer> pipeline = new HashMap<>();
        apps.forEach(a -> pipeline.merge(a.getStatus(), 1, Integer::sum));

        int storedUserStreak = userRepository.findById(uid)
                .map(u -> u.getStreak() != null ? u.getStreak() : 0)
                .orElse(0);

        int calculatedStreak = 0;
        int startDay = 0;
        // If today has activity, streak starts from today (i=0).
        // If today has no activity yet, streak continues from yesterday (i=1) because today is not over!
        if (heatmap.getOrDefault(now.toString(), 0) == 0) {
            startDay = 1;
        }
        for (int i = startDay; i < 90; i++) {
            LocalDate d = now.minusDays(i);
            if (heatmap.getOrDefault(d.toString(), 0) > 0) {
                calculatedStreak++;
            } else {
                break;
            }
        }
        int streak = Math.max(calculatedStreak, storedUserStreak);

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
        data.put("timeDistribution", timeDistribution);
        data.put("pipeline", pipeline);
        data.put("streak", streak);
        data.put("counts", counts);
        data.put("roadmapSummaries", roadmapSummaries);

        return data;
    }

    private void bump(Map<String, Integer> heatmap, Instant time) {
        if (time == null) return;
        String key = time.atOffset(ZoneOffset.UTC).toLocalDate().toString();
        if (heatmap.containsKey(key)) {
            heatmap.put(key, heatmap.get(key) + 1);
        }
    }
}
