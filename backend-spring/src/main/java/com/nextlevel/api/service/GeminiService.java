package com.nextlevel.api.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiService {

    private static final Pattern URL_PATTERN = Pattern.compile("https?://\\S+");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini-model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${app.ai.embedding-model:text-embedding-004}")
    private String embeddingModel;

    @Value("${app.ai.vector-index:vector_index}")
    private String vectorIndex;

    public GeminiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    public String getVectorIndex() {
        return vectorIndex;
    }

    public AiAnalysisResult analyzeText(String text) {
        String input = text == null ? "" : text.trim();
        if (input.isBlank()) {
            return fallbackAnalyze("");
        }

        String prompt = """
                Analyze the following text and return a JSON object with these fields:
                - \"title\": A concise title (max 80 chars) summarizing the content
                - \"category\": One of: exam, project, deadline, resource, personal, college, work, job-posting, tutorial, code, idea, other
                - \"urgency\": One of: critical, high, medium, low, none
                - \"tags\": An array of 1-4 relevant tags (lowercase, single words or short phrases)
                - \"reminderSuggestion\": If there's a date, deadline, or time mentioned, return the exact ISO date string (YYYY-MM-DDTHH:MM:SS) representing it. Otherwise null.
                - \"extractedLink\": Any URL, website link, or domain mentioned in the text. Otherwise null.
                - \"summary\": A 1-2 sentence summary

                Text to analyze:
                \"\"\"
                %s
                \"\"\"

                Return ONLY valid JSON, no markdown formatting.
                """.formatted(truncate(input, 2000));

        if (!hasApiKey()) {
            return fallbackAnalyze(input);
        }

        try {
            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
            String response = callGenerateContent(payload);
            Optional<AiAnalysisResult> parsed = parseAnalysisFromGenerateResponse(response);
            return parsed.orElseGet(() -> fallbackAnalyze(input));
        } catch (Exception ex) {
            return fallbackAnalyze(input);
        }
    }

    public AiAnalysisResult analyzeImage(String base64Image, String mimeType) {
        String fallbackMime = (mimeType == null || mimeType.isBlank()) ? "image/png" : mimeType;
        String cleanBase64 = base64Image == null ? "" : base64Image;
        String finalMime = fallbackMime;

        if (cleanBase64.startsWith("data:")) {
            int commaIndex = cleanBase64.indexOf(',');
            if (commaIndex > 0) {
                String prefix = cleanBase64.substring(0, commaIndex);
                cleanBase64 = cleanBase64.substring(commaIndex + 1);
                int semicolon = prefix.indexOf(';');
                if (semicolon > 5) {
                    finalMime = prefix.substring(5, semicolon);
                }
            }
        }

        if (cleanBase64.isBlank()) {
            return screenshotFallback();
        }

        String prompt = """
                Look at this screenshot and analyze it. Return a JSON object with:
                - \"title\": A concise title (max 80 chars)
                - \"category\": One of: exam, project, deadline, resource, personal, college, work, job-posting, tutorial, code, idea, other
                - \"urgency\": One of: critical, high, medium, low, none
                - \"tags\": An array of 1-4 relevant tags (lowercase)
                - \"reminderSuggestion\": If a date/deadline/time is visible, return ISO string; otherwise null
                - \"extractedLink\": Any URL/domain visible; otherwise null
                - \"summary\": A 1-2 sentence summary
                - \"extractedText\": All readable text from screenshot

                Return ONLY valid JSON, no markdown formatting.
                """;

        if (!hasApiKey()) {
            return screenshotFallback();
        }

        try {
            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of("parts", List.of(
                            Map.of("text", prompt),
                            Map.of("inlineData", Map.of("mimeType", finalMime, "data", cleanBase64))))));
            String response = callGenerateContent(payload);
            Optional<AiAnalysisResult> parsed = parseAnalysisFromGenerateResponse(response);
            return parsed.orElseGet(this::screenshotFallback);
        } catch (Exception ex) {
            return screenshotFallback();
        }
    }

    public AiAnalysisResult analyzeDocument(String base64Data, String mimeType, String fileName) {
        String safeName = fileName == null ? "Document" : fileName;
        if (!hasApiKey() || base64Data == null || base64Data.isBlank()) {
            return fallbackDocument(safeName);
        }

        String prompt = """
                Analyze this document/file and return a JSON object with:
                - \"title\": A clear, descriptive title (max 100 chars)
                - \"summary\": A 2-4 sentence summary of key topics
                - \"category\": One of: system-design, dsa, web-dev, database, devops, math, college, notes, other
                - \"tags\": An array of 3-6 relevant tags (lowercase)

                Document filename: \"%s\"

                Return ONLY valid JSON, no markdown formatting.
                """.formatted(safeName);

        try {
            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of("parts", List.of(
                            Map.of("text", prompt),
                            Map.of("inlineData", Map.of("mimeType", mimeType, "data", base64Data))))));
            String response = callGenerateContent(payload);
            Optional<AiAnalysisResult> parsed = parseAnalysisFromGenerateResponse(response);
            return parsed.orElseGet(() -> fallbackDocument(safeName));
        } catch (Exception ex) {
            return fallbackDocument(safeName);
        }
    }

    public List<Double> generateEmbeddings(String text) {
        if (!hasApiKey() || text == null || text.isBlank()) {
            return List.of();
        }

        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + URLEncoder.encode(embeddingModel, StandardCharsets.UTF_8)
                    + ":embedContent?key=" + URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);

            Map<String, Object> payload = Map.of(
                    "content", Map.of("parts", List.of(Map.of("text", truncate(text, 8000)))));

            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode values = root.path("embedding").path("values");
            if (!values.isArray()) {
                return List.of();
            }

            List<Double> vector = new ArrayList<>();
            for (JsonNode node : values) {
                vector.add(node.asDouble());
            }
            return vector;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Optional<AiAnalysisResult> parseAnalysisFromGenerateResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                return Optional.empty();
            }

            String text = cleanJsonFence(textNode.asText());
            JsonNode parsed = objectMapper.readTree(text);
            AiAnalysisResult result = new AiAnalysisResult();
            result.setTitle(orNull(parsed, "title"));
            result.setCategory(orNull(parsed, "category"));
            result.setUrgency(orNull(parsed, "urgency"));
            result.setReminderSuggestion(orNull(parsed, "reminderSuggestion"));
            result.setExtractedLink(orNull(parsed, "extractedLink"));
            result.setSummary(orNull(parsed, "summary"));
            result.setExtractedText(orNull(parsed, "extractedText"));

            if (parsed.path("tags").isArray()) {
                List<String> tags = new ArrayList<>();
                for (JsonNode node : parsed.path("tags")) {
                    String value = node.asText("").trim().toLowerCase(Locale.ROOT);
                    if (!value.isBlank()) {
                        tags.add(value);
                    }
                }
                result.setTags(tags);
            }

            return Optional.of(result);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String callGenerateContent(Map<String, Object> payload) throws Exception {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                + URLEncoder.encode(geminiModel, StandardCharsets.UTF_8)
                + ":generateContent?key=" + URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(90))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 300) {
            throw new IllegalStateException("Gemini request failed with status " + response.statusCode());
        }
        return response.body();
    }

    private boolean hasApiKey() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    private AiAnalysisResult screenshotFallback() {
        AiAnalysisResult fallback = new AiAnalysisResult();
        fallback.setTitle("Screenshot Capture");
        fallback.setCategory("other");
        fallback.setUrgency("none");
        fallback.setTags(List.of("screenshot"));
        fallback.setSummary("Uploaded screenshot (AI analysis unavailable)");
        fallback.setExtractedText("");
        return fallback;
    }

    private AiAnalysisResult fallbackDocument(String fileName) {
        String name = fileName.replaceAll("\\.[^.]+$", "").replace('-', ' ').replace('_', ' ');
        String lower = name.toLowerCase(Locale.ROOT);
        String category = "other";
        if (lower.matches(".*(system.?design|hld|lld|scalab).*")) category = "system-design";
        else if (lower.matches(".*(dsa|algo|data.?struct|leetcode|array|tree|graph).*")) category = "dsa";
        else if (lower.matches(".*(react|next|html|css|javascript|node|web).*")) category = "web-dev";
        else if (lower.matches(".*(sql|mongo|database|db).*")) category = "database";
        else if (lower.matches(".*(docker|k8s|aws|cloud|devops|ci.?cd).*")) category = "devops";
        else if (lower.matches(".*(math|calculus|linear|probability).*")) category = "math";
        else if (lower.matches(".*(college|semester|unit|syllabus).*")) category = "college";

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
        if (lower.matches(".*(exam|test|quiz|mcq|marks|score|grade|syllabus).*")) category = "exam";
        else if (lower.matches(".*(project|github|repo|deploy|build|code).*")) category = "project";
        else if (lower.matches(".*(deadline|due|submit|assignment|last date).*")) category = "deadline";
        else if (lower.matches(".*(http|www|link|article|blog|video|tutorial|resource).*")) category = "resource";
        else if (lower.matches(".*(college|class|lecture|professor|semester).*")) category = "college";

        String urgency = "none";
        if (lower.matches(".*(urgent|asap|immediately|critical|emergency).*")) urgency = "critical";
        else if (lower.matches(".*(important|deadline|due today|due tomorrow).*")) urgency = "high";
        else if (lower.matches(".*(soon|this week|reminder|don't forget).*")) urgency = "medium";
        else if (lower.matches(".*(later|sometime|when possible|fyi).*")) urgency = "low";

        String firstLine = text == null ? "" : text.lines().findFirst().orElse("").trim();
        String title = firstLine.isBlank() ? "New Capture" : truncate(firstLine, 80);

        List<String> tags = new ArrayList<>();
        if (extractFirstUrl(text) != null) {
            tags.add("link");
        }
        if (!"other".equals(category)) {
            tags.add(category);
        }

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
        if (text == null) {
            return null;
        }
        Matcher matcher = URL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String cleanJsonFence(String text) {
        return text
                .replace("```json", "")
                .replace("```", "")
                .trim();
    }

    private String truncate(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLen) {
            return value;
        }
        return value.substring(0, maxLen);
    }

    private String orNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }
}