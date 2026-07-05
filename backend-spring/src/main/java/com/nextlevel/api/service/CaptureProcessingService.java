package com.nextlevel.api.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;

@Service
public class CaptureProcessingService {

    private final CaptureRepository captureRepository;
    private final GroqService groqService;
    private final HttpClient httpClient;

    private final AtomicLong submitted = new AtomicLong(0);
    private final AtomicLong running = new AtomicLong(0);
    private final AtomicLong completed = new AtomicLong(0);
    private final AtomicLong failed = new AtomicLong(0);

    public CaptureProcessingService(CaptureRepository captureRepository, GroqService groqService) {
        this.captureRepository = captureRepository;
        this.groqService = groqService;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    }

    public void processCapture(String captureId, String content, String type) {
        submitted.incrementAndGet();
        running.incrementAndGet();

        try {
            Optional<Capture> captureOpt = captureRepository.findById(captureId);
            if (captureOpt.isEmpty()) {
                completed.incrementAndGet();
                return;
            }

            Capture capture = captureOpt.get();

            String processedContent = resolveContent(type, content);
            AiAnalysisResult analysis;

            if ("screenshot".equals(type) && capture.getImageData() != null && !capture.getImageData().isBlank()) {
                analysis = groqService.analyzeImage(capture.getImageData(), "image/png");
            } else {
                analysis = groqService.analyzeText(processedContent);
            }

            String textToEmbed = "Title: " + nullSafe(analysis.getTitle()) + "\nSummary: " + nullSafe(analysis.getSummary());
            List<Double> embedding = groqService.generateEmbeddings(textToEmbed);

            if (analysis.getTitle() != null && !analysis.getTitle().isBlank()) {
                capture.setTitle(analysis.getTitle());
            }
            if (analysis.getSummary() != null) {
                capture.setDescription(analysis.getSummary());
            }
            if (analysis.getCategory() != null && !analysis.getCategory().isBlank()) {
                capture.setCategory(analysis.getCategory());
            }
            if (analysis.getUrgency() != null && !analysis.getUrgency().isBlank()) {
                capture.setUrgency(analysis.getUrgency());
            }
            if (analysis.getTags() != null && !analysis.getTags().isEmpty()) {
                capture.setTags(analysis.getTags());
            }
            if (embedding != null && !embedding.isEmpty()) {
                capture.setEmbedding(embedding);
            }
            if (analysis.getExtractedText() != null && !analysis.getExtractedText().isBlank()) {
                capture.setRawContent(analysis.getExtractedText());
            }
            capture.setUpdatedAt(Instant.now());

            captureRepository.save(capture);
            completed.incrementAndGet();
        } catch (Exception ex) {
            failed.incrementAndGet();
            throw new RuntimeException("Failed to process capture", ex);
        } finally {
            running.decrementAndGet();
        }
    }

    public Map<String, Object> stats() {
        Map<String, Object> data = new HashMap<>();
        data.put("submitted", submitted.get());
        data.put("running", running.get());
        data.put("completed", completed.get());
        data.put("failed", failed.get());
        return data;
    }

    private String resolveContent(String type, String content) {
        if (content == null) {
            return "";
        }
        boolean shouldScrape = "link".equals(type) || ("text".equals(type) && content.trim().startsWith("http"));
        if (!shouldScrape) {
            return content;
        }

        try {
            URI uri = URI.create("https://r.jina.ai/" + content.trim());
            // Strict SSRF protection
            String target = content.trim().toLowerCase();
            if (!target.startsWith("http://") && !target.startsWith("https://")) {
                return content; // Skip scraping if not http/https
            }
            if (target.matches(".*(?:localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.(?:1[6-9]|2[0-9]|3[0-1])\\.|0\\.0\\.0\\.0).*")) {
                throw new IllegalArgumentException("Scraping internal or private IPs is forbidden");
            }
            
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .GET()
                    .timeout(Duration.ofSeconds(20))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 300 && response.body() != null && !response.body().isBlank()) {
                return response.body();
            }
        } catch (Exception ignored) {
        }
        return content;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}