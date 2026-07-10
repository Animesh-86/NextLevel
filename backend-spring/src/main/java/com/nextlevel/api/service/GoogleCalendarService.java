package com.nextlevel.api.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlevel.api.model.Capture;
import com.nextlevel.api.model.PlannerTask;
import com.nextlevel.api.repository.CaptureRepository;
import com.nextlevel.api.repository.PlannerTaskRepository;
import com.nextlevel.api.repository.UserRepository;
import com.nextlevel.api.dto.GoogleCalendarResponseDto;
import com.nextlevel.api.dto.GoogleCalendarEventDto;

@Service
public class GoogleCalendarService {

    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarService.class);

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    private final String redirectUri = "http://localhost:8080/api/integrations/google/callback";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CaptureRepository captureRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final UserRepository userRepository;

    public GoogleCalendarService(CaptureRepository captureRepository, PlannerTaskRepository plannerTaskRepository, UserRepository userRepository) {
        this.captureRepository = captureRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.userRepository = userRepository;
    }

    public void handleOAuthCallback(String code, String userId) {
        try {
            log.info("Exchanging Google code for token. User: {}", userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "authorization_code");
            body.add("code", code);
            body.add("redirect_uri", redirectUri);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                request,
                String.class
            );
            
            JsonNode root = objectMapper.readTree(response.getBody());
            String accessToken = root.path("access_token").asText();
            String refreshToken = root.path("refresh_token").asText();
            
            // Save tokens to User
            userRepository.findById(userId).ifPresent(user -> {
                user.setGoogleAccessToken(accessToken);
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    user.setGoogleRefreshToken(refreshToken);
                }
                userRepository.save(user);
            });

            // Once connected, sync events or save token
            syncEvents(userId, accessToken);
            
        } catch (Exception e) {
            log.error("Failed to exchange Google OAuth token", e);
            throw new RuntimeException("Failed to exchange Google OAuth token", e);
        }
    }

    public void syncEvents(String userId, String accessToken) {
        try {
            log.info("Starting Google Calendar sync for user: {}", userId);
            
            // Clean up legacy Google Calendar captures
            try {
                java.util.List<Capture> userCaptures = captureRepository.findByUserId(userId);
                for (Capture cap : userCaptures) {
                    if (cap.getRawContent() != null && cap.getRawContent().startsWith("Imported Calendar Event:")) {
                        captureRepository.delete(cap);
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to clean up legacy calendar captures", ex);
            }

            // Clean up legacy Google Calendar planner tasks
            try {
                java.util.List<PlannerTask> userTasks = plannerTaskRepository.findByUserId(userId);
                for (PlannerTask t : userTasks) {
                    if (t.getDescription() != null && t.getDescription().startsWith("Google Calendar Event:")) {
                        plannerTaskRepository.delete(t);
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to clean up legacy calendar tasks", ex);
            }

            // Fetch upcoming events
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=" + java.time.Instant.now().toString() + "&maxResults=10&singleEvents=true&orderBy=startTime",
                org.springframework.http.HttpMethod.GET,
                request,
                String.class
            );
            
            GoogleCalendarResponseDto responseDto = objectMapper.readValue(response.getBody(), GoogleCalendarResponseDto.class);
            
            if (responseDto != null && responseDto.items() != null) {
                for (GoogleCalendarEventDto item : responseDto.items()) {
                    String summary = item.summary() != null ? item.summary() : "";
                    String htmlLink = item.htmlLink() != null ? item.htmlLink() : "";
                    String title = summary.isEmpty() ? "Calendar Event" : summary;
                    
                    // Parse date & time
                    String startDateTimeStr = item.start() != null && item.start().dateTime() != null ? item.start().dateTime() : "";
                    String startDateStr = item.start() != null && item.start().date() != null ? item.start().date() : "";

                    java.time.Instant startInstant = null;
                    String startTimeStr = "09:00"; 
                    if (!startDateTimeStr.isEmpty()) {
                        java.time.OffsetDateTime odt = java.time.OffsetDateTime.parse(startDateTimeStr);
                        startInstant = odt.toInstant();
                        startTimeStr = String.format("%02d:%02d", odt.getHour(), odt.getMinute());
                    } else if (!startDateStr.isEmpty()) {
                        java.time.LocalDate ld = java.time.LocalDate.parse(startDateStr);
                        startInstant = ld.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                        startTimeStr = "00:00";
                    }

                    String endDateTimeStr = item.end() != null && item.end().dateTime() != null ? item.end().dateTime() : "";
                    String endDateStr = item.end() != null && item.end().date() != null ? item.end().date() : "";

                    String endTimeStr = "10:00";
                    if (!endDateTimeStr.isEmpty()) {
                        java.time.OffsetDateTime odt = java.time.OffsetDateTime.parse(endDateTimeStr);
                        endTimeStr = String.format("%02d:%02d", odt.getHour(), odt.getMinute());
                    } else if (!endDateStr.isEmpty()) {
                        endTimeStr = "23:59";
                    }

                    int duration = 30;
                    if (!startDateTimeStr.isEmpty() && !endDateTimeStr.isEmpty()) {
                        java.time.OffsetDateTime startOdt = java.time.OffsetDateTime.parse(startDateTimeStr);
                        java.time.OffsetDateTime endOdt = java.time.OffsetDateTime.parse(endDateTimeStr);
                        duration = (int) java.time.Duration.between(startOdt, endOdt).toMinutes();
                    }

                    // Check for duplicate PlannerTask
                    if (startInstant != null) {
                        java.util.Optional<PlannerTask> existingTask = plannerTaskRepository.findByUserIdAndTitleAndScheduledDate(userId, title, startInstant);
                        if (existingTask.isEmpty()) {
                            PlannerTask task = new PlannerTask();
                            task.setUserId(userId);
                            task.setTitle(title);
                            task.setDescription("Google Calendar Event: " + htmlLink);
                            task.setScheduledDate(startInstant);
                            task.setStartTime(startTimeStr);
                            task.setEndTime(endTimeStr);
                            task.setDuration(duration);
                            task.setCategory(null);
                            task.setPriority("medium");
                            task.setStatus("todo");
                            task.setCreatedAt(java.time.Instant.now());
                            task.setUpdatedAt(java.time.Instant.now());
                            plannerTaskRepository.save(task);
                        }
                    }
                }
            }
            
            log.info("Successfully imported Google Calendar events for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to sync from Google Calendar", e);
        }
    }

    public String refreshAccessToken(String refreshToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("refresh_token", refreshToken);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                request,
                String.class
            );
            
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("access_token").asText();
        } catch (Exception e) {
            log.error("Failed to refresh Google access token", e);
            return null;
        }
    }

    public void pushTaskToGoogleCalendar(PlannerTask task) {
        try {
            java.util.Optional<com.nextlevel.api.model.User> userOpt = userRepository.findById(task.getUserId());
            if (userOpt.isEmpty()) return;
            com.nextlevel.api.model.User user = userOpt.get();
            
            String refreshToken = user.getGoogleRefreshToken();
            if (refreshToken == null || refreshToken.isEmpty()) {
                log.info("Google Calendar is not connected for user {}", task.getUserId());
                return;
            }
            
            String accessToken = refreshAccessToken(refreshToken);
            if (accessToken == null || accessToken.isEmpty()) return;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("summary", task.getTitle());
            body.put("description", task.getDescription());
            
            java.time.LocalDate localDate = task.getScheduledDate().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            String startHourMin = task.getStartTime() == null || task.getStartTime().isEmpty() ? "09:00" : task.getStartTime();
            String endHourMin = task.getEndTime() == null || task.getEndTime().isEmpty() ? "10:00" : task.getEndTime();
            
            java.time.LocalDateTime startLdt = localDate.atTime(java.time.LocalTime.parse(startHourMin));
            java.time.LocalDateTime endLdt = localDate.atTime(java.time.LocalTime.parse(endHourMin));
            
            java.time.ZonedDateTime startZdt = startLdt.atZone(java.time.ZoneId.systemDefault());
            java.time.ZonedDateTime endZdt = endLdt.atZone(java.time.ZoneId.systemDefault());
            
            body.put("start", Map.of("dateTime", startZdt.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME)));
            body.put("end", Map.of("dateTime", endZdt.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME)));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            restTemplate.postForEntity(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                request,
                String.class
            );
            
            log.info("Successfully pushed PlannerTask {} to Google Calendar", task.getId());
        } catch (Exception e) {
            log.error("Failed to push task to Google Calendar", e);
        }
    }
}
