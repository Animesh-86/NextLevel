package com.nextlevel.api.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.jobrunr.scheduling.JobScheduler;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.Question;
import com.nextlevel.api.repository.QuestionRepository;
import com.nextlevel.api.service.AIQuestionGeneratorService;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final JobScheduler jobScheduler;
    private final QuestionRepository questionRepository;
    private final AIQuestionGeneratorService aiQuestionGeneratorService;

    public ImportController(JobScheduler jobScheduler, QuestionRepository questionRepository, AIQuestionGeneratorService aiQuestionGeneratorService) {
        this.jobScheduler = jobScheduler;
        this.questionRepository = questionRepository;
        this.aiQuestionGeneratorService = aiQuestionGeneratorService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> importQuestions(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String text,
            @RequestParam String examId,
            @RequestParam(defaultValue = "General") String module) {
        if (!currentUser.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        if (examId == null || examId.isBlank()) {
            return ResponseEntity.unprocessableEntity().body(ApiResponse.error("examId is required"));
        }

        try {
            String userId = currentUser.getUserId();
            if (text != null && !text.isBlank()) {
                jobScheduler.enqueue(() -> processTextImport(text, examId, module, userId));
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Import job queued successfully")));
            } else if (file != null && !file.isEmpty()) {
                String originalName = file.getOriginalFilename();
                String fileName = originalName == null ? "" : originalName.toLowerCase();
                byte[] bytes = file.getBytes();
                
                jobScheduler.enqueue(() -> processFileImport(bytes, fileName, examId, module, userId));
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Import job queued successfully")));
            } else {
                return ResponseEntity.unprocessableEntity().body(ApiResponse.error("No file or text content provided"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to queue import: " + e.getMessage()));
        }
    }

    public void processTextImport(String text, String examId, String moduleName, String userId) {
        List<Question> generated = aiQuestionGeneratorService.generateQuestions(text, examId, moduleName);
        saveGeneratedQuestions(generated, userId);
    }

    public void processFileImport(byte[] bytes, String fileName, String examId, String moduleName, String userId) {
        try {
            List<Question> parsed = new ArrayList<>();
            if (fileName.endsWith(".csv")) {
                parsed.addAll(parseCsv(bytes, examId));
            } else if (fileName.endsWith(".pdf")) {
                try (PDDocument document = Loader.loadPDF(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    String content = stripper.getText(document);
                    parsed.addAll(aiQuestionGeneratorService.generateQuestions(content, examId, moduleName));
                }
            } else if (fileName.endsWith(".txt") || fileName.endsWith(".docx")) {
                String content = new String(bytes, StandardCharsets.UTF_8);
                parsed.addAll(aiQuestionGeneratorService.generateQuestions(content, examId, moduleName));
            }
            saveGeneratedQuestions(parsed, userId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveGeneratedQuestions(List<Question> questions, String userId) {
        if (questions == null || questions.isEmpty()) return;
        for (Question q : questions) {
            q.setUserId(userId);
            q.setCreatedAt(java.time.Instant.now());
            q.setUpdatedAt(java.time.Instant.now());
        }
        questionRepository.saveAll(questions);
    }

    // Retaining parseSimpleText just in case it's needed elsewhere, though now unused.
    private List<Map<String, Object>> parseSimpleText(String text, String examId, String moduleName) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (text == null || text.isBlank()) return out;

        String[] sections = text.split("(?i)---ANSWERS---");
        String questionsText = sections[0];
        String answersText = sections.length > 1 ? sections[1] : "";

        // Parse answers into a map: Question Number -> List of correct option indices (0-indexed)
        Map<Integer, List<Integer>> answerMap = new HashMap<>();
        Pattern ansPattern = Pattern.compile("(\\d+)\\.\\s*([A-Za-z,\\s]+)");
        Matcher ansMatcher = ansPattern.matcher(answersText);
        while (ansMatcher.find()) {
            int qNum = Integer.parseInt(ansMatcher.group(1));
            String ansStr = ansMatcher.group(2).toUpperCase();
            List<Integer> correctIndices = new ArrayList<>();
            for (char c : ansStr.toCharArray()) {
                if (c >= 'A' && c <= 'Z') {
                    correctIndices.add(c - 'A');
                }
            }
            if (!correctIndices.isEmpty()) {
                answerMap.put(qNum, correctIndices);
            }
        }

        // Parse questions
        // Matches "1. Question text" optionally spanning multiple lines until an option "A)"
        Pattern qPattern = Pattern.compile("(\\d+)\\.\\s*(.*?)(?=\\n?\\s*[A-Za-z]\\)|\\Z)", Pattern.DOTALL);
        Matcher qMatcher = qPattern.matcher(questionsText);
        
        int lastEnd = 0;
        Integer currentQNum = null;
        String currentScenario = null;
        
        while (qMatcher.find()) {
            if (currentQNum != null) {
                String optionsSection = questionsText.substring(lastEnd, qMatcher.start());
                out.add(buildQuestion(examId, moduleName, currentQNum, currentScenario, optionsSection, answerMap));
            }
            
            currentQNum = Integer.parseInt(qMatcher.group(1));
            currentScenario = qMatcher.group(2).trim();
            lastEnd = qMatcher.end();
        }
        
        if (currentQNum != null) {
            String optionsSection = questionsText.substring(lastEnd);
            out.add(buildQuestion(examId, moduleName, currentQNum, currentScenario, optionsSection, answerMap));
        }

        return out;
    }

    private Map<String, Object> buildQuestion(String examId, String moduleName, int qNum, String scenario, String optionsSection, Map<Integer, List<Integer>> answerMap) {
        Map<String, Object> q = new HashMap<>();
        q.put("examId", examId);
        q.put("module", moduleName);
        q.put("scenario", scenario);

        List<String> options = new ArrayList<>();
        Pattern optPattern = Pattern.compile("[A-Za-z]\\)\\s*(.*?)(?=\\n?\\s*[A-Za-z]\\)|\\Z)", Pattern.DOTALL);
        Matcher optMatcher = optPattern.matcher(optionsSection);
        while (optMatcher.find()) {
            options.add(optMatcher.group(1).trim());
        }

        if (options.isEmpty()) {
            options.addAll(List.of("True", "False"));
        }

        q.put("options", options);

        List<Integer> correctAnswers = answerMap.getOrDefault(qNum, List.of(0));
        q.put("answer", correctAnswers);

        boolean isMsq = correctAnswers.size() > 1;
        q.put("type", isMsq ? "MSQ" : "MCQ");
        q.put("chooseCount", isMsq ? correctAnswers.size() : 1);
        q.put("explanation", "");

        return q;
    }

    private List<Question> parseCsv(byte[] bytes, String examId) throws Exception {
        List<Question> out = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String header = br.readLine();
            if (header == null) return out;
            String line;
            while ((line = br.readLine()) != null) {
                String[] c = line.split(",");
                if (c.length < 3) continue;
                Question q = new Question();
                q.setExamId(examId);
                q.setModule(c[0].trim().isEmpty() ? "General" : c[0].trim());
                q.setType("MCQ");
                q.setScenario(c[1].trim());
                q.setOptions(List.of(c[2].trim(), c.length > 3 ? c[3].trim() : "Option B"));
                q.setAnswer(List.of(0));
                q.setChooseCount(1);
                q.setExplanation("");
                out.add(q);
            }
        }
        return out;
    }
}
