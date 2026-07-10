package com.nextlevel.api.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.UserRepository;
import com.nextlevel.api.model.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotionIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(NotionIntegrationService.class);

    @Value("${spring.integrations.notion.client-id}")
    private String clientId;

    @Value("${spring.integrations.notion.client-secret}")
    private String clientSecret;

    @Value("${spring.integrations.notion.redirect-uri}")
    private String redirectUri;

    private final CaptureRepository captureRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NotionIntegrationService(CaptureRepository captureRepository, UserRepository userRepository) {
        this.captureRepository = captureRepository;
        this.userRepository = userRepository;
    }

    public void handleOAuthCallback(String code, String userId) {
        try {
            log.info("Exchanging Notion code for token. User: {}", userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String auth = clientId + ":" + clientSecret;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.setBasicAuth(encodedAuth);
            
            Map<String, String> body = new HashMap<>();
            body.put("grant_type", "authorization_code");
            body.put("code", code);
            body.put("redirect_uri", redirectUri);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.notion.com/v1/oauth/token",
                request,
                String.class
            );
            
            JsonNode root = objectMapper.readTree(response.getBody());
            String accessToken = root.path("access_token").asText();
            
            // Save Notion token to User
            userRepository.findById(userId).ifPresent(user -> {
                user.setNotionAccessToken(accessToken);
                userRepository.save(user);
            });

            // Once we have the token, immediately trigger an import of their pages
            importDatabases(userId, accessToken);
            
        } catch (Exception e) {
            log.error("Failed to exchange Notion OAuth token", e);
            throw new RuntimeException("Failed to exchange Notion OAuth token", e);
        }
    }

    public void importDatabases(String userId, String accessToken) {
        try {
            log.info("Starting Notion import for user: {}", userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Notion-Version", "2022-06-28");
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Search for all pages the integration has access to
            Map<String, Object> body = new HashMap<>();
            body.put("filter", Map.of("value", "page", "property", "object"));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.notion.com/v1/search",
                HttpMethod.POST,
                request,
                String.class
            );
            
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode results = root.path("results");
            
            for (JsonNode page : results) {
                String pageId = page.path("id").asText();
                String title = extractNotionTitle(page);
                String content = "Imported from Notion Page ID: " + pageId + "\n" + page.path("url").asText();
                
                // We're keeping it simple here and just storing the URL/Title. 
                // Full block extraction would require recursive API calls to /v1/blocks/{block_id}/children
                Capture capture = new Capture();
                capture.setUserId(userId);
                capture.setTitle(title.isEmpty() ? "Untitled Notion Page" : title);
                capture.setRawContent(content);
                capture.setType("note");
                capture.setStatus("active");
                captureRepository.save(capture);
            }
            
            log.info("Successfully imported Notion pages for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to import from Notion", e);
        }
    }
    
    private String extractNotionTitle(JsonNode page) {
        try {
            JsonNode properties = page.path("properties");
            // The title property key is variable, usually it's "title" or "Name" and has type "title"
            for (JsonNode prop : properties) {
                if ("title".equals(prop.path("type").asText())) {
                    JsonNode titleArray = prop.path("title");
                    if (titleArray.isArray() && titleArray.size() > 0) {
                        return titleArray.get(0).path("plain_text").asText();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract title from Notion page");
        }
        return "Untitled";
    }
}
