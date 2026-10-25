package com.nextlevel.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nextlevel.api.dto.ApiResponse;
import com.nextlevel.api.dto.CreateChallengeRequest;
import com.nextlevel.api.dto.CreateRoomRequest;
import com.nextlevel.api.dto.PostMessageRequest;
import com.nextlevel.api.dto.UpdateChallengeScoreRequest;
import com.nextlevel.api.dto.UpdatePresenceRequest;
import com.nextlevel.api.model.RoomMessage;
import com.nextlevel.api.model.StudyRoom;
import com.nextlevel.api.security.CurrentUser;
import com.nextlevel.api.service.StudyRoomService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/rooms")
public class StudyRoomController {

    private final StudyRoomService studyRoomService;
    private final HttpServletRequest httpServletRequest;

    public StudyRoomController(StudyRoomService studyRoomService, HttpServletRequest httpServletRequest) {
        this.studyRoomService = studyRoomService;
        this.httpServletRequest = httpServletRequest;
    }

    private String getEffectiveUserId(CurrentUser currentUser) {
        if (currentUser != null && currentUser.getUserId() != null) {
            return currentUser.getUserId();
        }
        if (httpServletRequest != null) {
            String guestHeader = httpServletRequest.getHeader("X-Guest-Id");
            if (guestHeader != null && !guestHeader.isBlank()) {
                return guestHeader.trim();
            }
        }
        return "guest-student";
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudyRoom>> createRoom(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Validated @RequestBody CreateRoomRequest request) {
        String userId = getEffectiveUserId(currentUser);
        log.info("Creating study room for user: {}", userId);
        StudyRoom created = studyRoomService.createRoom(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyRoom>>> listRooms(
            @RequestParam(required = false) String search) {
        List<StudyRoom> rooms = studyRoomService.listRooms(search);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/{idOrCode}")
    public ResponseEntity<ApiResponse<StudyRoom>> getRoom(@PathVariable String idOrCode) {
        return studyRoomService.getRoomByIdOrCode(idOrCode)
                .map(room -> ResponseEntity.ok(ApiResponse.success(room)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Room not found or expired")));
    }

    @PostMapping("/{idOrCode}/join")
    public ResponseEntity<ApiResponse<StudyRoom>> joinRoom(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestParam(required = false) String pin) {
        try {
            StudyRoom room = studyRoomService.joinRoom(idOrCode, getEffectiveUserId(currentUser), pin);
            return ResponseEntity.ok(ApiResponse.success(room));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{idOrCode}/leave")
    public ResponseEntity<ApiResponse<String>> leaveRoom(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode) {
        studyRoomService.leaveRoom(idOrCode, getEffectiveUserId(currentUser));
        return ResponseEntity.ok(ApiResponse.success("Left room successfully"));
    }

    @PostMapping("/{idOrCode}/extend")
    public ResponseEntity<ApiResponse<StudyRoom>> extendRoom(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestParam(defaultValue = "30") int minutes) {
        try {
            StudyRoom extended = studyRoomService.extendRoom(idOrCode, getEffectiveUserId(currentUser), minutes);
            return ResponseEntity.ok(ApiResponse.success(extended));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{idOrCode}")
    public ResponseEntity<ApiResponse<String>> deleteRoom(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode) {
        try {
            studyRoomService.deleteRoom(idOrCode, getEffectiveUserId(currentUser));
            return ResponseEntity.ok(ApiResponse.success("Room deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{idOrCode}/challenge")
    public ResponseEntity<ApiResponse<StudyRoom>> createChallenge(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @Validated @RequestBody CreateChallengeRequest request) {
        try {
            StudyRoom room = studyRoomService.createChallenge(idOrCode, getEffectiveUserId(currentUser), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(room));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{idOrCode}/challenge/start")
    public ResponseEntity<ApiResponse<StudyRoom>> startChallenge(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode) {
        StudyRoom room = studyRoomService.startChallenge(idOrCode, getEffectiveUserId(currentUser));
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @PutMapping("/{idOrCode}/challenge/score")
    public ResponseEntity<ApiResponse<StudyRoom>> updateChallengeScore(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestBody UpdateChallengeScoreRequest request) {
        StudyRoom room = studyRoomService.updateChallengeScore(idOrCode, getEffectiveUserId(currentUser), request);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @DeleteMapping("/{idOrCode}/challenge")
    public ResponseEntity<ApiResponse<StudyRoom>> dismissChallenge(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestParam(required = false) String reason) {
        boolean wasCancelled = "cancelled".equalsIgnoreCase(reason);
        StudyRoom room = studyRoomService.dismissChallenge(idOrCode, getEffectiveUserId(currentUser), wasCancelled);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @PostMapping("/cleanup-test-rooms")
    public ResponseEntity<ApiResponse<String>> cleanupTestRooms() {
        studyRoomService.clearAllTestRooms();
        return ResponseEntity.ok(ApiResponse.success("All test rooms cleared successfully"));
    }

    @PutMapping("/{idOrCode}/goal")
    public ResponseEntity<ApiResponse<StudyRoom>> setGoal(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestParam String goal) {
        StudyRoom updated = studyRoomService.setPeerGoal(idOrCode, getEffectiveUserId(currentUser), goal);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PostMapping("/{idOrCode}/kick/{targetUserId}")
    public ResponseEntity<ApiResponse<StudyRoom>> kickUser(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @PathVariable String targetUserId) {
        try {
            StudyRoom updated = studyRoomService.kickUser(idOrCode, getEffectiveUserId(currentUser), targetUserId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{idOrCode}/transfer-host/{targetUserId}")
    public ResponseEntity<ApiResponse<StudyRoom>> transferHost(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @PathVariable String targetUserId) {
        try {
            StudyRoom updated = studyRoomService.transferHost(idOrCode, getEffectiveUserId(currentUser), targetUserId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{idOrCode}/presence")
    public ResponseEntity<ApiResponse<StudyRoom>> updatePresence(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @RequestBody UpdatePresenceRequest request) {
        StudyRoom updated = studyRoomService.updatePresence(idOrCode, getEffectiveUserId(currentUser), request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }


    @GetMapping("/{idOrCode}/messages")
    public ResponseEntity<ApiResponse<List<RoomMessage>>> getRoomMessages(@PathVariable String idOrCode) {
        List<RoomMessage> messages = studyRoomService.getRoomMessages(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{idOrCode}/messages")
    public ResponseEntity<ApiResponse<RoomMessage>> postMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String idOrCode,
            @Validated @RequestBody PostMessageRequest request) {
        RoomMessage saved = studyRoomService.postMessage(
                idOrCode,
                getEffectiveUserId(currentUser),
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }
}
