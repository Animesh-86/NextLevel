package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.TestQuestionDto;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String examId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {

        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Question> questionPage = examId == null ? 
            questionRepository.findByUserId(currentUser.getUserId(), pageable) : 
            questionRepository.findByExamIdAndUserId(examId, currentUser.getUserId(), pageable);

        List<Question> filtered = questionPage.getContent().stream()
                .filter(q -> module == null || "all".equals(module) || module.equals(q.getModule()))
                .filter(q -> search == null || q.getScenario().toLowerCase().contains(search.toLowerCase()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "data", filtered,
                "pagination", Map.of(
                        "page", page,
                        "limit", limit,
                        "total", questionPage.getTotalElements(),
                        "pages", questionPage.getTotalPages()))));
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<List<TestQuestionDto>>> getTestQuestions(
            @RequestParam String examId) {
        
        // Find all questions for the exam (could be paginated if huge, but typically tests are fetched whole)
        PageRequest pageable = PageRequest.of(0, 1000); 
        List<Question> questions = questionRepository.findByExamId(examId, pageable).getContent();
        
        List<TestQuestionDto> dtos = questions.stream().map(q -> new TestQuestionDto(
                q.getId(),
                q.getExamId(),
                q.getModule(),
                q.getType(),
                q.getScenario(),
                q.getOptions(),
                q.getChooseCount()
        )).toList();
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody Object body) {

        Instant now = Instant.now();
        if (body instanceof List<?> list) {
            List<Question> questions = list.stream().filter(Map.class::isInstance).map(Map.class::cast).map(this::fromMap).peek(q -> {
                q.setUserId(currentUser.getUserId());
                q.setCreatedAt(now);
                q.setUpdatedAt(now);
            }).toList();
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(questionRepository.saveAll(questions)));
        }

        if (body instanceof Map<?, ?> mapObj) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) mapObj;
            Question q = fromMap(map);
            q.setUserId(currentUser.getUserId());
            q.setCreatedAt(now);
            q.setUpdatedAt(now);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(questionRepository.save(q)));
        }

        return ResponseEntity.unprocessableEntity().body(ApiResponse.error("Invalid payload"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> bulkDelete(@AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String examId) {
        if (examId == null || examId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("examId required for bulk delete"));
        }

        if ("admin".equals(currentUser.getRole())) {
            questionRepository.deleteByExamId(examId);
        } else {
            questionRepository.deleteByExamIdAndUserId(examId, currentUser.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success("Cleared questions for exam"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Question>> getById(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String id) {
        Question question = questionRepository.findById(id).orElse(null);
        if (question == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Question not found"));
        
        if (!currentUser.getUserId().equals(question.getUserId()) && !"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }
        
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Question>> update(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        Question q = questionRepository.findById(id).orElse(null);
        if (q == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Question not found"));
        
        if (!currentUser.getUserId().equals(q.getUserId()) && !"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        if (Boolean.TRUE.equals(body.get("_srsUpdate"))) {
            if (Boolean.TRUE.equals(body.get("incrementTested"))) q.setTimesTested((q.getTimesTested() == null ? 0 : q.getTimesTested()) + 1);
            if (Boolean.TRUE.equals(body.get("incrementFailed"))) q.setTimesFailed((q.getTimesFailed() == null ? 0 : q.getTimesFailed()) + 1);
        } else {
            applyMap(q, body);
        }

        q.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(ApiResponse.success(questionRepository.save(q)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> delete(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String id) {

        Question question = questionRepository.findById(id).orElse(null);
        if (question == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Question not found"));
        
        if (!currentUser.getUserId().equals(question.getUserId()) && !"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        questionRepository.delete(question);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Question deleted")));
    }

    private Question fromMap(Map<String, Object> body) {
        Question q = new Question();
        applyMap(q, body);
        return q;
    }

    @SuppressWarnings("unchecked")
    private void applyMap(Question q, Map<String, Object> body) {
        if (body.containsKey("examId")) q.setExamId(str(body.get("examId")));
        if (body.containsKey("module")) q.setModule(str(body.get("module")));
        if (body.containsKey("type")) q.setType(str(body.get("type")));
        if (body.containsKey("scenario")) q.setScenario(str(body.get("scenario")));
        if (body.containsKey("options")) q.setOptions((List<String>) body.get("options"));
        if (body.containsKey("answer")) q.setAnswer((List<Integer>) body.get("answer"));
        if (body.containsKey("chooseCount")) q.setChooseCount(intOr(body.get("chooseCount"), 1));
        if (body.containsKey("explanation")) q.setExplanation(str(body.get("explanation")));
    }

    private String str(Object value) { return value == null ? null : value.toString(); }
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
