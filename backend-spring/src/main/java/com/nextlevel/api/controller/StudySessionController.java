package com.nextlevel.api.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.model.StudySession;
import com.nextlevel.api.repository.StudySessionRepository;
import com.nextlevel.api.service.GamificationService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/study")
public class StudySessionController {

    private final StudySessionRepository studySessionRepository;
    private final GamificationService gamificationService;

    public StudySessionController(StudySessionRepository studySessionRepository, GamificationService gamificationService) {
        this.studySessionRepository = studySessionRepository;
        this.gamificationService = gamificationService;
    }

    @PostMapping("/session")
    public ResponseEntity<ApiResponse<StudySession>> logSession(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        
        String userId = null;
        if (request.getAttribute("user") != null) {
            Map<String, Object> userMap = (Map<String, Object>) request.getAttribute("user");
            userId = (String) userMap.get("id");
        }
        
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Integer durationMinutes = (Integer) payload.get("durationMinutes");
        if (durationMinutes == null || durationMinutes <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("durationMinutes is required and must be positive"));
        }

        StudySession session = new StudySession();
        session.setUserId(userId);
        session.setDurationMinutes(durationMinutes);
        session.setTaskId((String) payload.get("taskId"));
        session.setNotes((String) payload.get("notes"));
        
        Instant now = Instant.now();
        session.setEndTime(now);
        session.setStartTime(now.minusSeconds(durationMinutes * 60L));
        session.setCreatedAt(now);

        StudySession saved = studySessionRepository.save(session);
        
        // Award XP: 5 XP per 5 minutes of focus
        int xpAward = (durationMinutes / 5) * 5;
        if (xpAward > 0) {
            gamificationService.awardXp(userId, xpAward, "Completed " + durationMinutes + " min focus session");
        }

        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
