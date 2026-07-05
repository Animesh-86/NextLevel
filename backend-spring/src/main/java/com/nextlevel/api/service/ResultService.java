package com.nextlevel.api.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.ExamGradingRequest;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.model.Result;
import com.nextlevel.api.model.User;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.repository.UserRepository;

@Service
public class ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultService.class);

    private final ResultRepository resultRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    public ResultService(ResultRepository resultRepository, UserRepository userRepository,
            ExamRepository examRepository, QuestionRepository questionRepository) {
        this.resultRepository = resultRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
    }

    public Page<Result> listResults(String userId, String examId, Pageable pageable) {
        log.info("Listing results for user: {}, exam: {}", userId, examId);
        if (examId == null || examId.isBlank()) {
            return resultRepository.findByUserId(userId, pageable);
        }
        return resultRepository.findByUserIdAndExamId(userId, examId, pageable);
    }

    public Result createResult(String userId, ExamGradingRequest request) {
        log.info("Creating graded result for user: {}, exam: {}", userId, request.getExamId());
        
        Exam exam = examRepository.findById(request.getExamId()).orElseThrow(() -> new IllegalArgumentException("Exam not found"));
        if (!userId.equals(exam.getUserId())) {
            throw new IllegalArgumentException("Unauthorized: You do not own this exam");
        }
        List<Question> questions = questionRepository.findByExamIdAndUserId(request.getExamId(), userId);
        
        int correctCount = 0;
        int wrongCount = 0;
        int skippedCount = 0;
        int totalCount = questions.size();
        
        Map<String, List<Integer>> userAnswers = request.getUserAnswers();
        
        for (Question q : questions) {
            List<Integer> given = userAnswers.get(q.getId());
            if (given == null || given.isEmpty()) {
                skippedCount++;
            } else {
                List<Integer> expected = q.getAnswer() == null ? List.of() : q.getAnswer();
                boolean isCorrect = given.size() == expected.size() && given.containsAll(expected);
                if (isCorrect) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        }
        
        double scorePercent = totalCount == 0 ? 0.0 : ((double) correctCount / totalCount) * 100.0;
        boolean passed = scorePercent >= exam.getPassPercentage();
        
        Result result = new Result();
        result.setUserId(userId);
        result.setExamId(request.getExamId());
        result.setScorePercent(scorePercent);
        result.setCorrectCount(correctCount);
        result.setWrongCount(wrongCount);
        result.setSkippedCount(skippedCount);
        result.setTotalCount(totalCount);
        result.setPassed(passed);
        result.setTimeTaken(request.getTimeTaken() == null ? Integer.valueOf(0) : (int) Math.round(request.getTimeTaken()));
        result.setUserAnswers(userAnswers);
        result.setCreatedAt(Instant.now());

        Result saved = resultRepository.save(result);
        try {
            updateUserStats(userId, totalCount, result.getTimeTaken());
        } catch (Exception ex) {
            log.error("Failed to update user stats for user: {}", userId, ex);
        }
        return saved;
    }

    public Optional<Result> getResult(String id, String userId) {
        return resultRepository.findByIdAndUserId(id, userId);
    }

    public Optional<Exam> getExam(String examId) {
        if (examId == null) return Optional.empty();
        return examRepository.findById(examId);
    }

    private void updateUserStats(String userId, int totalCount, Integer timeTaken) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;

        User user = userOpt.get();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        if (user.getLastActiveDate() != null) {
            LocalDate lastActive = user.getLastActiveDate().atOffset(ZoneOffset.UTC).toLocalDate();
            long diffDays = ChronoUnit.DAYS.between(lastActive, today);
            if (diffDays == 1) {
                user.setStreak(safeInt(user.getStreak()) + 1);
            } else if (diffDays > 1) {
                user.setStreak(1);
            }
        } else {
            user.setStreak(1);
        }

        user.setLastActiveDate(today.atStartOfDay().toInstant(ZoneOffset.UTC));
        user.setQuestionsAnswered(safeInt(user.getQuestionsAnswered()) + totalCount);

        if (timeTaken != null) {
            int addMinutes = Math.round(timeTaken / 60.0f);
            user.setTotalStudyMinutes(safeInt(user.getTotalStudyMinutes()) + addMinutes);
        }

        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public List<Map<String, Object>> buildQuestionReview(Result result) {
        Map<String, List<Integer>> userAnswers = result.getUserAnswers();
        if (userAnswers == null || userAnswers.isEmpty()) {
            return List.of();
        }

        List<String> questionIds = new ArrayList<>(userAnswers.keySet());
        List<Question> questions = questionRepository.findByIdIn(questionIds);

        List<Map<String, Object>> review = new ArrayList<>();
        for (Question q : questions) {
            List<Integer> given = userAnswers.getOrDefault(q.getId(), List.of());
            List<Integer> expected = q.getAnswer() == null ? List.of() : q.getAnswer();

            boolean isCorrect = given.size() == expected.size() && given.stream().allMatch(expected::contains);

            Map<String, Object> row = new HashMap<>();
            row.put("_id", q.getId());
            row.put("scenario", q.getScenario());
            row.put("options", q.getOptions());
            row.put("type", q.getType());
            row.put("module", q.getModule());
            row.put("correctAnswer", expected);
            row.put("userAnswer", given);
            row.put("isCorrect", isCorrect);
            row.put("explanation", q.getExplanation() == null ? "" : q.getExplanation());
            review.add(row);
        }

        return review;
    }

    public List<Map<String, Object>> calculateModuleBreakdown(List<Map<String, Object>> questionReview) {
        Map<String, int[]> stats = new HashMap<>();

        for (Map<String, Object> row : questionReview) {
            String module = String.valueOf(row.getOrDefault("module", "General"));
            Boolean isCorrect = (Boolean) row.getOrDefault("isCorrect", false);
            stats.putIfAbsent(module, new int[]{0, 0});
            int[] current = stats.get(module);
            current[1] += 1;
            if (Boolean.TRUE.equals(isCorrect)) {
                current[0] += 1;
            }
        }

        List<Map<String, Object>> breakdown = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : stats.entrySet()) {
            int correct = entry.getValue()[0];
            int total = entry.getValue()[1];
            int percent = total == 0 ? 0 : Math.round((correct * 100.0f) / total);

            Map<String, Object> row = new HashMap<>();
            row.put("module", entry.getKey());
            row.put("correct", correct);
            row.put("total", total);
            row.put("percent", percent);
            breakdown.add(row);
        }

        return breakdown;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
