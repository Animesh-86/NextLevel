package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Exam;
import com.nextlevel.api.repository.ExamRepository;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.repository.ResultRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ResultRepository resultRepository;

    public ExamController(ExamRepository examRepository, QuestionRepository questionRepository,
            ResultRepository resultRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.resultRepository = resultRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listExams(@AuthenticationPrincipal CurrentUser currentUser) {
        List<Map<String, Object>> exams = examRepository.findAllByOrderByCreatedAtDesc().stream().map(exam -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", exam.getId());
            row.put("title", exam.getTitle());
            row.put("description", exam.getDescription());
            row.put("timeLimit", exam.getTimeLimit());
            row.put("passPercentage", exam.getPassPercentage());
            row.put("createdAt", exam.getCreatedAt());
            row.put("updatedAt", exam.getUpdatedAt());
            row.put("questionCount", questionRepository.countByExamId(exam.getId()));
            return row;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Exam>> createExam(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, Object> body) {
        if (!"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        String title = str(body.get("title"));
        if (title == null || title.isBlank()) {
            return ResponseEntity.unprocessableEntity().body(ApiResponse.error("Title is required"));
        }

        Instant now = Instant.now();
        Exam exam = new Exam();
        exam.setTitle(title.trim());
        exam.setDescription(strOr(body.get("description"), ""));
        exam.setTimeLimit(intOr(body.get("timeLimit"), 60));
        exam.setPassPercentage(intOr(body.get("passPercentage"), 75));
        exam.setCreatedAt(now);
        exam.setUpdatedAt(now);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(examRepository.save(exam)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExam(@PathVariable String id) {
        Exam exam = examRepository.findById(id).orElse(null);
        if (exam == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found"));
        }

        long questionCount = questionRepository.countByExamId(id);
        var all = resultRepository.findAll().stream().filter(r -> id.equals(r.getExamId())).toList();
        int timesTaken = all.size();
        double avg = timesTaken == 0 ? 0 : all.stream().mapToDouble(r -> r.getScorePercent() == null ? 0 : r.getScorePercent()).average().orElse(0);
        long passCount = all.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();

        Map<String, Object> data = new HashMap<>();
        data.put("id", exam.getId());
        data.put("title", exam.getTitle());
        data.put("description", exam.getDescription());
        data.put("timeLimit", exam.getTimeLimit());
        data.put("passPercentage", exam.getPassPercentage());
        data.put("createdAt", exam.getCreatedAt());
        data.put("updatedAt", exam.getUpdatedAt());
        data.put("questionCount", questionCount);
        data.put("avgScore", Math.round(avg));
        data.put("timesTaken", timesTaken);
        data.put("passRate", timesTaken > 0 ? Math.round((passCount * 100.0) / timesTaken) : 0);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> updateExam(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        if (!"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        Exam exam = examRepository.findById(id).orElse(null);
        if (exam == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found"));
        }

        if (body.containsKey("title")) exam.setTitle(str(body.get("title")));
        if (body.containsKey("description")) exam.setDescription(str(body.get("description")));
        if (body.containsKey("timeLimit")) exam.setTimeLimit(intOr(body.get("timeLimit"), exam.getTimeLimit()));
        if (body.containsKey("passPercentage")) exam.setPassPercentage(intOr(body.get("passPercentage"), exam.getPassPercentage()));
        exam.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(ApiResponse.success(examRepository.save(exam)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteExam(@AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {
        if (!"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        Exam exam = examRepository.findById(id).orElse(null);
        if (exam == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Exam not found"));
        }

        examRepository.delete(exam);
        questionRepository.findAll().stream().filter(q -> id.equals(q.getExamId())).forEach(questionRepository::delete);

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Exam and its questions deleted")));
    }

    private String str(Object value) { return value == null ? null : value.toString(); }
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
}
