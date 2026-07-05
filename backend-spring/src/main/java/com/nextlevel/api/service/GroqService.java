package com.nextlevel.api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);
    private static final Pattern URL_PATTERN = Pattern.compile("https?://\\S+");
    private static final String VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${app.ai.vector-index:vector_index}")
    private String vectorIndex;

    public GroqService(ChatModel chatModel, EmbeddingModel embeddingModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
        this.embeddingModel = embeddingModel;
    }

    public String getVectorIndex() {
        return vectorIndex;
    }

    @Retry(name = "groqApi")
    @CircuitBreaker(name = "groqApi")
    public AiAnalysisResult analyzeText(String text) {
        String input = text == null ? "" : text.trim();
        if (input.isBlank()) {
            throw new IllegalArgumentException("Cannot analyze empty text");
        }

        BeanOutputConverter<AiAnalysisResult> converter = new BeanOutputConverter<>(AiAnalysisResult.class);

        return chatClient.prompt()
                .user(u -> u.text(truncate(input, 2000)))
                .system(s -> s.text("You are an intelligent knowledge organizer. Analyze the user's text and extract details precisely. " + converter.getFormat()))
                .call()
                .entity(converter);
    }

    @Retry(name = "groqApi")
    @CircuitBreaker(name = "groqApi")
    public AiAnalysisResult analyzeImage(String base64Image, String mimeType) {
        try {
            String cleanBase64 = base64Image;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            String dataUrl = "data:" + (mimeType != null ? mimeType : "image/png") + ";base64," + cleanBase64;

            BeanOutputConverter<AiAnalysisResult> converter = new BeanOutputConverter<>(AiAnalysisResult.class);
            String systemPrompt = "You are an intelligent knowledge organizer for a student. "
                    + "Analyze the screenshot and extract: a short title, category (exam/project/deadline/resource/personal/college/other), "
                    + "urgency (critical/high/medium/low/none), relevant tags, a brief summary, "
                    + "any extracted text from the image, any URL links visible, "
                    + "and a reminder suggestion as an ISO date string if a deadline is visible. "
                    + converter.getFormat();

            // Build the OpenAI-compatible multimodal request without a system role
            Map<String, Object> requestBody = Map.of(
                "model", VISION_MODEL,
                "messages", List.of(
                    Map.of("role", "user", "content", List.of(
                        Map.of("type", "image_url", "image_url", Map.of("url", dataUrl)),
                        Map.of("type", "text", "text", systemPrompt + "\n\nAnalyze this screenshot and extract information. Respond ONLY with the JSON object, no other text.")
                    ))
                ),
                "temperature", 0.3,
                "max_tokens", 1024
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            String response = restTemplate.postForObject(
                "https://api.groq.com/openai/v1/chat/completions",
                entity,
                String.class
            );

            // Parse the response to get the content
            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.warn("Vision API returned no choices");
                return new AiAnalysisResult();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");

            if (content == null || content.isBlank()) {
                log.warn("Vision API returned empty content");
                return new AiAnalysisResult();
            }

            // Extract JSON from the response (may have markdown fences)
            String jsonContent = content.trim();
            int blockStart = jsonContent.indexOf("```json");
            if (blockStart == -1) blockStart = jsonContent.indexOf("```");
            if (blockStart != -1) {
                int start = jsonContent.indexOf('\n', blockStart);
                if (start != -1) {
                    int end = jsonContent.lastIndexOf("```");
                    if (end > start) {
                        jsonContent = jsonContent.substring(start + 1, end).trim();
                    }
                }
            }
            
            // Just in case there's still preamble text and no markdown block used by the model
            int braceStart = jsonContent.indexOf("{");
            int braceEnd = jsonContent.lastIndexOf("}");
            if (braceStart != -1 && braceEnd > braceStart) {
                jsonContent = jsonContent.substring(braceStart, braceEnd + 1);
            }

            return objectMapper.readValue(jsonContent, AiAnalysisResult.class);

        } catch (Exception e) {
            log.error("Image analysis failed: {}", e.getMessage(), e);
            return new AiAnalysisResult();
        }
    }

    public AiAnalysisResult analyzeDocument(String base64Data, String mimeType, String fileName) {
        throw new UnsupportedOperationException("Document analysis is pending implementation");
    }

    @Retry(name = "groqApi")
    @CircuitBreaker(name = "groqApi")
    public List<Double> generateEmbeddings(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Cannot embed empty text");
        }
        
        float[] raw = embeddingModel.embed(truncate(text, 8000));
        if (raw == null) return List.of();
        List<Double> vector = new java.util.ArrayList<>(raw.length);
        for (float f : raw) vector.add((double) f);
        return vector;
    }
    private String extractFirstUrl(String text) {
        if (text == null) return null;
        Matcher matcher = URL_PATTERN.matcher(text);
        if (matcher.find()) return matcher.group();
        return null;
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return "";
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }
}