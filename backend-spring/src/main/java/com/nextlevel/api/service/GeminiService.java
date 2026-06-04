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
import org.springframework.ai.model.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

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

    @Retry(name = "geminiApi")
    @CircuitBreaker(name = "geminiApi")
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

    public AiAnalysisResult analyzeImage(String base64Image, String mimeType) {
        try {
            // Strip the data URL prefix if present
            String b64 = base64Image.contains(",") ? base64Image.substring(base64Image.indexOf(",") + 1) : base64Image;
            byte[] bytes = java.util.Base64.getDecoder().decode(b64);
            Media media = new Media(MimeTypeUtils.parseMimeType(mimeType), new ByteArrayResource(bytes));
            
            BeanOutputConverter<AiAnalysisResult> converter = new BeanOutputConverter<>(AiAnalysisResult.class);
            return chatClient.prompt()
                    .user(u -> u.text("Analyze the provided image and extract information.").media(media))
                    .system(s -> s.text("You are an intelligent knowledge organizer. Extract details precisely. " + converter.getFormat()))
                    .call()
                    .entity(converter);
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze image", e);
        }
    }

    public AiAnalysisResult analyzeDocument(String base64Data, String mimeType, String fileName) {
        throw new UnsupportedOperationException("Document analysis is pending implementation");
    }

    @Retry(name = "geminiApi")
    @CircuitBreaker(name = "geminiApi")
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