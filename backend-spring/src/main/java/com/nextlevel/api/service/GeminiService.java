package com.nextlevel.api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

@Service
public class GeminiService {

    private static final Pattern URL_PATTERN = Pattern.compile("https?://\\S+");

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;

    @Value("${app.ai.vector-index:vector_index}")
    private String vectorIndex;

    public GeminiService(ChatModel chatModel, EmbeddingModel embeddingModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
        this.embeddingModel = embeddingModel;
    }

    public String getVectorIndex() {
        return vectorIndex;
    }

    @Retry(name = "geminiApi", fallbackMethod = "fallbackAnalyzeResult")
    @CircuitBreaker(name = "geminiApi", fallbackMethod = "fallbackAnalyzeResult")
    public AiAnalysisResult analyzeText(String text) {
        String input = text == null ? "" : text.trim();
        if (input.isBlank()) {
            return fallbackAnalyze("");
        }

        String prompt = """
                Analyze the following text and extract information.
                Text to analyze:
                \"\"\"
                %s
                \"\"\"
                """.formatted(truncate(input, 2000));

        BeanOutputConverter<AiAnalysisResult> converter = new BeanOutputConverter<>(AiAnalysisResult.class);

        return chatClient.prompt()
                .user(u -> u.text(prompt))
                .system(s -> s.text("You are an intelligent knowledge organizer. Extract details precisely. " + converter.getFormat()))
                .call()
                .entity(converter);
    }

    public AiAnalysisResult analyzeImage(String base64Image, String mimeType) {
        // Due to milestone limitations with multi-modal ChatClient, fallback to simple heuristic if image is passed
        // In a full implementation, we would use Media in the user prompt. 
        return screenshotFallback();
    }

    public AiAnalysisResult analyzeDocument(String base64Data, String mimeType, String fileName) {
        return fallbackDocument(fileName);
    }

    @Retry(name = "geminiApi", fallbackMethod = "fallbackEmbeddings")
    @CircuitBreaker(name = "geminiApi", fallbackMethod = "fallbackEmbeddings")
    public List<Double> generateEmbeddings(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        
        float[] raw = embeddingModel.embed(truncate(text, 8000));
        if (raw == null) return List.of();
        List<Double> vector = new java.util.ArrayList<>(raw.length);
        for (float f : raw) vector.add((double) f);
        return vector;
    }
    
    // Resilience4j Fallbacks
    public AiAnalysisResult fallbackAnalyzeResult(String text, Throwable t) {
        return fallbackAnalyze(text);
    }

    public List<Double> fallbackEmbeddings(String text, Throwable t) {
        return List.of();
    }

    private AiAnalysisResult screenshotFallback() {
        AiAnalysisResult fallback = new AiAnalysisResult();
        fallback.setTitle("Screenshot Capture");
        fallback.setCategory("other");
        fallback.setUrgency("none");
        fallback.setTags(List.of("screenshot"));
        fallback.setSummary("Uploaded screenshot");
        fallback.setExtractedText("");
        return fallback;
    }

    private AiAnalysisResult fallbackDocument(String fileName) {
        String name = fileName == null ? "Document" : fileName.replaceAll("\\.[^.]+$", "").replace('-', ' ').replace('_', ' ');
        String lower = name.toLowerCase(Locale.ROOT);
        String category = "other";
        if (lower.matches(".*(system.?design|hld|lld|scalab).*")) category = "system-design";
        else if (lower.matches(".*(dsa|algo|data.?struct|leetcode|array|tree|graph).*")) category = "dsa";

        AiAnalysisResult result = new AiAnalysisResult();
        result.setTitle(truncate(name, 100));
        result.setSummary("Study material: " + name);
        result.setCategory(category);
        result.setTags(List.of(category.replace('-', ' ')));
        return result;
    }

    private AiAnalysisResult fallbackAnalyze(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        String category = "other";
        if (lower.matches(".*(exam|test|quiz).*")) category = "exam";
        else if (lower.matches(".*(project|github|repo).*")) category = "project";
        else if (lower.matches(".*(deadline|due|submit).*")) category = "deadline";
        else if (lower.matches(".*(http|www|link).*")) category = "resource";

        String urgency = "none";
        if (lower.matches(".*(urgent|asap|critical).*")) urgency = "critical";

        String firstLine = text == null ? "" : text.lines().findFirst().orElse("").trim();
        String title = firstLine.isBlank() ? "New Capture" : truncate(firstLine, 80);

        List<String> tags = new ArrayList<>();
        if (extractFirstUrl(text) != null) tags.add("link");
        if (!"other".equals(category)) tags.add(category);

        AiAnalysisResult fallback = new AiAnalysisResult();
        fallback.setTitle(title);
        fallback.setCategory(category);
        fallback.setUrgency(urgency);
        fallback.setTags(tags);
        fallback.setExtractedLink(extractFirstUrl(text));
        fallback.setSummary(truncate(text, 200));
        return fallback;
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