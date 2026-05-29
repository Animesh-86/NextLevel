package com.nextlevel.api.service;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Exam;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.model.Result;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;

@Service
public class StatsService {

    private static final Logger log = LoggerFactory.getLogger(StatsService.class);
    private final ResultRepository resultRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public StatsService(ResultRepository resultRepository, QuestionRepository questionRepository,
            ExamRepository examRepository, UserRepository userRepository) {
        this.resultRepository = resultRepository;
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getUserStats(String userId) {
        log.info("Fetching stats for user: {}", userId);
        
        long totalExamsTaken = resultRepository.countByUserId(userId);
        List<Result> results = resultRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
        long totalQuestions = questionRepository.count();
        long examCount = examRepository.count();
        User user = userRepository.findById(userId).orElse(null);

        int avgScore = results.isEmpty() ? 0 : (int) Math.round(results.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).average().orElse(0));
        long passCount = results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        int passRate = results.isEmpty() ? 0 : (int) Math.round((passCount * 100.0) / results.size());
        int bestScore = results.isEmpty() ? 0 : (int) Math.round(results.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).max().orElse(0));

        // N+1 Query Fix: Collect all unique question IDs first
        Set<String> allQuestionIds = new HashSet<>();
        for (Result result : results) {
            if (result.getUserAnswers() != null) {
                allQuestionIds.addAll(result.getUserAnswers().keySet());
            }
        }

        // Fetch all needed questions in one query
        List<Question> allQuestionsList = questionRepository.findByIdIn(new ArrayList<>(allQuestionIds));
        Map<String, Question> questionMap = allQuestionsList.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Map<String, int[]> modulePerformance = new HashMap<>();
        for (Result result : results) {
            if (result.getUserAnswers() == null) continue;
            for (Map.Entry<String, List<Integer>> entry : result.getUserAnswers().entrySet()) {
                String qId = entry.getKey();
                List<Integer> userAnswer = entry.getValue();
                Question q = questionMap.get(qId);
                
                if (q != null) {
                    modulePerformance.putIfAbsent(q.getModule(), new int[]{0, 0});
                    int[] stat = modulePerformance.get(q.getModule());
                    stat[1] += 1;
                    if (userAnswer.size() == q.getAnswer().size() && userAnswer.stream().allMatch(q.getAnswer()::contains)) {
                        stat[0] += 1;
                    }
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

        // Also fix N+1 for Exams
        Set<String> allExamIds = results.stream().map(Result::getExamId).filter(id -> id != null).collect(Collectors.toSet());
        // We might not have a findByIdIn for ExamRepository, so we can iterate or add it.
        // For simplicity, we'll iterate since it's limited to 5 recent results.
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

        long needsReview = questionRepository.countNeedsReview();

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

        return data;
    }
}
