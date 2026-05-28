package com.nextlevel.api.controller;

import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.model.Result;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final ResultRepository resultRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public StatsController(ResultRepository resultRepository, QuestionRepository questionRepository,
            ExamRepository examRepository, UserRepository userRepository) {
        this.resultRepository = resultRepository;
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> get(@AuthenticationPrincipal CurrentUser currentUser) {
        String userId = currentUser.getUserId();

        long totalExamsTaken = resultRepository.countByUserId(userId);
        List<Result> results = resultRepository.findAll().stream().filter(r -> userId.equals(r.getUserId())).limit(50).toList();
        long totalQuestions = questionRepository.count();
        long examCount = examRepository.count();
        User user = userRepository.findById(userId).orElse(null);

        int avgScore = results.isEmpty() ? 0 : (int) Math.round(results.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).average().orElse(0));
        long passCount = results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        int passRate = results.isEmpty() ? 0 : (int) Math.round((passCount * 100.0) / results.size());
        int bestScore = results.isEmpty() ? 0 : (int) Math.round(results.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).max().orElse(0));

        Map<String, int[]> modulePerformance = new HashMap<>();
        for (Result result : results) {
            if (result.getUserAnswers() == null) continue;
            var ids = result.getUserAnswers().keySet();
            List<Question> questions = questionRepository.findByIdIn(ids.stream().toList());
            for (Question q : questions) {
                var userAnswer = result.getUserAnswers().getOrDefault(q.getId(), List.of());
                modulePerformance.putIfAbsent(q.getModule(), new int[]{0, 0});
                int[] stat = modulePerformance.get(q.getModule());
                stat[1] += 1;
                if (userAnswer.size() == q.getAnswer().size() && userAnswer.stream().allMatch(q.getAnswer()::contains)) {
                    stat[0] += 1;
                }
            }
        }

        var radarData = modulePerformance.entrySet().stream().map(e -> Map.of(
                "subject", e.getKey(),
                "A", e.getValue()[1] > 0 ? Math.round((e.getValue()[0] * 100f) / e.getValue()[1]) : 0,
                "fullMark", 100)).toList();

        var weeklyProgress = results.stream().limit(7).sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt())).map(r -> Map.of(
                "name", r.getCreatedAt().atOffset(ZoneOffset.UTC).getDayOfWeek().name().substring(0, 3),
                "score", r.getScorePercent() == null ? 0 : r.getScorePercent())).toList();

        List<Map<String, Object>> recentActivity = results.stream().limit(5).map(r -> {
            Exam exam = r.getExamId() == null ? null : examRepository.findById(r.getExamId()).orElse(null);
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("examTitle", exam == null ? "Unknown Exam" : exam.getTitle());
            m.put("score", r.getScorePercent());
            m.put("passed", r.getPassed());
            m.put("date", r.getCreatedAt());
            return m;
        }).toList();

        long needsReview = questionRepository.findAll().stream().filter(q -> {
            int tested = q.getTimesTested() == null ? 0 : q.getTimesTested();
            int failed = q.getTimesFailed() == null ? 0 : q.getTimesFailed();
            return tested > 0 && ((double) failed / tested) >= 0.5;
        }).count();

        Map<String, Object> data = new HashMap<>();
        data.put("totalExamsTaken", totalExamsTaken);
        data.put("avgScore", avgScore);
        data.put("passRate", passRate);
        data.put("bestScore", bestScore);
        data.put("totalQuestions", totalQuestions);
        data.put("examCount", examCount);
        data.put("needsReview", needsReview);
        data.put("streak", user == null || user.getStreak() == null ? 0 : user.getStreak());
        data.put("radarData", radarData);
        data.put("weeklyProgress", weeklyProgress);
        data.put("recentActivity", recentActivity);

        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
