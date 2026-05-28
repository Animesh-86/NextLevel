package com.nextlevel.api.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.ResultCreateRequest;
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
@RequestMapping("/api/results")
public class ResultController {

    private final ResultRepository resultRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    public ResultController(ResultRepository resultRepository, UserRepository userRepository,
            ExamRepository examRepository, QuestionRepository questionRepository) {
        this.resultRepository = resultRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> listResults(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String examId) {

        int safePage = Math.max(page, 1);
        int safeLimit = Math.max(limit, 1);
        PageRequest pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Result> resultPage = (examId == null || examId.isBlank())
                ? resultRepository.findByUserId(currentUser.getUserId(), pageable)
                : resultRepository.findByUserIdAndExamId(currentUser.getUserId(), examId, pageable);

        List<Map<String, Object>> data = new ArrayList<>();
        for (Result result : resultPage.getContent()) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", result.getId());
            row.put("examId", result.getExamId());
            row.put("scorePercent", result.getScorePercent());
            row.put("correctCount", result.getCorrectCount());
            row.put("wrongCount", result.getWrongCount());
            row.put("skippedCount", result.getSkippedCount());
            row.put("totalCount", result.getTotalCount());
            row.put("passed", result.getPassed());
            row.put("timeTaken", result.getTimeTaken());
            row.put("userAnswers", result.getUserAnswers());
            row.put("createdAt", result.getCreatedAt());

            if (result.getExamId() != null) {
                Optional<Exam> exam = examRepository.findById(result.getExamId());
                exam.ifPresent(value -> {
                    Map<String, Object> examData = new HashMap<>();
                    examData.put("id", value.getId());
                    examData.put("title", value.getTitle());
                    examData.put("passPercentage", value.getPassPercentage());
                    row.put("exam", examData);
                });
            }

            data.add(row);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", safePage);
        pagination.put("limit", safeLimit);
        pagination.put("total", resultPage.getTotalElements());
        pagination.put("pages", resultPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("data", data);
        response.put("pagination", pagination);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Result>> createResult(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody ResultCreateRequest request) {

        Result result = new Result();
        result.setUserId(currentUser.getUserId());
        result.setExamId(request.getExamId());
        result.setScorePercent(request.getScorePercent());
        result.setCorrectCount(request.getCorrectCount());
        result.setWrongCount(request.getWrongCount());
        result.setSkippedCount(request.getSkippedCount());
        result.setTotalCount(request.getTotalCount());
        result.setPassed(request.getPassed());
        result.setTimeTaken(request.getTimeTaken() == null ? Integer.valueOf(0) : request.getTimeTaken());
        result.setUserAnswers(request.getUserAnswers());
        result.setCreatedAt(Instant.now());

        Result saved = resultRepository.save(result);
        updateUserStats(currentUser.getUserId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResult(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {

        Result result = resultRepository.findByIdAndUserId(id, currentUser.getUserId())
                .orElse(null);

        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Result not found"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", result.getId());
        response.put("examId", result.getExamId());
        response.put("scorePercent", result.getScorePercent());
        response.put("correctCount", result.getCorrectCount());
        response.put("wrongCount", result.getWrongCount());
        response.put("skippedCount", result.getSkippedCount());
        response.put("totalCount", result.getTotalCount());
        response.put("passed", result.getPassed());
        response.put("timeTaken", result.getTimeTaken());
        response.put("userAnswers", result.getUserAnswers());
        response.put("createdAt", result.getCreatedAt());

        if (result.getExamId() != null) {
            examRepository.findById(result.getExamId()).ifPresent(exam -> {
                Map<String, Object> examData = new HashMap<>();
                examData.put("id", exam.getId());
                examData.put("title", exam.getTitle());
                examData.put("passPercentage", exam.getPassPercentage());
                response.put("exam", examData);
            });
        }

        List<Map<String, Object>> questionReview = buildQuestionReview(result);
        response.put("questionReview", questionReview);
        response.put("moduleBreakdown", moduleBreakdown(questionReview));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private void updateUserStats(String userId, ResultCreateRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }

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
        user.setQuestionsAnswered(safeInt(user.getQuestionsAnswered()) + request.getTotalCount());

        if (request.getTimeTaken() != null) {
            int addMinutes = Math.round(request.getTimeTaken() / 60.0f);
            user.setTotalStudyMinutes(safeInt(user.getTotalStudyMinutes()) + addMinutes);
        }

        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    private List<Map<String, Object>> buildQuestionReview(Result result) {
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

    private List<Map<String, Object>> moduleBreakdown(List<Map<String, Object>> questionReview) {
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
