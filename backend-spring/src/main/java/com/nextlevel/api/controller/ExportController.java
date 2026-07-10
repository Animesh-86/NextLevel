package com.nextlevel.api.controller;

import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.security.CurrentUser;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final CaptureRepository captureRepository;
    private final ObjectMapper objectMapper;

    public ExportController(CaptureRepository captureRepository, ObjectMapper objectMapper) {
        this.captureRepository = captureRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/json")
    public ResponseEntity<byte[]> exportJson(@AuthenticationPrincipal CurrentUser currentUser) {
        try {
            List<Capture> captures = captureRepository.findByUserId(currentUser.getUserId());
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(captures);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", "nextlevel-export.json");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(@AuthenticationPrincipal CurrentUser currentUser) {
        try {
            List<Capture> captures = captureRepository.findByUserId(currentUser.getUserId());
            
            StringWriter writer = new StringWriter();
            writer.write("ID,Title,Type,Status,CreatedAt\n");
            
            for (Capture capture : captures) {
                String id = escapeCsv(capture.getId());
                String title = escapeCsv(capture.getTitle());
                String type = escapeCsv(capture.getType());
                String status = escapeCsv(capture.getStatus());
                String createdAt = escapeCsv(capture.getCreatedAt() != null ? capture.getCreatedAt().toString() : "");
                
                writer.write(String.format("%s,%s,%s,%s,%s\n", id, title, type, status, createdAt));
            }
            
            byte[] bytes = writer.toString().getBytes(StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "nextlevel-export.csv");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String result = value.replace("\"", "\"\"");
        if (result.contains(",") || result.contains("\n") || result.contains("\"")) {
            return "\"" + result + "\"";
        }
        return result;
    }
}
