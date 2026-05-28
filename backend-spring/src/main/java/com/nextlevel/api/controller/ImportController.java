package com.nextlevel.api.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> importQuestions(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String text,
            @RequestParam String examId,
            @RequestParam(defaultValue = "General") String module) {
        if (!"admin".equals(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }

        if (examId == null || examId.isBlank()) {
            return ResponseEntity.unprocessableEntity().body(ApiResponse.error("examId is required"));
        }

        try {
            List<Map<String, Object>> questions = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            if (text != null && !text.isBlank()) {
                questions.addAll(parseSimpleText(text, examId, module));
            } else if (file != null && !file.isEmpty()) {
                String originalName = file.getOriginalFilename();
                String fileName = originalName == null ? "" : originalName.toLowerCase();
                if (fileName.endsWith(".csv")) {
                    questions.addAll(parseCsv(file, examId));
                } else if (fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".txt")) {
                    String content = new String(file.getBytes(), StandardCharsets.UTF_8);
                    questions.addAll(parseSimpleText(content, examId, module));
                } else {
                    return ResponseEntity.unprocessableEntity().body(ApiResponse.error("Unsupported file type. Use PDF, DOCX, or CSV."));
                }
            } else {
                return ResponseEntity.unprocessableEntity().body(ApiResponse.error("No file or text content provided"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("questions", questions);
            data.put("errors", errors);
            data.put("count", questions.size());
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(e.getMessage()));
        }
    }

    private List<Map<String, Object>> parseSimpleText(String text, String examId, String moduleName) {
        List<Map<String, Object>> out = new ArrayList<>();
        String[] blocks = text.split("\\n\\s*\\n");
        for (String b : blocks) {
            String trimmed = b.trim();
            if (trimmed.isBlank()) continue;
            Map<String, Object> q = new HashMap<>();
            q.put("examId", examId);
            q.put("module", moduleName);
            q.put("type", "MCQ");
            q.put("scenario", trimmed);
            q.put("options", List.of("Option A", "Option B", "Option C", "Option D"));
            q.put("answer", List.of(0));
            q.put("chooseCount", 1);
            q.put("explanation", "");
            out.add(q);
        }
        return out;
    }

    private List<Map<String, Object>> parseCsv(MultipartFile file, String examId) throws Exception {
        List<Map<String, Object>> out = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = br.readLine();
            if (header == null) return out;
            String line;
            while ((line = br.readLine()) != null) {
                String[] c = line.split(",");
                if (c.length < 3) continue;
                Map<String, Object> q = new HashMap<>();
                q.put("examId", examId);
                q.put("module", c[0].trim().isEmpty() ? "General" : c[0].trim());
                q.put("type", "MCQ");
                q.put("scenario", c[1].trim());
                q.put("options", List.of(c[2].trim(), c.length > 3 ? c[3].trim() : "Option B"));
                q.put("answer", List.of(0));
                q.put("chooseCount", 1);
                q.put("explanation", "");
                out.add(q);
            }
        }
        return out;
    }
}
