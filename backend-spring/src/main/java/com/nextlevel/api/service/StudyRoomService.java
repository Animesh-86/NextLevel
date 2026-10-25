package com.nextlevel.api.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nextlevel.api.dto.CreateChallengeRequest;
import com.nextlevel.api.dto.CreateRoomRequest;
import com.nextlevel.api.dto.PostMessageRequest;
import com.nextlevel.api.dto.UpdateChallengeScoreRequest;
import com.nextlevel.api.dto.UpdatePresenceRequest;
import com.nextlevel.api.model.RoomMessage;
import com.nextlevel.api.model.StudyRoom;
import com.nextlevel.api.model.StudyRoom.ParticipantInfo;
import com.nextlevel.api.repository.RoomMessageRepository;
import com.nextlevel.api.repository.StudyRoomRepository;
import com.nextlevel.api.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StudyRoomService {

    private final StudyRoomRepository studyRoomRepository;
    private final RoomMessageRepository roomMessageRepository;
    private final UserRepository userRepository;
    private final StudyRoomChallengeService challengeService;
    private final StudyRoomMessageService messageService;
    private final SecureRandom random = new SecureRandom();

    public StudyRoomService(StudyRoomRepository studyRoomRepository,
                            RoomMessageRepository roomMessageRepository,
                            UserRepository userRepository,
                            StudyRoomChallengeService challengeService,
                            StudyRoomMessageService messageService) {
        this.studyRoomRepository = studyRoomRepository;
        this.roomMessageRepository = roomMessageRepository;
        this.userRepository = userRepository;
        this.challengeService = challengeService;
        this.messageService = messageService;
    }

    public String resolveDisplayName(String userId) {
        if (userId == null) return "Student";
        return userRepository.findById(userId)
                .map(u -> {
                    if (u.getName() != null && !u.getName().isBlank()) {
                        return u.getName().trim();
                    }
                    if (u.getEmail() != null && u.getEmail().contains("@")) {
                        String prefix = u.getEmail().split("@")[0];
                        return prefix.substring(0, 1).toUpperCase() + prefix.substring(1);
                    }
                    return "Student";
                })
                .orElse("Student");
    }

    public StudyRoom createRoom(String userId, CreateRoomRequest req) {
        String roomCode = generateUniqueRoomCode();
        String displayName = resolveDisplayName(userId);

        ParticipantInfo host = ParticipantInfo.builder()
                .userId(userId)
                .userName(displayName)
                .status("FOCUSING")
                .currentTask("Host")
                .timerSecondsLeft(1500)
                .joinedAt(Instant.now())
                .lastHeartbeat(Instant.now())
                .build();

        List<ParticipantInfo> participants = new ArrayList<>();
        participants.add(host);

        Instant expiresAt = null;
        if (req.getExpiryMinutes() != null && req.getExpiryMinutes() > 0) {
            expiresAt = Instant.now().plus(req.getExpiryMinutes(), ChronoUnit.MINUTES);
        }

        StudyRoom room = StudyRoom.builder()
                .roomCode(roomCode)
                .title(req.getTitle().trim())
                .description(req.getDescription() != null ? req.getDescription().trim() : "")
                .category("general")
                .hostUserId(userId)
                .hostUserName(displayName)
                .isPrivate(Boolean.TRUE.equals(req.getIsPrivate()))
                .accessPin(Boolean.TRUE.equals(req.getIsPrivate()) ? req.getAccessPin() : null)
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 25)
                .timerMode("INDEPENDENT")
                .ambientSound("none")
                .timerDuration(1500)
                .timerState("IDLE")
                .expiresAt(expiresAt)
                .expiryMinutes(req.getExpiryMinutes())
                .participants(participants)
                .participantCount(1)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        StudyRoom saved = studyRoomRepository.save(room);

        // Add welcome message (No "lounge", no "✨")
        RoomMessage welcome = RoomMessage.builder()
                .roomId(saved.getId())
                .userId("system")
                .userName("System")
                .content(displayName + " opened study room \"" + saved.getTitle() + "\". Welcome!")
                .type("SYSTEM")
                .createdAt(Instant.now())
                .build();
        roomMessageRepository.save(welcome);

        return saved;
    }

    public List<StudyRoom> listRooms(String search) {
        List<StudyRoom> rooms = studyRoomRepository.findByActiveTrueOrderByUpdatedAtDesc();

        Instant now = Instant.now();
        Instant cutoff = now.minus(75, ChronoUnit.SECONDS);
        boolean anyUpdated = false;

        Iterator<StudyRoom> iter = rooms.iterator();
        while (iter.hasNext()) {
            StudyRoom room = iter.next();

            // Check auto-expiry
            if (room.getExpiresAt() != null && now.isAfter(room.getExpiresAt())) {
                studyRoomRepository.delete(room);
                iter.remove();
                continue;
            }

            if (cleanupStaleParticipants(room, cutoff)) {
                studyRoomRepository.save(room);
                anyUpdated = true;
            }

            if (search != null && !search.isBlank()) {
                String term = search.toLowerCase();
                boolean match = (room.getTitle() != null && room.getTitle().toLowerCase().contains(term))
                        || (room.getRoomCode() != null && room.getRoomCode().toLowerCase().contains(term))
                        || (room.getDescription() != null && room.getDescription().toLowerCase().contains(term))
                        || (room.getHostUserName() != null && room.getHostUserName().toLowerCase().contains(term));
                if (!match) {
                    iter.remove();
                }
            }
        }

        return rooms;
    }

    public Optional<StudyRoom> getRoomByIdOrCode(String idOrCode) {
        Optional<StudyRoom> room = studyRoomRepository.findById(idOrCode);
        if (room.isEmpty()) {
            room = studyRoomRepository.findByRoomCode(idOrCode.toUpperCase());
        }

        if (room.isPresent()) {
            StudyRoom r = room.get();
            // Check auto-expiry
            if (r.getExpiresAt() != null && Instant.now().isAfter(r.getExpiresAt())) {
                studyRoomRepository.delete(r);
                return Optional.empty();
            }

            if (cleanupStaleParticipants(r, Instant.now().minus(75, ChronoUnit.SECONDS))) {
                studyRoomRepository.save(r);
            }
        }
        return room;
    }

    public StudyRoom extendRoom(String roomId, String userId, int minutes) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (!userId.equals(room.getHostUserId())) {
            boolean isMember = room.getParticipants() != null && room.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));
            if (!isMember) {
                throw new IllegalArgumentException("Only room members can adjust the room timer");
            }
        }

        Instant currentExpiry = room.getExpiresAt() != null ? room.getExpiresAt() : Instant.now().plus(30, ChronoUnit.MINUTES);
        Instant newExpiry = currentExpiry.plus(minutes, ChronoUnit.MINUTES);
        if (newExpiry.isBefore(Instant.now().plus(1, ChronoUnit.MINUTES))) {
            newExpiry = Instant.now().plus(1, ChronoUnit.MINUTES);
        }
        room.setExpiresAt(newExpiry);
        room.setUpdatedAt(Instant.now());
        StudyRoom saved = studyRoomRepository.save(room);

        String sign = minutes >= 0 ? "+" : "";
        RoomMessage msg = RoomMessage.builder()
                .roomId(room.getId())
                .userId("system")
                .userName("System")
                .content("Room timer adjusted (" + sign + minutes + "m) by " + resolveDisplayName(userId))
                .type("SYSTEM")
                .createdAt(Instant.now())
                .build();
        roomMessageRepository.save(msg);

        return saved;
    }

    public StudyRoom joinRoom(String roomId, String userId, String pin) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (Boolean.TRUE.equals(room.getIsPrivate())) {
            if (room.getAccessPin() != null && !room.getAccessPin().equals(pin)) {
                throw new IllegalArgumentException("Incorrect 4-digit PIN for private room");
            }
        }

        String displayName = resolveDisplayName(userId);

        if (room.getParticipants() == null) {
            room.setParticipants(new ArrayList<>());
        }

        boolean alreadyInRoom = room.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));

        if (!alreadyInRoom) {
            if (room.getParticipants().size() >= room.getMaxParticipants()) {
                throw new IllegalStateException("Room is full (max " + room.getMaxParticipants() + " participants)");
            }

            ParticipantInfo p = ParticipantInfo.builder()
                    .userId(userId)
                    .userName(displayName)
                    .status("FOCUSING")
                    .currentTask("Studying")
                    .timerSecondsLeft(room.getTimerDuration())
                    .joinedAt(Instant.now())
                    .lastHeartbeat(Instant.now())
                    .build();

            room.getParticipants().add(p);
            room.setParticipantCount(room.getParticipants().size());
            room.setUpdatedAt(Instant.now());

            studyRoomRepository.save(room);

            // Avoid duplicate join messages within 2 minutes
            Instant recentCutoff = Instant.now().minus(2, ChronoUnit.MINUTES);
            List<RoomMessage> recentMessages = roomMessageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
            boolean recentJoinExists = recentMessages.stream()
                    .anyMatch(m -> "SYSTEM".equals(m.getType())
                            && m.getContent() != null
                            && m.getContent().contains(displayName + " joined the room")
                            && m.getCreatedAt() != null
                            && m.getCreatedAt().isAfter(recentCutoff));

            if (!recentJoinExists) {
                messageService.saveSystemMessage(room.getId(), displayName + " joined the room.");
            }
        } else {
            // Refresh heartbeat and name
            room.getParticipants().stream()
                    .filter(p -> p.getUserId().equals(userId))
                    .findFirst()
                    .ifPresent(p -> {
                        p.setUserName(displayName);
                        p.setLastHeartbeat(Instant.now());
                    });
            studyRoomRepository.save(room);
        }

        return room;
    }

    public void leaveRoom(String roomId, String userId) {
        Optional<StudyRoom> roomOpt = getRoomByIdOrCode(roomId);
        if (roomOpt.isEmpty()) return;

        StudyRoom room = roomOpt.get();
        if (room.getParticipants() != null) {
            boolean removed = room.getParticipants().removeIf(p -> p.getUserId().equals(userId));
            if (removed) {
                room.setParticipantCount(room.getParticipants().size());
                room.setUpdatedAt(Instant.now());
                studyRoomRepository.save(room);
            }
        }
    }

    public void deleteRoom(String idOrCode, String userId) {
        StudyRoom room = getRoomByIdOrCode(idOrCode)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (!userId.equals(room.getHostUserId())) {
            throw new IllegalArgumentException("Only the host can delete this room");
        }

        studyRoomRepository.delete(room);
        messageService.deleteAllForRoom(room.getId());
    }

    public void clearAllTestRooms() {
        studyRoomRepository.deleteAll();
        messageService.clearAll();
    }

    public StudyRoom createChallenge(String roomId, String userId, CreateChallengeRequest req) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return challengeService.createChallenge(room, userId, resolveDisplayName(userId), req);
    }

    public StudyRoom startChallenge(String roomId, String userId) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return challengeService.startChallenge(room);
    }

    public StudyRoom updateChallengeScore(String roomId, String userId, UpdateChallengeScoreRequest req) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return challengeService.updateChallengeScore(room, userId, resolveDisplayName(userId), req);
    }

    public StudyRoom dismissChallenge(String roomId, String userId, boolean wasCancelled) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return challengeService.dismissChallenge(room, wasCancelled);
    }

    public StudyRoom dismissChallenge(String roomId, String userId) {
        return dismissChallenge(roomId, userId, false);
    }

    public StudyRoom setPeerGoal(String roomId, String userId, String goal) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (room.getParticipants() != null) {
            for (ParticipantInfo p : room.getParticipants()) {
                if (p.getUserId().equals(userId)) {
                    p.setGoal(goal);
                    break;
                }
            }
            room.setUpdatedAt(Instant.now());
            return studyRoomRepository.save(room);
        }
        return room;
    }

    public StudyRoom kickUser(String roomId, String hostUserId, String targetUserId) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (!hostUserId.equals(room.getHostUserId())) {
            throw new IllegalArgumentException("Only the room host can remove participants");
        }

        if (room.getParticipants() != null) {
            room.getParticipants().removeIf(p -> p.getUserId().equals(targetUserId));
            room.setParticipantCount(room.getParticipants().size());
            room.setUpdatedAt(Instant.now());
            return studyRoomRepository.save(room);
        }
        return room;
    }

    public StudyRoom transferHost(String roomId, String hostUserId, String targetUserId) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (!hostUserId.equals(room.getHostUserId())) {
            throw new IllegalArgumentException("Only the current host can transfer host ownership");
        }

        String targetName = resolveDisplayName(targetUserId);
        room.setHostUserId(targetUserId);
        room.setHostUserName(targetName);
        room.setUpdatedAt(Instant.now());

        messageService.saveSystemMessage(room.getId(), targetName + " is now the room host.");
        return studyRoomRepository.save(room);
    }

    public StudyRoom updatePresence(String roomId, String userId, UpdatePresenceRequest req) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));

        if (room.getParticipants() == null) {
            room.setParticipants(new ArrayList<>());
        }

        boolean found = false;
        for (ParticipantInfo p : room.getParticipants()) {
            if (p.getUserId().equals(userId)) {
                if (req.getStatus() != null) p.setStatus(req.getStatus());
                if (req.getCurrentTask() != null) p.setCurrentTask(req.getCurrentTask());
                if (req.getTimerSecondsLeft() != null) p.setTimerSecondsLeft(req.getTimerSecondsLeft());
                p.setLastHeartbeat(Instant.now());
                found = true;
                break;
            }
        }

        if (!found) {
            String displayName = resolveDisplayName(userId);
            ParticipantInfo p = ParticipantInfo.builder()
                    .userId(userId)
                    .userName(displayName)
                    .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                    .currentTask(req.getCurrentTask() != null ? req.getCurrentTask() : "Studying")
                    .timerSecondsLeft(req.getTimerSecondsLeft() != null ? req.getTimerSecondsLeft() : 1500)
                    .joinedAt(Instant.now())
                    .lastHeartbeat(Instant.now())
                    .build();
            room.getParticipants().add(p);
        }

        room.setParticipantCount(room.getParticipants().size());
        room.setUpdatedAt(Instant.now());
        return studyRoomRepository.save(room);
    }

    public RoomMessage postMessage(String roomId, String userId, PostMessageRequest req) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return messageService.postMessage(room, userId, resolveDisplayName(userId), req);
    }

    public List<RoomMessage> getRoomMessages(String roomId) {
        StudyRoom room = getRoomByIdOrCode(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Study Room not found"));
        return messageService.getRoomMessages(room.getId());
    }

    private boolean cleanupStaleParticipants(StudyRoom room, Instant cutoff) {
        if (room.getParticipants() == null || room.getParticipants().isEmpty()) {
            return false;
        }
        int initialSize = room.getParticipants().size();
        room.getParticipants().removeIf(p -> p.getLastHeartbeat() != null && p.getLastHeartbeat().isBefore(cutoff));
        if (room.getParticipants().size() != initialSize) {
            room.setParticipantCount(room.getParticipants().size());
            room.setUpdatedAt(Instant.now());
            return true;
        }
        return false;
    }

    private String generateUniqueRoomCode() {
        for (int i = 0; i < 10; i++) {
            String code = "NL-" + (1000 + random.nextInt(9000));
            if (studyRoomRepository.findByRoomCode(code).isEmpty()) {
                return code;
            }
        }
        return "NL-" + System.currentTimeMillis() % 10000;
    }
}
